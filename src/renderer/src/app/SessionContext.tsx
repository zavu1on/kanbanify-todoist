import {
  createContext,
  type FC,
  type PropsWithChildren,
  use,
  useEffect,
  useState,
} from "react";
import type { SessionCheckResult } from "@/main/auth";

type SessionUser = Extract<
  SessionCheckResult,
  { status: "authenticated" }
>["user"];

type SessionState =
  | { status: "loading" }
  | { status: "authenticated"; user: SessionUser }
  | { status: "unauthenticated"; errorMessage?: string };

type SessionContextValue = SessionState & {
  authenticate: (user: SessionUser) => void;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export const SessionProvider: FC<PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    window.api.auth.checkSession().then((result) => {
      if (result.status === "authenticated") {
        setSession({ status: "authenticated", user: result.user });
      } else if (result.status === "no_token") {
        setSession({ status: "unauthenticated" });
      } else {
        setSession({
          status: "unauthenticated",
          errorMessage: result.error.message,
        });
      }
    });
  }, []);

  const authenticate = (user: SessionUser) => {
    setSession({ status: "authenticated", user });
  };

  const logout = async () => {
    await window.api.auth.logout();
    setSession({ status: "unauthenticated" });
  };

  return (
    <SessionContext.Provider value={{ ...session, authenticate, logout }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextValue => {
  const context = use(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

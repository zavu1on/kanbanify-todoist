import {
  createContext,
  type FC,
  type PropsWithChildren,
  use,
  useCallback,
  useEffect,
  useRef,
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
  | { status: "unauthenticated"; hasStoredToken: false }
  | { status: "unauthenticated"; hasStoredToken: true; errorMessage: string };

type SessionContextValue = SessionState & {
  isRechecking: boolean;
  recheckSession: () => void;
  authenticate: (user: SessionUser) => void;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const toSessionState = (result: SessionCheckResult): SessionState => {
  if (result.status === "authenticated") {
    return { status: "authenticated", user: result.user };
  }
  if (result.status === "no_token") {
    return { status: "unauthenticated", hasStoredToken: false };
  }
  return {
    status: "unauthenticated",
    hasStoredToken: true,
    errorMessage: result.error.message,
  };
};

export const SessionProvider: FC<PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const [isRechecking, setIsRechecking] = useState(false);
  const isRecheckingRef = useRef(false);

  useEffect(() => {
    window.api.auth.checkSession().then((result) => {
      setSession(toSessionState(result));
    });
  }, []);

  const recheckSession = useCallback(() => {
    if (isRecheckingRef.current) return;
    isRecheckingRef.current = true;
    setIsRechecking(true);
    window.api.auth
      .checkSession()
      .then((result) => setSession(toSessionState(result)))
      .finally(() => {
        isRecheckingRef.current = false;
        setIsRechecking(false);
      });
  }, []);

  // Retrying only helps when a token is actually on disk — this refires the
  // login attempt when the login screen regains focus (tray, app switch),
  // so a transient network error at startup no longer requires a manual re-enter.
  const hasStoredToken =
    session.status === "unauthenticated" && session.hasStoredToken;
  useEffect(() => {
    if (session.status !== "unauthenticated" || !hasStoredToken) return;
    window.addEventListener("focus", recheckSession);
    return () => window.removeEventListener("focus", recheckSession);
  }, [session.status, hasStoredToken, recheckSession]);

  const authenticate = (user: SessionUser) => {
    setSession({ status: "authenticated", user });
  };

  const logout = async () => {
    await window.api.auth.logout();
    setSession({ status: "unauthenticated", hasStoredToken: false });
  };

  return (
    <SessionContext.Provider
      value={{ ...session, isRechecking, recheckSession, authenticate, logout }}
    >
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

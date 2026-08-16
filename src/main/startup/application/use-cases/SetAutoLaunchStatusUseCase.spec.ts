import { describe, expect, it, vi } from "vitest";
import type { IAutoLaunchGateway } from "../ports/IAutoLaunchGateway";
import { SetAutoLaunchStatusUseCase } from "./SetAutoLaunchStatusUseCase";

describe("SetAutoLaunchStatusUseCase", () => {
  it("registers the new state with the gateway and returns the confirmed state", async () => {
    const autoLaunchGateway: IAutoLaunchGateway = {
      isEnabled: vi.fn().mockReturnValue(true),
      setEnabled: vi.fn(),
    };
    const useCase = new SetAutoLaunchStatusUseCase(autoLaunchGateway);

    await expect(useCase.execute(true)).resolves.toBe(true);
    expect(autoLaunchGateway.setEnabled).toHaveBeenCalledWith(true);
    expect(autoLaunchGateway.isEnabled).toHaveBeenCalledOnce();
  });

  it("propagates errors from the gateway", async () => {
    const autoLaunchGateway: IAutoLaunchGateway = {
      isEnabled: vi.fn(),
      setEnabled: vi.fn().mockImplementation(() => {
        throw new Error("registry write failed");
      }),
    };
    const useCase = new SetAutoLaunchStatusUseCase(autoLaunchGateway);

    await expect(useCase.execute(true)).rejects.toThrow("registry write failed");
  });
});

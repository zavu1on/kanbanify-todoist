import { describe, expect, it, vi } from "vitest";
import type { IAutoLaunchGateway } from "../ports/IAutoLaunchGateway";
import { GetAutoLaunchStatusUseCase } from "./GetAutoLaunchStatusUseCase";

describe("GetAutoLaunchStatusUseCase", () => {
  it("returns the gateway's current auto-launch state", async () => {
    const autoLaunchGateway: IAutoLaunchGateway = {
      isEnabled: vi.fn().mockReturnValue(true),
      setEnabled: vi.fn(),
    };
    const useCase = new GetAutoLaunchStatusUseCase(autoLaunchGateway);

    await expect(useCase.execute()).resolves.toBe(true);
    expect(autoLaunchGateway.isEnabled).toHaveBeenCalledOnce();
  });

  it("propagates errors from the gateway", async () => {
    const autoLaunchGateway: IAutoLaunchGateway = {
      isEnabled: vi.fn().mockImplementation(() => {
        throw new Error("registry read failed");
      }),
      setEnabled: vi.fn(),
    };
    const useCase = new GetAutoLaunchStatusUseCase(autoLaunchGateway);

    await expect(useCase.execute()).rejects.toThrow("registry read failed");
  });
});

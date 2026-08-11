import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import { InvalidAttachmentSessionError } from "../../domain/errors/InvalidAttachmentSessionError";
import type { IAttachmentGateway } from "../ports/IAttachmentGateway";
import { DownloadAttachmentUseCase } from "./DownloadAttachmentUseCase";

describe("DownloadAttachmentUseCase", () => {
  it("throws InvalidAttachmentSessionError when there is no stored token", async () => {
    const attachmentGateway: IAttachmentGateway = {
      upload: vi.fn(),
      delete: vi.fn(),
      download: vi.fn(),
    };
    const tokenStore: ITokenStore = {
      save: vi.fn(),
      load: vi.fn().mockResolvedValue(null),
      clear: vi.fn(),
    };
    const useCase = new DownloadAttachmentUseCase(
      attachmentGateway,
      tokenStore,
    );

    await expect(
      useCase.execute("https://files.todoist.com/report.pdf"),
    ).rejects.toThrow(InvalidAttachmentSessionError);
  });

  it("delegates to the gateway with the stored token", async () => {
    const bytes = Buffer.from("pdf-bytes");
    const attachmentGateway: IAttachmentGateway = {
      upload: vi.fn(),
      delete: vi.fn(),
      download: vi.fn().mockResolvedValue(bytes),
    };
    const tokenStore: ITokenStore = {
      save: vi.fn(),
      load: vi.fn().mockResolvedValue(AccessToken.of("a".repeat(32))),
      clear: vi.fn(),
    };
    const useCase = new DownloadAttachmentUseCase(
      attachmentGateway,
      tokenStore,
    );

    const result = await useCase.execute(
      "https://files.todoist.com/report.pdf",
    );

    expect(result).toBe(bytes);
    expect(attachmentGateway.download).toHaveBeenCalledWith(
      "a".repeat(32),
      "https://files.todoist.com/report.pdf",
    );
  });
});

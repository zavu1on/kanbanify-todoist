import fs from "node:fs/promises";
import { dialog, ipcMain } from "electron";
import type { IpcController } from "../../shared/IpcController";
import type { DownloadAttachmentUseCase } from "../application/use-cases/DownloadAttachmentUseCase";
import type { AttachmentsErrorType } from "../domain/contracts/AttachmentsFailure";
import type { DownloadAttachmentRequest } from "../domain/contracts/DownloadAttachmentRequest";
import type { DownloadAttachmentResult } from "../domain/contracts/DownloadAttachmentResult";
import { AttachmentsError } from "../domain/errors/AttachmentsError";
import { InvalidAttachmentSessionError } from "../domain/errors/InvalidAttachmentSessionError";
import { TodoistAttachmentsConnectionError } from "../domain/errors/TodoistAttachmentsConnectionError";

export class AttachmentsIpcController implements IpcController {
  constructor(
    private readonly downloadAttachmentUseCase: DownloadAttachmentUseCase,
  ) {}

  register(): void {
    ipcMain.handle(
      "attachments:download",
      (
        _event,
        request: DownloadAttachmentRequest,
      ): Promise<DownloadAttachmentResult> => this.download(request),
    );
  }

  private async download(
    request: DownloadAttachmentRequest,
  ): Promise<DownloadAttachmentResult> {
    if (
      typeof request?.fileUrl !== "string" ||
      typeof request?.fileName !== "string"
    ) {
      return {
        ok: false,
        error: {
          type: "unknown",
          message: "Invalid attachment download request",
        },
      };
    }

    try {
      const bytes = await this.downloadAttachmentUseCase.execute(
        request.fileUrl,
      );
      const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: request.fileName,
      });
      if (canceled || !filePath) return { ok: true, saved: false };

      await fs.writeFile(filePath, bytes);
      return { ok: true, saved: true, filePath };
    } catch (error) {
      return {
        ok: false,
        error: {
          type: this.getErrorType(error),
          message: this.getMessageFromError(error),
        },
      };
    }
  }

  private getErrorType(error: unknown): AttachmentsErrorType {
    if (error instanceof InvalidAttachmentSessionError) return "auth_error";
    if (error instanceof TodoistAttachmentsConnectionError)
      return "network_error";
    return "unknown";
  }

  private getMessageFromError(error: unknown): string {
    if (error instanceof AttachmentsError) return error.message;
    return error instanceof Error
      ? error.message
      : "Unknown error while downloading the file";
  }
}

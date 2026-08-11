import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import { InvalidAttachmentSessionError } from "../../domain/errors/InvalidAttachmentSessionError";
import type { IAttachmentGateway } from "../ports/IAttachmentGateway";

export class DownloadAttachmentUseCase implements UseCase<string, Buffer> {
  constructor(
    private readonly attachmentGateway: IAttachmentGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(fileUrl: string): Promise<Buffer> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidAttachmentSessionError();

    return this.attachmentGateway.download(accessToken.value, fileUrl);
  }
}

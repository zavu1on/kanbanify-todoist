import { ipcMain } from "electron";
import type { IpcController } from "../../shared/IpcController";
import { CreateLabelInput } from "../application/dtos/CreateLabelInput";
import type { CreateLabelUseCase } from "../application/use-cases/CreateLabelUseCase";
import type { ListLabelsUseCase } from "../application/use-cases/ListLabelsUseCase";
import type { CreateLabelRequest } from "../domain/contracts/CreateLabelRequest";
import type { CreateLabelResult } from "../domain/contracts/CreateLabelResult";
import type { LabelsErrorType } from "../domain/contracts/LabelsFailure";
import type { LabelsListResult } from "../domain/contracts/LabelsListResult";
import { InvalidLabelNameError } from "../domain/errors/InvalidLabelNameError";
import { InvalidLabelSessionError } from "../domain/errors/InvalidLabelSessionError";
import { LabelsError } from "../domain/errors/LabelsError";
import { TodoistLabelsConnectionError } from "../domain/errors/TodoistLabelsConnectionError";
import { LabelMapper } from "../domain/mappers/LabelMapper";

export class LabelsIpcController implements IpcController {
  private readonly labelMapper = new LabelMapper();

  constructor(
    private readonly listLabelsUseCase: ListLabelsUseCase,
    private readonly createLabelUseCase: CreateLabelUseCase,
  ) {}

  register(): void {
    ipcMain.handle("labels:list", (): Promise<LabelsListResult> => this.list());
    ipcMain.handle(
      "labels:create",
      (_event, input: CreateLabelRequest): Promise<CreateLabelResult> =>
        this.create(input),
    );
  }

  private async list(): Promise<LabelsListResult> {
    try {
      const labels = await this.listLabelsUseCase.execute();
      return {
        ok: true,
        labels: labels.map((label) => this.labelMapper.toDTO(label)),
      };
    } catch (error) {
      return this.toFailure(error);
    }
  }

  private async create(input: CreateLabelRequest): Promise<CreateLabelResult> {
    try {
      const label = await this.createLabelUseCase.execute(
        new CreateLabelInput(input.name),
      );
      return { ok: true, label: this.labelMapper.toDTO(label) };
    } catch (error) {
      return this.toFailure(error);
    }
  }

  private toFailure(error: unknown): {
    ok: false;
    error: { type: LabelsErrorType; message: string };
  } {
    return {
      ok: false,
      error: {
        type: this.getErrorType(error),
        message: this.getMessageFromError(error),
      },
    };
  }

  private getErrorType(error: unknown): LabelsErrorType {
    if (error instanceof InvalidLabelSessionError) return "auth_error";
    if (error instanceof TodoistLabelsConnectionError) return "network_error";
    if (error instanceof InvalidLabelNameError) return "invalid_name";
    return "unknown";
  }

  private getMessageFromError(error: unknown): string {
    if (error instanceof LabelsError) return error.message;
    return error instanceof Error
      ? error.message
      : "Unknown error while loading labels";
  }
}

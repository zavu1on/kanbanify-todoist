import {
  ActionIcon,
  Box,
  Button,
  CloseButton,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { AttachFileIcon, FileTextIcon } from "lucide-animated";
import {
  type ChangeEvent,
  type DragEvent,
  type FC,
  type KeyboardEvent,
  useRef,
  useState,
} from "react";
import { MAX_ATTACHMENT_SIZE_BYTES } from "@/main/attachments";
import type { CommentAttachment } from "@/main/comments";
import type { CommentFormAttachmentChange } from "../model/attachmentChange";
import { commentFormSchema } from "../model/commentFormSchema";
import { DiscardCommentModal } from "./DiscardCommentModal";

const MAX_ATTACHMENT_SIZE_MB = MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024);

/** A comment carries at most one attachment (Todoist's `fileAttachment` is
 * not an array) — this slot models the one thing that can be attached,
 * whatever it currently is. */
type AttachmentSlot =
  | { kind: "none" }
  | { kind: "existing"; attachment: CommentAttachment }
  | { kind: "pending"; file: File };

type CommentFormProps = {
  mode: "create" | "edit";
  /** Absent in create mode. */
  initialContent?: string;
  /** The comment's current attachment, if any — absent/`null` in create mode. */
  initialAttachment?: CommentAttachment | null;
  isSubmitting?: boolean;
  onSubmit: (
    content: string,
    attachmentChange: CommentFormAttachmentChange,
  ) => void;
  onCancel: () => void;
};

/**
 * Shared by "Add new comment" and "Edit comment" (see `CommentsSection`) — the
 * only difference is the submit button's label, whether `initialContent`
 * seeds the field, and whether an existing attachment can be shown/removed.
 */
export const CommentForm: FC<CommentFormProps> = ({
  mode,
  initialContent = "",
  initialAttachment = null,
  isSubmitting,
  onSubmit,
  onCancel,
}) => {
  const form = useForm({
    initialValues: { content: initialContent },
    validate: schemaResolver(commentFormSchema, { sync: true }),
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachment, setAttachment] = useState<AttachmentSlot>(
    initialAttachment
      ? { kind: "existing", attachment: initialAttachment }
      : { kind: "none" },
  );
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  const attachmentIsDirty =
    attachment.kind === "pending" ||
    (attachment.kind === "none" && initialAttachment !== null);
  const isDirty = form.isDirty() || attachmentIsDirty;

  const requestCancel = () => {
    if (isDirty) {
      setIsDiscardConfirmOpen(true);
      return;
    }
    onCancel();
  };

  const pickFile = (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      notifications.show({
        color: "red",
        title: "File is too large",
        message: `File must be ${MAX_ATTACHMENT_SIZE_MB} MB or smaller`,
      });
      return;
    }

    // A comment carries at most one attachment — picking a new file always
    // replaces whatever was in the slot, never accumulates.
    setAttachment({ kind: "pending", file });
  };

  const removeAttachment = () => setAttachment({ kind: "none" });

  // No native <form> here — this component is always mounted inside
  // `TaskFormFrame`'s own <form> (see `TaskFormFields.commentsSection`), and
  // HTML forbids nesting <form> elements. Validation and submission are
  // therefore driven by hand instead of `form.onSubmit`/a submit button.
  const handleSubmit = () => {
    if (form.validate().hasErrors) return;
    onSubmit(form.values.content, resolveAttachmentChange());
  };

  const resolveAttachmentChange = (): CommentFormAttachmentChange => {
    if (attachment.kind === "pending") {
      return { type: "replace", file: attachment.file };
    }
    if (attachment.kind === "none" && initialAttachment !== null) {
      return { type: "remove" };
    }
    return { type: "keep" };
  };

  // Enter submits, Shift+Enter inserts a newline — Mantine's own Textarea
  // has no built-in "submit on Enter" affordance, so this is done by hand.
  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    handleSubmit();
  };

  const attachedFileName =
    attachment.kind === "existing"
      ? (attachment.attachment.fileName ?? "Attachment")
      : attachment.kind === "pending"
        ? attachment.file.name
        : null;

  return (
    <>
      <Box
        onDrop={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          pickFile(event.dataTransfer.files);
        }}
        onDragOver={(event: DragEvent<HTMLDivElement>) =>
          event.preventDefault()
        }
      >
        <Stack gap="xs">
          <Group align="flex-start" gap="xs" wrap="nowrap">
            <Textarea
              placeholder="Add a comment..."
              minRows={2}
              data-autofocus
              style={{ flex: 1 }}
              {...form.getInputProps("content")}
              onKeyDown={handleTextareaKeyDown}
            />
            <ActionIcon
              variant="subtle"
              color="gray"
              mt={4}
              aria-label={`Attach a file (max ${MAX_ATTACHMENT_SIZE_MB} MB)`}
              title={`Attach a file (max ${MAX_ATTACHMENT_SIZE_MB} MB)`}
              onClick={() => fileInputRef.current?.click()}
            >
              <AttachFileIcon size={16} />
            </ActionIcon>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                pickFile(event.target.files);
                event.target.value = "";
              }}
            />
          </Group>

          {attachedFileName && (
            <Group gap="xs">
              <Paper withBorder radius="sm" px={8} py={4}>
                <Group gap={4} wrap="nowrap">
                  <FileTextIcon size={14} animateOnHover={false} />
                  <Text size="xs">{attachedFileName}</Text>
                  <CloseButton
                    size="xs"
                    aria-label={`Remove ${attachedFileName}`}
                    onClick={removeAttachment}
                  />
                </Group>
              </Paper>
            </Group>
          )}

          <Group justify="flex-end">
            <Button type="button" variant="default" onClick={requestCancel}>
              Cancel
            </Button>
            <Button type="button" loading={isSubmitting} onClick={handleSubmit}>
              {mode === "create" ? "Comment" : "Update"}
            </Button>
          </Group>
        </Stack>
      </Box>

      <DiscardCommentModal
        opened={isDiscardConfirmOpen}
        onCancel={() => setIsDiscardConfirmOpen(false)}
        onDiscard={onCancel}
      />
    </>
  );
};

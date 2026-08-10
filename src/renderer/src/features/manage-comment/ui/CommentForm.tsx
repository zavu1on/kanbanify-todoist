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
import { AttachFileIcon, FileTextIcon } from "lucide-animated";
import {
  type ChangeEvent,
  type DragEvent,
  type FC,
  type KeyboardEvent,
  useRef,
  useState,
} from "react";
import { commentFormSchema } from "../model/commentFormSchema";
import { DiscardCommentModal } from "./DiscardCommentModal";

type CommentFormProps = {
  mode: "create" | "edit";
  /** Absent in create mode. */
  initialContent?: string;
  isSubmitting?: boolean;
  onSubmit: (content: string) => void;
  onCancel: () => void;
};

/**
 * Shared by "Add new comment" and "Edit comment" (see `CommentsSection`) — the
 * only difference is the submit button's label and whether `initialContent`
 * seeds the field. File attachment is UI-only: selected/dropped files render
 * as local chips and are never sent anywhere (upload is a separate future
 * feature, see `docs/feat/comments/COMMENTS.md`).
 */
export const CommentForm: FC<CommentFormProps> = ({
  mode,
  initialContent = "",
  isSubmitting,
  onSubmit,
  onCancel,
}) => {
  const form = useForm({
    initialValues: { content: initialContent },
    validate: schemaResolver(commentFormSchema, { sync: true }),
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<{ id: string; file: File }[]>([]);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  const isDirty = form.isDirty() || files.length > 0;

  const requestCancel = () => {
    if (isDirty) {
      setIsDiscardConfirmOpen(true);
      return;
    }
    onCancel();
  };

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setFiles((current) => [
      ...current,
      ...Array.from(list).map((file) => ({
        id: crypto.randomUUID(),
        file,
      })),
    ]);
  };

  const removeFile = (id: string) =>
    setFiles((current) => current.filter((entry) => entry.id !== id));

  // No native <form> here — this component is always mounted inside
  // `TaskFormFrame`'s own <form> (see `TaskFormFields.commentsSection`), and
  // HTML forbids nesting <form> elements. Validation and submission are
  // therefore driven by hand instead of `form.onSubmit`/a submit button.
  const handleSubmit = () => {
    if (form.validate().hasErrors) return;
    onSubmit(form.values.content);
  };

  // Enter submits, Shift+Enter inserts a newline — Mantine's own Textarea
  // has no built-in "submit on Enter" affordance, so this is done by hand.
  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    handleSubmit();
  };

  return (
    <>
      <Box
        onDrop={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          addFiles(event.dataTransfer.files);
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
              aria-label="Attach a file"
              onClick={() => fileInputRef.current?.click()}
            >
              <AttachFileIcon size={16} />
            </ActionIcon>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </Group>

          {files.length > 0 && (
            <Group gap="xs">
              {files.map(({ id, file }) => (
                <Paper key={id} withBorder radius="sm" px={8} py={4}>
                  <Group gap={4} wrap="nowrap">
                    <FileTextIcon size={14} animateOnHover={false} />
                    <Text size="xs">{file.name}</Text>
                    <CloseButton
                      size="xs"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => removeFile(id)}
                    />
                  </Group>
                </Paper>
              ))}
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

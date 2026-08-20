import { Box, Group, Popover, Text, UnstyledButton } from "@mantine/core";
import type { FC, ReactNode } from "react";

type FieldChipProps = {
  icon: ReactNode;
  label: ReactNode;
  isEmpty?: boolean;
  disabled?: boolean;
  popoverWidth?: number;
  children: ReactNode;
};

/**
 * Shared trigger for the task form's right-column fields: a pill button
 * showing the field's current value (or an empty-state placeholder) that
 * opens the field's existing control — unchanged, `form.getInputProps`
 * bindings and all — in a popover. Each field component wraps itself in this
 * (see `ProjectField` etc.) rather than this owning any field state, so the
 * per-field render isolation `TaskFormFields` already relies on is preserved.
 */
export const FieldChip: FC<FieldChipProps> = ({
  icon,
  label,
  isEmpty,
  disabled,
  popoverWidth = 260,
  children,
}) => (
  <Popover
    width={popoverWidth}
    position="bottom-start"
    shadow="md"
    withinPortal
    keepMounted
  >
    <Popover.Target>
      <UnstyledButton
        h={30}
        px={10}
        bdrs={999}
        bg={isEmpty ? "#f3f4f7" : "#fff"}
        bd={isEmpty ? "1px solid transparent" : "1px solid #dfe2e8"}
        disabled={disabled}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <Group gap={6} wrap="nowrap">
          <Box style={{ lineHeight: 0 }}>{icon}</Box>
          <Text size="xs" fw={500} c={isEmpty ? "dimmed" : undefined}>
            {label}
          </Text>
        </Group>
      </UnstyledButton>
    </Popover.Target>
    <Popover.Dropdown>{children}</Popover.Dropdown>
  </Popover>
);

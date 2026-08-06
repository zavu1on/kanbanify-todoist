import { Divider, Skeleton, Stack } from "@mantine/core";
import type { FC } from "react";

const PLACEHOLDER_COUNT = 3;

export const SidebarProjectsSkeleton: FC = () => (
  <>
    <Divider my="sm" />
    <Stack gap={2} role="status" aria-label="Loading projects">
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reordered
        <Skeleton key={index} height={28} radius="sm" />
      ))}
    </Stack>
  </>
);

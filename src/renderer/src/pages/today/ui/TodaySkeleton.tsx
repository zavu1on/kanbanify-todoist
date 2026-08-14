import { Skeleton, Stack } from "@mantine/core";
import type { FC } from "react";

const PLACEHOLDER_COUNT = 6;

export const TodaySkeleton: FC = () => (
  <Stack gap="xs">
    {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list, never reordered
      <Skeleton key={index} height={60} radius="md" />
    ))}
  </Stack>
);

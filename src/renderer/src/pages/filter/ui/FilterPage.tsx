import { Stack, Title } from "@mantine/core";
import type { FC } from "react";
import { useParams } from "react-router";
import { useFiltersQuery } from "@/entities/filter";
import { FilterPageContent } from "./FilterPageContent";

export const FilterPage: FC = () => {
  const { filterId } = useParams<{ filterId: string }>();
  const numericFilterId = filterId ? Number(filterId) : Number.NaN;
  const filtersQuery = useFiltersQuery();
  const filter = filtersQuery.data?.ok
    ? filtersQuery.data.filters.find((f) => f.id === numericFilterId)
    : undefined;

  if (Number.isNaN(numericFilterId)) return null;

  return (
    <Stack gap="md">
      <Title order={2}>{filter?.title ?? "Filter"}</Title>

      <FilterPageContent filterId={numericFilterId} />
    </Stack>
  );
};

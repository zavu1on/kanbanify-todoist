import { useDisclosure } from "@mantine/hooks";
import type { FC } from "react";
import { useFiltersQuery } from "@/entities/filter";
import { FilterFormModal } from "@/features/manage-filter";
import { SidebarFiltersSection } from "./SidebarFiltersSection";
import { SidebarFiltersSkeleton } from "./SidebarFiltersSkeleton";

/** Mirrors `SidebarProjects` exactly — owns the "add filter" modal's open
 * state, fetches the list, shows a skeleton while pending. */
export const SidebarFilters: FC = () => {
  const [isAddFilterOpen, { open: openAddFilter, close: closeAddFilter }] =
    useDisclosure(false);
  const filtersQuery = useFiltersQuery();
  const filters = filtersQuery.data?.ok ? filtersQuery.data.filters : [];

  return (
    <>
      {filtersQuery.isPending ? (
        <SidebarFiltersSkeleton />
      ) : (
        <SidebarFiltersSection
          filters={filters}
          isRefetching={filtersQuery.isRefetching}
          onRefetch={() => filtersQuery.refetch()}
          onAddFilter={openAddFilter}
        />
      )}

      {/* Mounted only while open — see `SidebarProjects` for why. */}
      {isAddFilterOpen && (
        <FilterFormModal opened={isAddFilterOpen} onClose={closeAddFilter} />
      )}
    </>
  );
};

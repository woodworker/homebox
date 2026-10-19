<script setup lang="ts">
  import type { ViewType } from "~~/composables/use-preferences";
  import type { EntitySummary } from "~~/lib/api/types/data-contracts";
  import MdiCardTextOutline from "~icons/mdi/card-text-outline";
  import MdiTable from "~icons/mdi/table";
  import { Badge } from "@/components/ui/badge";
  import { Button, ButtonGroup } from "@/components/ui/button";
  import ViewPicker from "./ViewPicker.vue";
  import BaseSectionHeader from "@/components/Base/SectionHeader.vue";
  import DataTable from "./table/data-table.vue";
  import { makeColumns, tableViewColumnId } from "./table/columns";
  import { useI18n } from "vue-i18n";
  import type { Pagination } from "./pagination";
  import MaintenanceEditModal from "@/components/Maintenance/EditModal.vue";
  import ItemChangeDetails from "./ItemChangeDetails.vue";

  const props = defineProps<{
    view?: ViewType;
    items: EntitySummary[];
    locationFlatTree?: FlatTreeItem[];
    pagination?: Pagination;
    disableSort?: boolean;
    title?: string;
  }>();

  const emit = defineEmits<{
    (e: "refresh"): void;
  }>();

  const preferences = useViewPreferences();
  const { t } = useI18n();

  const viewStore = useViewStore();
  onMounted(() => viewStore.ensureFetched());
  const tableViews = computed(() => viewStore.views.filter(v => v.kind === "table"));

  // The selected view only applies to the current page and resets on
  // navigation, so a view picked for one tag doesn't carry over to the next.
  const route = useRoute();
  const selectedViewId = ref<string | null>(null);
  watch(
    () => route.path,
    () => {
      selectedViewId.value = null;
    }
  );
  const activeView = computed(() => tableViews.value.find(v => v.id === selectedViewId.value) ?? null);

  const columns = computed(() =>
    makeColumns({
      t,
      refresh: () => emit("refresh"),
      disableSort: props.disableSort,
      table: activeView.value?.table,
    })
  );

  // Server-sorted lists (disableSort) keep their own order.
  const defaultSorting = computed(() => {
    const sort = activeView.value?.table?.sort;
    if (!sort || props.disableSort) return [];
    const id = tableViewColumnId(sort);
    if (!columns.value.some(c => c.id === id)) return [];
    return [{ id, desc: sort.direction === "desc" }];
  });

  const viewSet = computed(() => {
    return !!props.view;
  });

  // A selected (or default) view is a table view, so it shows as a table
  // regardless of the card/table preference.
  const itemView = computed(() => {
    return props.view ?? (activeView.value ? "table" : preferences.value.itemDisplayView);
  });

  function setViewPreference(view: ViewType) {
    preferences.value.itemDisplayView = view;
    // "Table" means the default columns.
    selectedViewId.value = null;
  }

  function selectTableView(id: string) {
    selectedViewId.value = id;
  }

  const externalPagination = computed(() => !!props.pagination);
</script>

<template>
  <section>
    <MaintenanceEditModal />
    <ItemChangeDetails />

    <BaseSectionHeader class="flex items-center justify-between" :class="{ 'mb-2 mt-4': !externalPagination }">
      <div class="flex gap-2 text-nowrap">
        {{ title ? title : $t("components.item.view.selectable.items") }}
        <Badge v-if="!externalPagination">
          {{ items.length }}
        </Badge>
      </div>
      <template #subtitle>
        <div
          id="selectable-subtitle"
          class="flex grow items-center px-2"
          :class="{ hidden: !preferences.quickActions.enabled }"
        />
      </template>
      <template #description>
        <div v-if="!viewSet">
          <ButtonGroup>
            <Button size="sm" :variant="itemView === 'card' ? 'default' : 'outline'" @click="setViewPreference('card')">
              <MdiCardTextOutline class="size-5" />
              {{ $t("components.item.view.selectable.card") }}
            </Button>
            <Button
              size="sm"
              :variant="itemView === 'table' && !activeView ? 'default' : 'outline'"
              @click="setViewPreference('table')"
            >
              <MdiTable class="size-5" />
              {{ $t("components.item.view.selectable.table") }}
            </Button>
            <ViewPicker :views="tableViews" :active="activeView" @select="selectTableView" />
          </ButtonGroup>
        </div>
      </template>
    </BaseSectionHeader>

    <p v-if="externalPagination && pagination!.totalSize > 0" class="mb-4 flex items-center text-base font-medium">
      {{ $t("items.results", { total: pagination!.totalSize }) }}
      <span class="ml-auto text-base">
        {{
          $t("items.pages", {
            page: pagination!.page,
            totalPages: Math.ceil(pagination!.totalSize / pagination!.pageSize),
          })
        }}
      </span>
    </p>

    <DataTable
      :view="itemView"
      :columns="preferences.quickActions.enabled ? columns : columns.filter(c => c.enableHiding !== false)"
      :data="items"
      :location-flat-tree="locationFlatTree"
      :external-pagination="pagination"
      :entity-view="activeView"
      :default-sorting="defaultSorting"
      @refresh="$emit('refresh')"
    />
  </section>
</template>

<style scoped></style>

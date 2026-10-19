<script setup lang="ts">
  import { useI18n } from "vue-i18n";
  import { toast } from "@/components/ui/sonner";
  import type {
    EntityTemplateSummary,
    TypesTableViewColumn,
    EntityViewCreate,
    EntityViewOut,
  } from "~~/lib/api/types/data-contracts";
  import MdiPlus from "~icons/mdi/plus";
  import MdiPencil from "~icons/mdi/pencil";
  import MdiDelete from "~icons/mdi/delete";
  import MdiClose from "~icons/mdi/close";
  import MdiArrowUp from "~icons/mdi/arrow-up";
  import MdiArrowDown from "~icons/mdi/arrow-down";
  import MdiTableEye from "~icons/mdi/table-eye";
  import { Button } from "@/components/ui/button";
  import { Badge } from "@/components/ui/badge";
  import { Card } from "@/components/ui/card";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
  import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
  import { useDialog } from "@/components/ui/dialog-provider";
  import { DialogID } from "~/components/ui/dialog-provider/utils";
  import FormTextField from "~/components/Form/TextField.vue";
  import { TABLE_VIEW_BUILTIN_COLUMNS, tableViewColumnId } from "~/components/Item/View/table/columns";
  import { camelToSnakeCase } from "@/lib/utils";

  const { t } = useI18n();

  useHead({ title: `HomeBox | ${t("collection.tabs.views")}` });

  const api = useUserApi();
  const confirm = useConfirm();
  const { openDialog, closeDialog } = useDialog();
  const viewStore = useViewStore();

  onMounted(() => viewStore.ensureFetched());

  // Suggestions for custom field columns: names used on items plus names
  // defined in templates, loaded when the editor opens.
  const knownFieldNames = ref<string[]>([]);
  const templates = ref<EntityTemplateSummary[]>([]);

  async function loadSuggestions() {
    const [fields, tpls] = await Promise.all([api.items.fields.getAll(), api.templates.getAll()]);
    knownFieldNames.value = fields.data ?? [];
    templates.value = tpls.data ?? [];
  }

  function columnLabel(c: TypesTableViewColumn) {
    return c.kind === "field" ? c.key : t(`items.${camelToSnakeCase(c.key)}`);
  }

  // Editor state, shared by create and update.
  const NO_SORT = "__none";
  const form = reactive({
    id: null as string | null,
    name: "",
    columns: [] as TypesTableViewColumn[],
    sortColumn: NO_SORT,
    sortDirection: "asc" as "asc" | "desc",
  });
  const newFieldName = ref("");

  const availableBuiltins = computed(() =>
    TABLE_VIEW_BUILTIN_COLUMNS.filter(key => !form.columns.some(c => c.kind === "builtin" && c.key === key))
  );

  function openEditor(view?: EntityViewOut) {
    form.id = view?.id ?? null;
    form.name = view?.name ?? "";
    const sort = view?.table?.sort;
    form.columns = view?.table ? view.table.columns.map(c => ({ ...c })) : [{ kind: "builtin", key: "name" }];
    form.sortColumn = sort ? tableViewColumnId(sort) : NO_SORT;
    form.sortDirection = (sort?.direction as "asc" | "desc") ?? "asc";
    newFieldName.value = "";
    loadSuggestions();
    openDialog(DialogID.EditView);
  }

  function hasColumn(c: TypesTableViewColumn) {
    return form.columns.some(x => x.kind === c.kind && x.key === c.key);
  }

  function addColumn(c: TypesTableViewColumn) {
    if (c.key && !hasColumn(c)) {
      form.columns.push(c);
    }
  }

  function addField() {
    addColumn({ kind: "field", key: newFieldName.value.trim() });
    newFieldName.value = "";
  }

  function removeColumn(i: number) {
    const [removed] = form.columns.splice(i, 1);
    if (removed && tableViewColumnId(removed) === form.sortColumn) {
      form.sortColumn = NO_SORT;
    }
  }

  function moveColumn(from: number, to: number) {
    if (to < 0 || to >= form.columns.length) return;
    const [moved] = form.columns.splice(from, 1);
    form.columns.splice(to, 0, moved!);
  }

  async function addFromTemplate(templateId: string) {
    const { data, error } = await api.templates.get(templateId);
    if (error) {
      toast.error(t("components.views.toasts.template_failed"));
      return;
    }
    for (const f of data.fields) {
      addColumn({ kind: "field", key: f.name });
    }
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error(t("components.views.toasts.name_required"));
      return;
    }
    if (form.columns.length === 0) {
      toast.error(t("components.views.toasts.columns_required"));
      return;
    }

    const sortColumn = form.columns.find(c => tableViewColumnId(c) === form.sortColumn);
    // The editor only creates table views so far.
    const payload: EntityViewCreate = {
      name: form.name.trim(),
      kind: "table",
      table: {
        columns: form.columns,
        sort: sortColumn ? { ...sortColumn, direction: form.sortDirection } : null,
      },
    };

    const { error } = form.id
      ? await api.views.update(form.id, { ...payload, id: form.id })
      : await api.views.create(payload);
    if (error) {
      toast.error(t("components.views.toasts.save_failed"));
      return;
    }

    toast.success(t("components.views.toasts.save_success"));
    closeDialog(DialogID.EditView);
    viewStore.refresh();
  }

  async function deleteView(view: EntityViewOut) {
    const { isCanceled } = await confirm.open(t("components.views.confirm.delete", { name: view.name }));
    if (isCanceled) return;

    const { error } = await api.views.delete(view.id);
    if (error) {
      toast.error(t("components.views.toasts.delete_failed"));
      return;
    }

    toast.success(t("components.views.toasts.delete_success"));
    viewStore.refresh();
  }
</script>

<template>
  <div>
    <Dialog :dialog-id="DialogID.EditView">
      <DialogContent class="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {{ form.id ? t("components.views.dialog.title_edit") : t("components.views.dialog.title_create") }}
          </DialogTitle>
        </DialogHeader>
        <form class="flex flex-col gap-4" @submit.prevent="save">
          <FormTextField
            v-model="form.name"
            :autofocus="true"
            :label="t('components.views.dialog.name')"
            :max-length="255"
            :min-length="1"
          />

          <div class="flex flex-col gap-2">
            <Label>{{ t("components.views.dialog.columns") }}</Label>
            <div class="flex flex-col rounded-md border">
              <div
                v-for="(c, i) in form.columns"
                :key="tableViewColumnId(c)"
                class="flex items-center gap-1 border-b px-2 py-1 last:border-b-0"
              >
                <Button
                  type="button"
                  size="icon"
                  class="size-6"
                  variant="ghost"
                  :disabled="i === 0"
                  @click="moveColumn(i, i - 1)"
                >
                  <MdiArrowUp />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  class="size-6"
                  variant="ghost"
                  :disabled="i === form.columns.length - 1"
                  @click="moveColumn(i, i + 1)"
                >
                  <MdiArrowDown />
                </Button>
                <span class="mr-auto text-sm">{{ columnLabel(c) }}</span>
                <Badge v-if="c.kind === 'field'" variant="secondary" class="text-xs">
                  {{ t("components.views.dialog.custom_field") }}
                </Badge>
                <Button type="button" size="icon" class="size-6" variant="ghost" @click="removeColumn(i)">
                  <MdiClose />
                </Button>
              </div>
              <p v-if="form.columns.length === 0" class="p-2 text-sm text-muted-foreground">
                {{ t("components.views.dialog.no_columns") }}
              </p>
            </div>
          </div>

          <div class="grid gap-2 sm:grid-cols-2">
            <Select
              v-if="availableBuiltins.length > 0"
              :model-value="''"
              @update:model-value="key => addColumn({ kind: 'builtin', key: String(key) })"
            >
              <SelectTrigger>
                <SelectValue :placeholder="t('components.views.dialog.add_builtin')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="key in availableBuiltins" :key="key" :value="key">
                  {{ t(`items.${camelToSnakeCase(key)}`) }}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              v-if="templates.length > 0"
              :model-value="''"
              @update:model-value="id => addFromTemplate(String(id))"
            >
              <SelectTrigger>
                <SelectValue :placeholder="t('components.views.dialog.add_from_template')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="tpl in templates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex gap-2">
            <Input
              v-model="newFieldName"
              list="table-view-field-names"
              :placeholder="t('components.views.dialog.add_field_placeholder')"
              @keydown.enter.prevent="addField"
            />
            <datalist id="table-view-field-names">
              <option v-for="name in knownFieldNames" :key="name" :value="name" />
            </datalist>
            <Button type="button" variant="outline" :disabled="!newFieldName.trim()" @click="addField">
              <MdiPlus class="mr-1 size-4" />
              {{ t("components.views.dialog.add_field") }}
            </Button>
          </div>

          <div class="flex flex-col gap-2">
            <Label>{{ t("components.views.dialog.sort") }}</Label>
            <div class="flex gap-2">
              <Select v-model="form.sortColumn">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="NO_SORT">{{ t("components.views.dialog.no_sort") }}</SelectItem>
                  <SelectItem v-for="c in form.columns" :key="tableViewColumnId(c)" :value="tableViewColumnId(c)">
                    {{ columnLabel(c) }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select v-model="form.sortDirection" :disabled="form.sortColumn === NO_SORT">
                <SelectTrigger class="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">{{ t("components.views.dialog.ascending") }}</SelectItem>
                  <SelectItem value="desc">{{ t("components.views.dialog.descending") }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">{{ t("global.save") }}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-medium">{{ t("collection.tabs.views") }}</h3>
      <Button size="sm" @click="openEditor()">
        <MdiPlus class="mr-1 size-4" />
        {{ t("components.views.page.create") }}
      </Button>
    </div>

    <div v-if="viewStore.views.length > 0" class="flex flex-col gap-2">
      <Card v-for="view in viewStore.views" :key="view.id" class="p-4">
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
          >
            <MdiTableEye class="size-5" />
          </div>

          <div class="mr-auto min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ view.name }}</span>
              <Badge variant="secondary" class="text-xs">{{ t(`components.views.kind.${view.kind}`) }}</Badge>
            </div>
            <p v-if="view.table" class="truncate text-xs text-muted-foreground">
              {{ view.table.columns.map(columnLabel).join(" · ") }}
            </p>
          </div>

          <TooltipProvider :delay-duration="0">
            <div class="flex gap-1">
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="ghost" size="icon" class="size-8" @click="openEditor(view)">
                    <MdiPencil class="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{{ t("global.edit") }}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="ghost" size="icon" class="size-8 text-destructive" @click="deleteView(view)">
                    <MdiDelete class="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{{ t("global.delete") }}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </Card>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-12 text-center">
      <p class="mb-4 text-muted-foreground">{{ t("components.views.page.empty") }}</p>
      <Button @click="openEditor()">
        <MdiPlus class="mr-2" />
        {{ t("components.views.page.create") }}
      </Button>
    </div>
  </div>
</template>

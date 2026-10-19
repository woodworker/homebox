import type { Column, ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import DropdownAction from "./data-table-dropdown.vue";
import { ArrowDown, ArrowUpDown, Check, X } from "lucide-vue-next";
import Button from "~/components/ui/button/Button.vue";
import Checkbox from "~/components/Form/Checkbox.vue";
import type { EntitySummary, TypesTableViewColumn, TypesTableViewConfig } from "~/lib/api/types/data-contracts";

import Currency from "~/components/global/Currency.vue";
import DateTime from "~/components/global/DateTime.vue";
import { cn } from "~/lib/utils";

/** Builtin columns a table view can show; mirrors the backend allowlist. */
export const TABLE_VIEW_BUILTIN_COLUMNS = [
  "assetId",
  "name",
  "quantity",
  "insured",
  "purchasePrice",
  "location",
  "archived",
  "createdAt",
  "updatedAt",
] as const;

/** Column id of a table view column; custom fields are prefixed so they can't clash with builtin ids. */
export function tableViewColumnId(c: TypesTableViewColumn): string {
  return c.kind === "field" ? `field:${c.key}` : c.key;
}

function customFieldValue(item: EntitySummary, name: string): string | number | boolean | undefined {
  const field = item.fields?.find(f => f.name === name);
  if (!field) return undefined;
  switch (field.type) {
    case "number":
      return field.numberValue;
    case "boolean":
      return field.booleanValue;
    default:
      return field.textValue || undefined;
  }
}

/**
 * Create columns with i18n support.
 * Pass `t` from useI18n() when creating the columns in your component.
 * With a table view config (`table`), only its columns are returned, in its order.
 */
export function makeColumns({
  t,
  refresh,
  disableSort,
  table,
}: {
  t: (key: string) => string;
  refresh?: () => void;
  disableSort?: boolean;
  table?: TypesTableViewConfig | null;
}): ColumnDef<EntitySummary>[] {
  // `literal` skips translation, for custom field names.
  const sortable = (column: Column<EntitySummary, unknown>, key: string, literal = false) => {
    const label = literal ? key : t(key);
    const sortState = column.getIsSorted(); // 'asc' | 'desc' | false
    if (!sortState) {
      // show the neutral up/down icon when not sorted
      return [label, h(ArrowUpDown, { class: cn(["ml-2 h-4 w-4 opacity-40", disableSort && "opacity-0"]) })];
    }
    // show a single arrow that points up for asc (rotate-180) and down for desc
    return [
      label,
      h(ArrowDown, {
        class: cn([
          "ml-2 h-4 w-4 transition-transform opacity-100",
          sortState === "asc" ? "rotate-180" : "",
          disableSort && "opacity-0",
        ]),
      }),
    ];
  };

  const columns: ColumnDef<EntitySummary>[] = [
    {
      id: "select",
      header: ({ table }) =>
        h(Checkbox, {
          modelValue: table.getIsAllPageRowsSelected()
            ? true
            : table.getSelectedRowModel().rows.length > 0
              ? ("indeterminate" as unknown as boolean) // :)
              : false,
          "onUpdate:modelValue": (value: boolean) => table.toggleAllPageRowsSelected(!!value),
          ariaLabel: t("components.item.view.selectable.select_all"),
        }),
      cell: ({ row }) =>
        h(Checkbox, {
          modelValue: row.getIsSelected(),
          "onUpdate:modelValue": (value: boolean) => row.toggleSelected(!!value),
          ariaLabel: t("components.item.view.selectable.select_row"),
        }),
      enableHiding: false,
    },
    {
      id: "assetId",
      accessorKey: "assetId",
      header: ({ column }) =>
        h(
          Button,
          {
            variant: "ghost",
            onClick: () => !disableSort && column.toggleSorting(column.getIsSorted() === "asc"),
          },
          () => sortable(column, "items.asset_id")
        ),
      cell: ({ row }) => h("div", { class: "text-sm" }, String(row.getValue("assetId") ?? "")),
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) =>
        h(
          Button,
          {
            variant: "ghost",
            onClick: () => !disableSort && column.toggleSorting(column.getIsSorted() === "asc"),
          },
          () => sortable(column, "items.name")
        ),
      cell: ({ row }) => h("span", { class: "text-sm font-medium" }, row.getValue("name")),
    },
    {
      id: "quantity",
      accessorKey: "quantity",
      header: ({ column }) =>
        h(
          Button,
          {
            variant: "ghost",
            onClick: () => !disableSort && column.toggleSorting(column.getIsSorted() === "asc"),
          },
          () => sortable(column, "items.quantity")
        ),
      cell: ({ row }) => h("div", { class: "text-center" }, String(row.getValue("quantity") ?? "")),
    },
    {
      id: "insured",
      accessorKey: "insured",
      header: ({ column }) =>
        h(
          Button,
          {
            variant: "ghost",
            onClick: () => !disableSort && column.toggleSorting(column.getIsSorted() === "asc"),
          },
          () => sortable(column, "items.insured")
        ),
      cell: ({ row }) => {
        const val = row.getValue("insured");
        return h(
          "div",
          { class: "block mx-auto w-min" },
          val ? h(Check, { class: "h-4 w-4 text-green-500" }) : h(X, { class: "h-4 w-4 text-destructive" })
        );
      },
    },
    {
      id: "purchasePrice",
      accessorKey: "purchasePrice",
      header: ({ column }) =>
        h(
          Button,
          {
            variant: "ghost",
            onClick: () => !disableSort && column.toggleSorting(column.getIsSorted() === "asc"),
          },
          () => sortable(column, "items.purchase_price")
        ),
      cell: ({ row }) =>
        h("div", { class: "text-center" }, h(Currency, { amount: Number(row.getValue("purchasePrice")) })),
    },
    {
      id: "location",
      accessorKey: "location",
      header: ({ column }) =>
        h(
          Button,
          {
            variant: "ghost",
            onClick: () => !disableSort && column.toggleSorting(column.getIsSorted() === "asc"),
          },
          () => sortable(column, "items.location")
        ),
      cell: ({ row }) => {
        const item = row.original as EntitySummary;
        const loc = (item.location || item.parent) as { id: string; name: string } | null;
        if (loc) {
          return h("a", { href: `/location/${loc.id}`, class: "hover:underline text-sm" }, loc.name);
        }
        return h("div", { class: "text-sm text-muted-foreground" }, "");
      },
    },
    {
      id: "archived",
      accessorKey: "archived",
      header: ({ column }) =>
        h(
          Button,
          {
            variant: "ghost",
            onClick: () => !disableSort && column.toggleSorting(column.getIsSorted() === "asc"),
          },
          () => sortable(column, "items.archived")
        ),
      cell: ({ row }) => {
        const val = row.getValue("archived");
        return h(
          "div",
          { class: "block mx-auto w-min" },
          val ? h(Check, { class: "h-4 w-4 text-green-500" }) : h(X, { class: "h-4 w-4 text-destructive" })
        );
      },
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) =>
        h(
          Button,
          {
            variant: "ghost",
            onClick: () => !disableSort && column.toggleSorting(column.getIsSorted() === "asc"),
          },
          () => sortable(column, "items.created_at")
        ),
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-center text-sm" },
          h(DateTime, { date: row.getValue("createdAt") as Date, datetimeType: "date" })
        ),
    },
    {
      id: "updatedAt",
      accessorKey: "updatedAt",
      header: ({ column }) =>
        h(
          Button,
          {
            variant: "ghost",
            onClick: () => !disableSort && column.toggleSorting(column.getIsSorted() === "asc"),
          },
          () => sortable(column, "items.updated_at")
        ),
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-center text-sm" },
          h(DateTime, { date: row.getValue("updatedAt") as Date, datetimeType: "date" })
        ),
    },
    {
      id: "actions",
      enableHiding: false,
      header: ({ table }) => {
        const selectedCount = table.getSelectedRowModel().rows.length;
        return h(
          "div",
          {
            class: [
              "relative inline-flex items-center",
              selectedCount === 0 ? "opacity-50 pointer-events-none" : "",
            ].join(" "),
          },
          [
            h(DropdownAction, {
              multi: {
                items: table.getSelectedRowModel().rows,
                columns: table.getAllColumns(),
              },
              onExpand: () => {
                table.getSelectedRowModel().rows.forEach(row => row.toggleExpanded());
              },
              view: "table",
              onRefresh: () => refresh?.(),
              table,
            }),
            selectedCount > 0 &&
              h(
                "span",
                {
                  class: "-right-1 -top-1 absolute flex size-4",
                },
                h(
                  "span",
                  {
                    class:
                      "relative flex size-4 items-center justify-center rounded-full bg-primary p-1 text-primary-foreground text-xs pointer-events-none whitespace-nowrap",
                  },
                  String(selectedCount)
                )
              ),
          ]
        );
      },
      cell: ({ row, table }) => {
        const item = row.original;
        return h(
          "div",
          { class: "relative" },
          h(DropdownAction, {
            item,
            onExpand: row.toggleExpanded,
            view: "table",
            onRefresh: () => refresh?.(),
            table,
          })
        );
      },
    },
  ];

  if (!table) {
    return columns;
  }

  const fieldColumn = (name: string): ColumnDef<EntitySummary> => ({
    id: `field:${name}`,
    accessorFn: item => customFieldValue(item, name),
    sortUndefined: "last",
    header: ({ column }) =>
      h(
        Button,
        {
          variant: "ghost",
          onClick: () => !disableSort && column.toggleSorting(column.getIsSorted() === "asc"),
        },
        () => sortable(column, name, true)
      ),
    cell: ({ getValue }) => {
      const val = getValue();
      if (typeof val === "boolean") {
        return h(
          "div",
          { class: "block mx-auto w-min" },
          val ? h(Check, { class: "h-4 w-4 text-green-500" }) : h(X, { class: "h-4 w-4 text-destructive" })
        );
      }
      return h("div", { class: "text-sm" }, String(val ?? ""));
    },
  });

  const byId = new Map(columns.map(c => [c.id, c]));
  const viewColumns = table.columns.flatMap(c => {
    if (c.kind === "field") return [fieldColumn(c.key)];
    const builtin = byId.get(c.key);
    return builtin ? [builtin] : [];
  });

  return [byId.get("select")!, ...viewColumns, byId.get("actions")!];
}

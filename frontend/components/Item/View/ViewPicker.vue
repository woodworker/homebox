<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        size="sm"
        :variant="active ? 'default' : 'outline'"
        role="combobox"
        :aria-expanded="open"
        :aria-label="$t('components.item.view.selectable.views')"
      >
        <MdiTableEye class="size-5" />
        {{ active ? active.name : $t("components.item.view.selectable.views") }}
        <ChevronDown class="size-4" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-64 p-0" align="end">
      <!-- Nothing to search yet: explain what a view is instead. -->
      <p v-if="views.length === 0" class="p-3 text-sm text-muted-foreground">
        {{ $t("components.item.view.selectable.no_views_yet") }}
      </p>
      <Command v-else :ignore-filter="true">
        <CommandInput
          v-model="search"
          :placeholder="$t('components.item.view.selectable.search_views')"
          :display-value="_ => ''"
        />
        <CommandEmpty>{{ $t("components.item.view.selectable.no_views_found") }}</CommandEmpty>
        <CommandList>
          <CommandGroup>
            <CommandItem v-for="view in filteredViews" :key="view.id" :value="view.id" @select="select(view.id)">
              <Check :class="cn('mr-2 size-4', active?.id === view.id ? 'opacity-100' : 'opacity-0')" />
              {{ view.name }}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
      <!-- Outside the scrolling list so it stays reachable with many views. -->
      <div class="border-t p-1">
        <NuxtLink
          to="/collection/views"
          class="flex items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
        >
          <Settings class="mr-2 size-4" />
          {{
            views.length === 0
              ? $t("components.item.view.selectable.create_view")
              : $t("components.item.view.selectable.manage_views")
          }}
        </NuxtLink>
      </div>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
  import { Check, ChevronDown, Settings } from "lucide-vue-next";
  import fuzzysort from "fuzzysort";
  import MdiTableEye from "~icons/mdi/table-eye";
  import { Button } from "~/components/ui/button";
  import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
  import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
  import { cn } from "~/lib/utils";
  import type { EntityViewOut } from "~~/lib/api/types/data-contracts";

  const props = defineProps<{
    views: EntityViewOut[];
    // The view currently shown, if any.
    active: EntityViewOut | null;
  }>();

  const emit = defineEmits<{
    (e: "select", id: string): void;
  }>();

  const open = ref(false);
  const search = ref("");

  const filteredViews = computed(() =>
    fuzzysort.go(search.value, props.views, { key: "name", all: true }).map(r => r.obj)
  );

  function select(id: string) {
    emit("select", id);
    open.value = false;
    search.value = "";
  }
</script>

import { defineStore } from "pinia";
import type { EntityViewOut } from "~~/lib/api/types/data-contracts";

export const useViewStore = defineStore("views", {
  state: () => ({
    allViews: null as EntityViewOut[] | null,
    client: useUserApi(),
    refreshPromise: null as Promise<void> | null,
  }),
  getters: {
    views(state): EntityViewOut[] {
      return state.allViews ?? [];
    },
  },
  actions: {
    async ensureFetched() {
      if (this.allViews !== null) {
        return;
      }

      if (this.refreshPromise === null) {
        this.refreshPromise = this.refresh().then(() => {});
      }
      await this.refreshPromise;
    },
    async refresh() {
      const result = await this.client.views.getAll();
      if (result.error) {
        return result;
      }

      this.allViews = result.data;
      return result;
    },
  },
});

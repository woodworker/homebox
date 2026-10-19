import { BaseAPI, route } from "../base";
import type { EntityViewCreate, EntityViewOut, EntityViewUpdate } from "../types/data-contracts";

export class ViewsApi extends BaseAPI {
  getAll() {
    return this.http.get<EntityViewOut[]>({ url: route("/views") });
  }

  get(id: string) {
    return this.http.get<EntityViewOut>({ url: route(`/views/${id}`) });
  }

  create(body: EntityViewCreate) {
    return this.http.post<EntityViewCreate, EntityViewOut>({ url: route("/views"), body });
  }

  update(id: string, body: EntityViewUpdate) {
    return this.http.put<EntityViewUpdate, EntityViewOut>({ url: route(`/views/${id}`), body });
  }

  delete(id: string) {
    return this.http.delete<void>({ url: route(`/views/${id}`) });
  }
}

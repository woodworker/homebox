import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";
import type { EntityViewCreate } from "../../types/data-contracts";
import { factories } from "../factories";

function tableView(): EntityViewCreate {
  return {
    name: faker.word.words(2),
    kind: "table",
    table: {
      columns: [
        { kind: "builtin", key: "name" },
        { kind: "field", key: "Color" },
      ],
      sort: { kind: "field", key: "Color", direction: "asc" },
    },
  };
}

describe("basic view workflows", () => {
  test("user should be able to create, update, and delete a table view", async () => {
    const { client } = await factories.client.singleUse();

    const result = await client.views.create(tableView());
    expect(result.error).toBeFalsy();
    expect(result.status).toBe(201);
    const view = result.data;
    expect(view.kind).toBe("table");
    expect(view.table?.columns).toHaveLength(2);

    // Update without sort
    {
      const updateResult = await client.views.update(view.id, {
        id: view.id,
        name: faker.word.words(2),
        kind: "table",
        table: { columns: [{ kind: "builtin", key: "quantity" }] },
      });
      expect(updateResult.error).toBeFalsy();
      expect(updateResult.status).toBe(200);
      expect(updateResult.data.table?.columns).toEqual([{ kind: "builtin", key: "quantity" }]);
      expect(updateResult.data.table?.sort).toBeFalsy();
    }

    const listResult = await client.views.getAll();
    expect(listResult.data.map(v => v.id)).toContain(view.id);

    const deleteResult = await client.views.delete(view.id);
    expect(deleteResult.error).toBeFalsy();
    expect(deleteResult.status).toBe(204);

    const getResult = await client.views.get(view.id);
    expect(getResult.status).toBe(404);
  });

  test("a table view needs valid columns", async () => {
    const { client } = await factories.client.singleUse();

    const result = await client.views.create({
      name: faker.word.words(2),
      kind: "table",
      table: { columns: [{ kind: "builtin", key: "notAColumn" }] },
    });
    expect(result.status).toBe(422);
  });
});

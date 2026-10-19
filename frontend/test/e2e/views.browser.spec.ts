import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

async function login(page: Page, email = "demo@example.com", password = "demodemo") {
  await page.goto("/home");
  await expect(page).toHaveURL("/");
  await page.fill("input[type='text']", email);
  await page.fill("input[type='password']", password);
  await page.click("button[type='submit']");
  await expect(page).toHaveURL("/home");
}

// Creates a table view with the name, location and a custom field column through the views page.
async function createView(page: Page, name: string, field: string) {
  await page.goto("/collection/views");
  await page.getByRole("button", { name: "Create View" }).first().click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByRole("combobox").filter({ hasText: "Add column" }).click();
  await page.getByRole("option", { name: "Location" }).click();
  await dialog.getByPlaceholder("Custom field name").fill(field);
  await dialog.getByRole("button", { name: "Add field" }).click();
  await dialog.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText(name)).toBeVisible();
}

async function deleteView(page: Page, name: string) {
  const views: { id: string; name: string }[] = await (await page.request.get("/api/v1/views")).json();
  const view = views.find(v => v.name === name);
  if (view) {
    await page.request.delete(`/api/v1/views/${view.id}`);
  }
}

test("without views the picker offers to create one instead of a search", async ({ page }) => {
  // Other tests create views in parallel, so pretend the collection has none.
  await page.route("**/api/v1/views", route => route.fulfill({ status: 200, json: [] }));

  await login(page);
  await page.goto("/search");
  await page.getByRole("combobox", { name: "Views" }).click();

  await expect(page.getByText("No views yet.")).toBeVisible();
  await expect(page.getByPlaceholder("Search views…")).toHaveCount(0);
  await page.getByRole("link", { name: "Create a view…" }).click();
  await expect(page).toHaveURL("/collection/views");
});

test("a table view shows its columns in item lists", async ({ page }) => {
  const name = `E2E View ${Date.now()}`;
  const field = "E2E Field";

  await login(page);
  await createView(page, name, field);

  try {
    await page.goto("/search");
    await page.getByRole("button", { name: "Table", exact: true }).click();
    await expect(page.getByRole("columnheader", { name: "Insured" })).toBeVisible();

    await page.getByRole("combobox", { name: "Views" }).click();
    await page.getByRole("option", { name }).click();

    await expect(page.getByRole("combobox", { name: "Views" })).toContainText(name);
    await expect(page.getByRole("columnheader", { name: "Location" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: field })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Insured" })).toHaveCount(0);

    // "Table" switches back to the default columns.
    await page.getByRole("button", { name: "Table", exact: true }).click();
    await expect(page.getByRole("columnheader", { name: "Insured" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: field })).toHaveCount(0);
  } finally {
    await deleteView(page, name);
  }
});

test("a tag page starts with the tag's default view", async ({ page }) => {
  const name = `E2E Tag View ${Date.now()}`;
  const field = "E2E Field";

  await login(page);
  await createView(page, name, field);

  // A fresh tag per run, so parallel browsers don't change each other's default.
  const tag: { id: string } = await (
    await page.request.post("/api/v1/tags", { data: { name: `E2E Tag ${Date.now()}` } })
  ).json();

  try {
    await page.goto(`/tag/${tag.id}`);
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("combobox").filter({ hasText: "Table" }).click();
    await page.getByRole("option", { name }).click();
    await dialog.getByRole("button", { name: "Update" }).click();

    await page.reload();
    await expect(page.getByRole("combobox", { name: "Views" })).toContainText(name);
    await expect(page.getByRole("columnheader", { name: field })).toBeVisible();
  } finally {
    await page.request.delete(`/api/v1/tags/${tag.id}`);
    await deleteView(page, name);
  }
});

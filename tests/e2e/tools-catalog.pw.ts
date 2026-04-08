import { test, expect } from "@playwright/test";
import { preparePage } from "./helpers";

test.describe("Tools Catalog workspace", () => {
  test("navigates to /tools-catalog from the Tools menu", async ({ page, request }) => {
    await preparePage(page, request);
    await page.goto("/coordinator");

    // Open Tools dropdown and click Tools Catalog
    await page.getByRole("button", { name: "Tools" }).click();
    await page.getByRole("menuitem", { name: "Tools Catalog" }).click();

    await expect(page).toHaveURL(/\/tools-catalog/);
    await expect(page.getByText("TOOLS")).toBeVisible();
  });

  test("displays all groups in the left rail", async ({ page, request }) => {
    await preparePage(page, request);
    await page.goto("/tools-catalog");

    // All group headers should be visible
    await expect(page.getByText("Files")).toBeVisible();
    await expect(page.getByText("Documents")).toBeVisible();
    await expect(page.getByText("Entities")).toBeVisible();
    await expect(page.getByText("Finances")).toBeVisible();
    await expect(page.getByText("Findings")).toBeVisible();
    await expect(page.getByText("Skills")).toBeVisible();
    await expect(page.getByText("Action Items")).toBeVisible();
    await expect(page.getByText("Audit")).toBeVisible();
  });

  test("shows empty state when no tool is selected", async ({ page, request }) => {
    await preparePage(page, request);
    await page.goto("/tools-catalog");

    await expect(page.getByText("Select a tool to view details")).toBeVisible();
  });

  test("selecting a tool shows details in the content well", async ({ page, request }) => {
    await preparePage(page, request);
    await page.goto("/tools-catalog");

    // Click the Open File tool
    await page.getByRole("button", { name: /Open File/ }).first().click();

    // Content well shows overview with tool details
    await expect(page.getByText("Overview")).toBeVisible();
    await expect(page.getByText("open_file")).toBeVisible();
  });

  test("search filters the tool list", async ({ page, request }) => {
    await preparePage(page, request);
    await page.goto("/tools-catalog");

    await page.getByPlaceholder("Filter tools...").fill("ledger");

    // Matching tool should be visible
    await expect(page.getByText("get_ledger_summary")).toBeVisible();

    // Non-matching tools should be hidden
    await expect(page.getByText("open_file")).not.toBeVisible();
  });

  test("search with no results shows empty state", async ({ page, request }) => {
    await preparePage(page, request);
    await page.goto("/tools-catalog");

    await page.getByPlaceholder("Filter tools...").fill("zzz_nonexistent_zzz");

    await expect(page.getByText("No tools match your filter")).toBeVisible();
  });

  test("collapsing a group hides its tools", async ({ page, request }) => {
    await preparePage(page, request);
    await page.goto("/tools-catalog");

    // Verify a Files tool is visible
    await expect(page.getByText("open_file")).toBeVisible();

    // Click the Files group header to collapse
    await page.getByRole("button", { name: /Files/ }).first().click();

    // Tool should now be hidden
    await expect(page.getByText("open_file")).not.toBeVisible();

    // Click again to expand
    await page.getByRole("button", { name: /Files/ }).first().click();

    // Tool should be visible again
    await expect(page.getByText("open_file")).toBeVisible();
  });

  test("workspace tab appears in navbar", async ({ page, request }) => {
    await preparePage(page, request);
    await page.goto("/tools-catalog");

    // deriveDynamicTab() should create a "Tools Catalog" workspace tab
    await expect(page.getByRole("link", { name: "Tools Catalog" })).toBeVisible();
  });
});

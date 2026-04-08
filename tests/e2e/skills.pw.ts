import { test, expect } from "@playwright/test";
import { preparePage } from "./helpers";

test.describe("Skills workspace", () => {
  test("navigates to /skills from the Tools menu", async ({ page, request }) => {
    await preparePage(page, request);
    await page.goto("/coordinator");

    // Open Tools dropdown and click Skills
    await page.getByRole("button", { name: "Tools" }).click();
    await page.getByRole("menuitem", { name: "Skills" }).click();

    await expect(page).toHaveURL(/\/skills/);
    await expect(page.getByText("SKILLS")).toBeVisible();
  });

  test("displays skills in the left rail", async ({ page, request }) => {
    await preparePage(page, request);
    await page.goto("/skills");

    // Rail header shows count
    await expect(page.getByText("SKILLS")).toBeVisible();

    // Skills are listed
    await expect(page.getByText("What-if Analysis")).toBeVisible();
    await expect(page.getByText("Ledger Review")).toBeVisible();
    await expect(page.getByText("Disabled Skill")).toBeVisible();
  });

  test("selecting a skill shows overview in content well", async ({ page, request }) => {
    await preparePage(page, request);
    await page.goto("/skills");

    // Click a skill
    await page.getByRole("button", { name: /What-if Analysis/ }).click();

    // Content well shows overview tab
    await expect(page.getByText("Skill Details")).toBeVisible();
    await expect(page.getByText("what-if-analysis")).toBeVisible();
    await expect(page.getByText("Run a hypothetical scenario")).toBeVisible();

    // URL includes skill query param
    await expect(page).toHaveURL(/skill=/);
  });

  test("search filters the skill list", async ({ page, request }) => {
    await preparePage(page, request);
    await page.goto("/skills");

    await page.getByPlaceholder("Search skills...").fill("ledger");

    await expect(page.getByText("Ledger Review")).toBeVisible();
    await expect(page.getByText("What-if Analysis")).not.toBeVisible();
  });

  test("switching tabs shows usage and history", async ({ page, request }) => {
    await preparePage(page, request);
    await page.goto("/skills");

    // Select a skill first
    await page.getByRole("button", { name: /What-if Analysis/ }).click();
    await expect(page.getByText("Skill Details")).toBeVisible();

    // Switch to Usage tab
    await page.getByRole("button", { name: "Usage" }).click();
    // Should show either usage data or empty state
    await expect(
      page.getByText(/Total Runs|No usage data yet|Failed to load/),
    ).toBeVisible();

    // Switch to History tab
    await page.getByRole("button", { name: "History" }).click();
    await expect(
      page.getByText(/Created|No version history|Failed to load/),
    ).toBeVisible();
  });

  test("clicking Edit switches to inline edit form", async ({ page, request }) => {
    await preparePage(page, request);
    await page.goto("/skills");

    await page.getByRole("button", { name: /What-if Analysis/ }).click();
    await expect(page.getByText("Skill Details")).toBeVisible();

    // Click Edit
    await page.getByRole("button", { name: "Edit" }).click();

    // Should show inline edit form
    await expect(page.getByText("Edit Skill")).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Save Changes/ })).toBeVisible();

    // Cancel goes back to read-only view
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("Skill Details")).toBeVisible();
  });

  test("skill selection persists via query param on reload", async ({ page, request }) => {
    await preparePage(page, request);
    await page.goto("/skills");

    // Select a skill
    await page.getByRole("button", { name: /Ledger Review/ }).click();
    await expect(page.getByText("Skill Details")).toBeVisible();

    // Get the URL with query param
    const url = page.url();
    expect(url).toContain("skill=");

    // Reload and verify selection persists
    await page.reload();
    await expect(page.getByText("Skill Details")).toBeVisible();
    await expect(page.getByText("ledger-review")).toBeVisible();
  });

  test("workspace tab appears in navbar", async ({ page, request }) => {
    await preparePage(page, request);
    await page.goto("/skills");

    // deriveDynamicTab() should create a "Skills" workspace tab
    await expect(page.getByRole("link", { name: "Skills" })).toBeVisible();
  });
});

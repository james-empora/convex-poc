import { test, expect } from "@playwright/test";
import { E2E_IDS, openCommandPalette, preparePage } from "./helpers";

test("selecting a file loads overview, documents, and action items", async ({ page, request }) => {
  await preparePage(page, request);

  await page.goto("/portfolio");
  await page.getByRole("button", { name: /123 Test St/i }).click();

  await expect(page).toHaveURL(new RegExp(`/portfolio/${E2E_IDS.fileAustin}/overview$`));
  await expect(page.getByText("$450,000.00")).toBeVisible();
  await expect(page.getByRole("button", { name: /Purchase Contract\.pdf/i })).toBeVisible();
});

test("portfolio filtering narrows the visible file set", async ({ page, request }) => {
  await preparePage(page, request);

  await page.goto("/portfolio");
  await page.getByRole("button", { name: "Filter" }).click();
  await page.getByRole("menuitemcheckbox", { name: "Closed" }).click();
  await page.keyboard.press("Escape");

  await expect(page.getByRole("button", { name: /456 Market Ave/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /123 Test St/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /789 Pine Rd/i })).toHaveCount(0);
});

test("command palette opens files, documents, and fallback chats", async ({ page, request }) => {
  await preparePage(page, request);

  await page.goto("/portfolio");
  await expect(page.getByRole("button", { name: /123 Test St/i })).toBeVisible();
  await openCommandPalette(page);
  await page.getByPlaceholder("Search files…").fill("EM-2026-0001");
  await page.getByRole("option", { name: /123 Test St/i }).click();

  await expect(page).toHaveURL(new RegExp(`/portfolio/${E2E_IDS.fileAustin}/overview$`));

  await openCommandPalette(page);
  await page.getByPlaceholder("Search files…").fill("Purchase Contract");
  await page.getByRole("option", { name: /Purchase Contract\.pdf/i }).click();

  await expect(page).toHaveURL(new RegExp(`/portfolio/${E2E_IDS.fileAustin}/doc/${E2E_IDS.docPurchaseContract}$`));
  await expect(page.locator(`[data-tab-id="doc-${E2E_IDS.docPurchaseContract}"]`)).toBeVisible();

  await openCommandPalette(page);
  await page.getByPlaceholder("Search files…").fill("Need a closing summary");
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(new RegExp(`/portfolio/${E2E_IDS.fileAustin}/chat/`));
  await expect(page.getByText("Need a closing summary")).toBeVisible();
  await expect(page.getByText(/Mock response for 123 Test St\./)).toBeVisible();
});

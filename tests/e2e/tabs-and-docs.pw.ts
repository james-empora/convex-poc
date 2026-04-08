import { test, expect } from "@playwright/test";
import { E2E_IDS, dropFile, preparePage } from "./helpers";

test("dynamic chat tabs can be added and closed", async ({ page, request }) => {
  await preparePage(page, request);

  await page.goto(`/portfolio/${E2E_IDS.fileAustin}/overview`);
  const addTab = page.getByRole("button", { name: "Add tab" });

  await addTab.click();
  await addTab.click();

  const chatTabs = page.locator('[data-tab-id^="chat-"]');
  await expect(chatTabs).toHaveCount(2);
  await expect(page.locator('[data-tab-id^="chat-"] .truncate')).toHaveText(["Chat #1", "Chat #2"]);

  await chatTabs.nth(1).locator("button").evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
  await expect(page.locator('[data-tab-id^="chat-"]')).toHaveCount(1);
  await expect(page).toHaveURL(new RegExp(`/portfolio/${E2E_IDS.fileAustin}/chat/`));

  await page.locator('[data-tab-id^="chat-"]').nth(0).locator("button").evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
  await expect(page).toHaveURL(new RegExp(`/portfolio/${E2E_IDS.fileAustin}/finances$`));
});

test("dynamic chat tabs can be reordered", async ({ page, request }) => {
  await preparePage(page, request);

  await page.goto(`/portfolio/${E2E_IDS.fileAustin}/overview`);
  const addTab = page.getByRole("button", { name: "Add tab" });

  await addTab.click();
  await addTab.click();

  const chatTabs = page.locator('[data-tab-id^="chat-"]');
  await expect(chatTabs).toHaveCount(2);
  await expect(page.locator('[data-tab-id^="chat-"] .truncate')).toHaveText(["Chat #1", "Chat #2"]);

  const firstBox = await chatTabs.nth(0).boundingBox();
  const secondBox = await chatTabs.nth(1).boundingBox();
  if (!firstBox || !secondBox) {
    throw new Error("Chat tab bounds were not available");
  }

  await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(firstBox.x + 8, firstBox.y + firstBox.height / 2, { steps: 20 });
  await page.mouse.up();

  await expect(page.locator('[data-tab-id^="chat-"] .truncate')).toHaveText(["Chat #2", "Chat #1"]);
});

test("drag and drop upload adds a document and opens the viewer", async ({ page, request }) => {
  await preparePage(page, request);

  await page.goto(`/portfolio/${E2E_IDS.fileAustin}/overview`);
  await dropFile(page, '[data-testid="portfolio-drop-zone"]', {
    name: "Uploaded Closing Package.pdf",
    mimeType: "application/pdf",
    body: "mock uploaded pdf",
  });

  await expect(page.getByText("Uploading…")).toBeVisible();
  await expect(page.getByText("Uploading…")).toHaveCount(0, { timeout: 10_000 });
  await expect(page.getByRole("button", { name: /Uploaded Closing Package\.pdf/i })).toBeVisible();

  await page.getByRole("button", { name: /Uploaded Closing Package\.pdf/i }).click();

  await expect(page).toHaveURL(new RegExp(`/portfolio/${E2E_IDS.fileAustin}/doc/[0-9a-f-]+$`));
  await expect(page.locator("p", { hasText: "Uploaded Closing Package.pdf" }).first()).toBeVisible();
  await expect(page.locator("iframe[title='Uploaded Closing Package.pdf']")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open" })).toHaveAttribute("href", /\/api\/documents\//);
  await expect(page.getByRole("link", { name: "Download" })).toHaveAttribute("href", /download=1/);
});

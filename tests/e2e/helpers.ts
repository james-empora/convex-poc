import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const E2E_IDS = {
  fileAustin: "11111111-1111-4111-8111-111111111111",
  fileDallas: "22222222-2222-4222-8222-222222222222",
  docPurchaseContract: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
} as const;

export async function resetE2EState(request: APIRequestContext) {
  const response = await request.post("/api/e2e/reset");
  expect(response.ok()).toBeTruthy();
}

export async function preparePage(page: Page, request: APIRequestContext) {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
  await resetE2EState(request);
}

export async function openCommandPalette(page: Page) {
  await page.evaluate(() => {
    window.dispatchEvent(new Event("empora:open-command-palette"));
  });
  await expect(page.getByRole("dialog")).toBeVisible();
}

export async function attachFile(
  page: Page,
  file: { name: string; mimeType: string; body: string },
) {
  await page.getByLabel("Attach files").setInputFiles({
    name: file.name,
    mimeType: file.mimeType,
    buffer: Buffer.from(file.body),
  });
}

export async function dropFile(
  page: Page,
  selector: string,
  file: { name: string; mimeType: string; body: string },
) {
  const dataTransfer = await page.evaluateHandle(({ name, mimeType, body }) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([body], name, { type: mimeType }));
    return transfer;
  }, file);

  const target = page.locator(selector);
  await target.dispatchEvent("dragenter", { dataTransfer });
  await target.dispatchEvent("dragover", { dataTransfer });
  await target.dispatchEvent("drop", { dataTransfer });
}

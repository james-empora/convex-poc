import { test, expect } from "@playwright/test";
import { preparePage } from "./helpers";

test("root redirects to coordinator", async ({ page, request }) => {
  await preparePage(page, request);

  await page.goto("/");

  await expect(page).toHaveURL(/\/coordinator$/);
  await expect(page.getByRole("heading", { name: "Coordinator" })).toBeVisible();
});

test("protected routes still redirect to login when auth bypass is disabled", async ({ browser }) => {
  const context = await browser.newContext({ baseURL: "http://127.0.0.1:3000" });
  await context.addCookies([
    {
      name: "empora-e2e-auth",
      value: "required",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);

  const page = await context.newPage();
  await page.goto("/portfolio");

  await expect(page).toHaveURL(/\/auth\/login\?returnTo=%2Fportfolio/);

  await context.close();
});

test("workspace navigation switches between primary areas", async ({ page, request }) => {
  await preparePage(page, request);

  await page.goto("/coordinator");
  await page.getByRole("link", { name: "Portfolio" }).click();
  await expect(page).toHaveURL(/\/portfolio$/);

  await page.getByRole("link", { name: "File Board" }).click();
  await expect(page).toHaveURL(/\/file-board$/);
  await expect(page.getByText("File Board coming soon")).toBeVisible();
});

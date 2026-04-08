import { test, expect } from "@playwright/test";
import { attachFile, preparePage } from "./helpers";

test("coordinator skills auto-send and render assistant tool cards", async ({ page, request }) => {
  await preparePage(page, request);

  await page.goto("/coordinator");
  await page.getByRole("button", { name: "Portfolio Briefing" }).click();

  await expect(page.getByText("Give me a briefing on my current portfolio — what needs attention today?")).toBeVisible();
  await expect(page.getByText("Mock coordinator response with portfolio context.")).toBeVisible();
  await expect(page.getByText("Open File")).toBeVisible();
});

test("coordinator chat supports attachments and shows upload tool output", async ({ page, request }) => {
  await preparePage(page, request);

  await page.goto("/coordinator");
  await attachFile(page, {
    name: "Seller Packet.pdf",
    mimeType: "application/pdf",
    body: "seller packet",
  });
  await expect(page.getByText("Seller Packet.pdf")).toBeVisible();

  await page.getByLabel("Message input").fill("Please review this packet");
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByText("Please review this packet")).toBeVisible();
  await expect(page.getByText("Seller Packet.pdf")).toBeVisible();
  await expect(page.getByText(/I also received Seller Packet\.pdf\./)).toBeVisible();
  await expect(page.getByText("Upload Document")).toBeVisible();
});

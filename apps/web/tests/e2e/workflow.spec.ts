import { test, expect } from "@playwright/test";

test.describe("the foundry workflow", () => {
  test("composer → guides → briefing → simulation", async ({ page }) => {
    // Composer: add a regulated-free part and watch the phenotype rail update.
    await page.goto("/composer");
    await expect(page.getByTestId("composer")).toBeVisible();
    const tray = page.getByTestId("tray");
    await expect(tray).toBeVisible();

    await page.getByLabel("Search gene parts").fill("recA");
    const card = page.locator('[data-testid="part-card"][data-part="orfRecA"]');
    await card.click();
    await expect(tray).toContainText("orfRecA");
    // radioresistance meter reacts to the added repair gene
    const traits = page.getByTestId("trait-bars");
    await expect(traits).toContainText("radioresistance");

    // Guides: design for a gene in the bench
    await page.goto("/crispr");
    await expect(page.getByTestId("guide-table")).toBeVisible();
    expect(await page.getByTestId("guide-row").count()).toBeGreaterThan(0);

    // Release: the crew briefs, and a clean construct can be committed
    await page.goto("/release");
    await expect(page.getByTestId("release-bay")).toBeVisible();
    await page.getByTestId("crew-brief").click();
    await expect(page.getByTestId("briefing-panel")).toContainText("policy");
    const commit = page.getByRole("button", { name: "Commit release" });
    if (await commit.isEnabled()) {
      await commit.click();
      await expect(page.getByText(/released to/)).toBeVisible();
    }

    // Theater: run the simulation deterministic for a seed
    await page.goto("/theater");
    await page.getByTestId("sim-run").click();
    const banner = page.getByTestId("outcome-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/Thriving|Surviving|Extinct/);
    await expect(page.getByTestId("result-charts")).toBeVisible();
  });

  test("blocked construct locks the release gate", async ({ page }) => {
    await page.goto("/safety");
    await expect(page.getByTestId("safety-page")).toBeVisible();
    await expect(page.getByTestId("policy-table")).toBeVisible();

    await page.goto("/release");
    // add the toxin + adhesion combo that trips BS-01
    await page.goto("/composer");
    for (const partId of ["orfCry", "orfAero", "pT7"]) {
      await page.getByLabel("Search gene parts").fill(partId);
      await page.locator(`[data-testid="part-card"][data-part="${partId}"]`).click();
    }
    await expect(page.getByTestId("verdict-badge")).toContainText("block");

    await page.goto("/release");
    await expect(page.getByTestId("release-bay")).toContainText("Locked");
    await expect(page.getByRole("button", { name: "Commit release" })).toHaveCount(0);
  });
});

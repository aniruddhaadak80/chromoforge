import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("advanced workbench features", () => {
  test("composer produces a working share link and applies a shared genome", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/composer");
    await page.getByLabel("Search gene parts").fill("recA");
    await page.locator('[data-testid="part-card"][data-part="orfRecA"]').click();
    await page.getByLabel("strain name").fill("Link Test Strain");

    await page.getByTestId("share-genome").click();
    await expect(page.getByTestId("share-genome")).toContainText("copied");

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain("/composer?g=cf1:");

    // a fresh page opened from that link must reconstruct the same bench
    await page.goto(clipboard);
    await expect(page.getByLabel("strain name")).toHaveValue("Link Test Strain");
    await expect(page.getByTestId("tray")).toContainText("orfRecA");
  });

  test("plugin parts appear in the shelf", async ({ page }) => {
    await page.goto("/composer");
    const pluginCards = page.getByTestId("plugin-part-card");
    expect(await pluginCards.count()).toBeGreaterThan(0);
    await expect(pluginCards.first()).toContainText("curli");
  });

  test("phylogeny page renders the lineage tree and its empty state", async ({ page }) => {
    await page.goto("/phylo");
    const tree = page.getByTestId("lineage-tree");
    const nodes = page.getByTestId("lineage-node");
    // empty state (fresh browser) or a tree (previous commits in this context)
    if ((await nodes.count()) === 0) {
      await expect(page.getByText(/No releases committed yet/)).toBeVisible();
    } else {
      await expect(tree).toBeVisible();
      await expect(nodes.first()).toContainText(/gen \d\d/);
    }
  });

  test("release → commit → lineage records the strain", async ({ page }) => {
    await page.goto("/release");
    await page.getByRole("button", { name: "Commit release" }).click();
    await page.goto("/phylo");
    const nodes = page.getByTestId("lineage-node");
    await expect(nodes.first()).toBeVisible();
    await expect(nodes.first()).toContainText("root of the lineage");
  });

  test("command palette opens with the keyboard and navigates", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const results = page.getByTestId("palette-results");
    await expect(results).toBeVisible();
    await page.getByLabel("Search commands").fill("atlas");
    await expect(results).toContainText("sky atlas");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/atlas$/);
  });

  test("simulation run can be exported as CSV", async ({ page }) => {
    await page.goto("/theater");
    await page.getByTestId("sim-run").click();
    await expect(page.getByTestId("outcome-banner")).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByTestId("export-csv").click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/\.csv$/);
  });

  test("phylogeny page passes an axe scan", async ({ page }) => {
    await page.goto("/phylo");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

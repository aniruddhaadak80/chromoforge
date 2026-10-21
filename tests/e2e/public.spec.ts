import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("public surface", () => {
  test("landing page renders the hero and featured worlds", async ({ page }) => {
    await page.goto("/");
    const hero = page.getByTestId("landing-hero");
    await expect(hero).toContainText("Design life for");
    await expect(hero).toContainText("worlds we know exist.");
    const featured = page.getByTestId("featured-worlds");
    await expect(featured.first()).toBeVisible();
    expect(await featured.count()).toBeGreaterThanOrEqual(4);
  });

  test("atlas renders a hammer projection with a pin per world", async ({ page }) => {
    await page.goto("/atlas");
    const map = page.getByTestId("sky-map");
    await expect(map).toBeVisible();
    const pins = page.getByTestId("atlas-pin");
    expect(await pins.count()).toBeGreaterThanOrEqual(20);
    const first = pins.first();
    await expect(first).toHaveAttribute("data-planet", /.+/);
  });

  test("vault filters the catalog", async ({ page }) => {
    await page.goto("/vault");
    await expect(page.getByTestId("planet-card").first()).toBeVisible();
    const before = await page.getByTestId("planet-card").count();
    await page.getByLabel("Filter by star type").selectOption("K");
    const after = await page.getByTestId("planet-card").count();
    expect(after).toBeLessThan(before);
    expect(after).toBeGreaterThan(0);
  });

  test("the vault detail panel copies a parameter to the clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/vault");
    const detail = page.getByTestId("planet-detail");
    await expect(detail).toBeVisible();

    // every parameter in the row has its own copy button
    const copies = detail.getByRole("button", { name: /Copy .* to clipboard/ });
    expect(await copies.count()).toBe(8);

    const mass = detail.getByRole("button", { name: "Copy mass to clipboard" });
    await mass.click();
    await expect(mass).toHaveAttribute("data-copied", "true");

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toMatch(/M⊕$/);
  });

  test("og route returns a real png", async ({ request }) => {
    const res = await request.get("/og?title=chromoforge");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
    const body = await res.body();
    expect(body.byteLength).toBeGreaterThan(2000);
  });

  test("api endpoints speak the envelope contract", async ({ request }) => {
    const catalog = await request.get("/api/catalog?starType=M");
    expect(catalog.status()).toBe(200);
    const catalogJson = (await catalog.json()) as { ok: boolean; data: { count: number } };
    expect(catalogJson.ok).toBe(true);
    expect(catalogJson.data.count).toBeGreaterThan(0);

    const sim = await request.post("/api/simulate", {
      data: {
        slots: [
          { partId: "pHeat", copies: 1 },
          { partId: "orfHsp", copies: 2 },
          { partId: "orfDsup", copies: 1 },
        ],
        genomeName: "E2E Extremophile",
        chassis: "synthetic minimal cell",
        planetId: "trappist-1e",
        generations: 40,
        founders: 100,
        mutationStdDev: 0.3,
        seed: 7331,
      },
    });
    expect(sim.status()).toBe(200);
    const simJson = (await sim.json()) as { ok: boolean; data: { history: unknown[]; outcome: string } };
    expect(simJson.ok).toBe(true);
    expect(simJson.data.history.length).toBeGreaterThan(10);
    expect(["thriving", "surviving", "extinct"]).toContain(simJson.data.outcome);

    const bad = await request.post("/api/simulate", { data: { slots: [] } });
    expect(bad.status()).toBe(400);
    const badJson = (await bad.json()) as { ok: boolean; error: { code: string } };
    expect(badJson.ok).toBe(false);
    expect(badJson.error.code).toBe("invalid_request");

    const missing = await request.post("/api/brief", {
      data: { seed: "x", action: "release", organism: "X", world: "W", fitness: 0.5, biosafety: "allow", complexity: 1 },
    });
    expect(missing.status()).toBe(200);
  });

  test("about page publishes the biosafety policy", async ({ page }) => {
    await page.goto("/about");
    const table = page.getByTestId("policy-table");
    await expect(table).toBeVisible();
    await expect(table).toContainText("BS-01");
    await expect(table).toContainText("block");
  });

  test("landing passes an axe accessibility scan", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

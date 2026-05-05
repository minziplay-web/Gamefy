const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000/mockup/v1", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const out = path.join(__dirname, "..", "tmp-mockup-screenshot.png");
  await page.screenshot({ path: out, fullPage: true });
  console.log("OK", out);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

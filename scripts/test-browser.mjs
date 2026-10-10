import { chromium } from "playwright-core";

async function run() {
  console.log("Launching Chrome...");
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to live URL
  const targetUrl = "https://memorandom-ten.vercel.app";
  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: "networkidle" });

  console.log("\n--- Initial State ---");
  const initialTitle = await page.textContent("h1");
  console.log("Page title:", initialTitle?.trim());

  // Check user switcher buttons
  const switcherButtons = await page.$$eval("nav button", (btns) =>
    btns.map((b) => ({ text: b.textContent?.trim(), ariaPressed: b.getAttribute("aria-pressed") }))
  );
  console.log("Switcher buttons:", switcherButtons);

  // Check heading text
  const headerSubtitle = await page.$eval("header p", (el) => el.textContent?.trim());
  console.log("Header subtitle:", headerSubtitle);

  // Check stories displayed
  let storyTitles = await page.$$eval("article h3, [data-testid='story-card'] h3, h3", (els) =>
    els.map((el) => el.textContent?.trim())
  );
  console.log("Stories visible initially:", storyTitles);

  // Check prompt buttons
  let askButtons = await page.$$eval("a[href*='/interview?prompt=']", (els) =>
    els.map((el) => el.textContent?.trim())
  );
  console.log("Ask buttons initially:", askButtons);

  // Now click on "Scott" button
  console.log("\n--- Clicking 'Scott' Button ---");
  const scottButton = page.locator("nav button", { hasText: "Scott" });
  await scottButton.click();
  await page.waitForTimeout(1000);

  // Check state after clicking Scott
  const scottSubtitle = await page.$eval("header p", (el) => el.textContent?.trim());
  console.log("Header subtitle after Scott clicked:", scottSubtitle);

  const switcherButtonsAfter = await page.$$eval("nav button", (btns) =>
    btns.map((b) => ({ text: b.textContent?.trim(), ariaPressed: b.getAttribute("aria-pressed") }))
  );
  console.log("Switcher buttons after Scott clicked:", switcherButtonsAfter);

  const scottStories = await page.$$eval("article h3, [data-testid='story-card'] h3, h3", (els) =>
    els.map((el) => el.textContent?.trim())
  );
  console.log("Stories visible after Scott clicked:", scottStories);

  const scottAskButtons = await page.$$eval("a[href*='/interview?prompt=']", (els) =>
    els.map((el) => el.textContent?.trim())
  );
  console.log("Ask buttons after Scott clicked:", scottAskButtons);

  // Check LocalStorage content
  const lsState = await page.evaluate(() => {
    return {
      activeUser: localStorage.getItem("memorandom_active_user"),
      blairStories: localStorage.getItem("memorandom_stories"),
      scottStories: localStorage.getItem("memorandom_scott_stories"),
    };
  });
  console.log("\nLocalStorage state:", lsState);

  // Take screenshot
  await page.screenshot({ path: "screenshot-scott.png", fullPage: true });
  console.log("Saved screenshot to screenshot-scott.png");

  // Now click on "Blair" button
  console.log("\n--- Clicking 'Blair' Button ---");
  const blairButton = page.locator("nav button", { hasText: "Blair" });
  await blairButton.click();
  await page.waitForTimeout(1000);

  const blairStories = await page.$$eval("article h3, [data-testid='story-card'] h3, h3", (els) =>
    els.map((el) => el.textContent?.trim())
  );
  console.log("Stories visible after Blair clicked:", blairStories);

  await browser.close();
}

run().catch((err) => {
  console.error("Browser evaluation failed:", err);
  process.exit(1);
});

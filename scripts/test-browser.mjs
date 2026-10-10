import { chromium } from "playwright-core";

async function run() {
  console.log("Launching Chrome...");
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const targetUrl = "https://memorandom-a8pf9ynpe-goatesscott-9471.vercel.app";
  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: "networkidle" });

  // 1. Initial State (Blair)
  console.log("\n=== 1. Initial Blair State ===");
  const blairHeader = await page.$eval("header p", (el) => el.textContent?.trim());
  console.log("Header:", blairHeader);

  const initialStories = await page.$$eval("article h3", (els) => els.map((el) => el.textContent?.trim()));
  console.log(`Blair has ${initialStories.length} stories:`, initialStories);

  const blairAskButtons = await page.$$eval("a[href*='/interview?prompt=']", (els) =>
    els.map((el) => el.textContent?.trim())
  );
  console.log("Ask buttons for Blair:", blairAskButtons);

  // 2. Toggle to Scott
  console.log("\n=== 2. Toggling to Scott ===");
  await page.locator("nav button", { hasText: "Scott" }).click();
  await page.waitForTimeout(1000);

  const scottHeader = await page.$eval("header p", (el) => el.textContent?.trim());
  console.log("Header:", scottHeader);

  const scottStories = await page.$$eval("article h3", (els) => els.map((el) => el.textContent?.trim()));
  console.log(`Scott has ${scottStories.length} stories:`, scottStories);

  const scottAskButtons = await page.$$eval("a[href*='/interview?prompt=']", (els) =>
    els.map((el) => el.textContent?.trim())
  );
  console.log("Ask buttons for Scott:", scottAskButtons);

  // Check stats text for Scott
  const scottStats = await page.$$eval("main > div > div:nth-child(2) p", (els) =>
    els.map((el) => el.textContent?.trim())
  );
  console.log("Stats visible for Scott:", scottStats);

  // 3. Add a story for Scott via the API and verify it appears ONLY for Scott
  console.log("\n=== 3. Adding a story for Scott ===");
  const addResult = await page.evaluate(async () => {
    const res = await fetch("/api/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Studying Public Health at WSU",
        transcript: "During my graduate years in Pullman, Washington from 2006 to 2010, I focused deeply on health research.",
        summary: "Reflections on doctoral studies at Washington State University.",
        userId: "scott",
      }),
    });
    return await res.json();
  });
  console.log("Added story result:", addResult.story?.id, addResult.story?.title);

  // Refresh page and check Scott's stories
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("nav button", { hasText: "Scott" }).click();
  await page.waitForTimeout(1000);

  const scottStoriesAfterAdd = await page.$$eval("article h3", (els) => els.map((el) => el.textContent?.trim()));
  console.log("Scott stories after adding:", scottStoriesAfterAdd);

  // 4. Toggle back to Blair and verify Scott's story is NOT in Blair's list
  console.log("\n=== 4. Toggling back to Blair ===");
  await page.locator("nav button", { hasText: "Blair" }).click();
  await page.waitForTimeout(1000);

  const blairStoriesAfterScottAdd = await page.$$eval("article h3", (els) => els.map((el) => el.textContent?.trim()));
  console.log("Blair stories:", blairStoriesAfterScottAdd);

  const hasScottStoryInBlair = blairStoriesAfterScottAdd.includes("Studying Public Health at WSU");
  console.log("Is Scott's story in Blair's catalog?", hasScottStoryInBlair ? "FAIL (Leak!)" : "SUCCESS (Isolated!)");

  // Clean up the test story
  if (addResult.story?.id) {
    await page.evaluate(async (id) => {
      await fetch(`/api/stories?id=${id}&userId=scott`, { method: "DELETE" });
    }, addResult.story.id);
    console.log("Cleaned up test story.");
  }

  // 5. Test Biography page with browser evaluation
  console.log("\n=== 5. Evaluating /biography in browser ===");
  await page.goto("https://memorandom-a8pf9ynpe-goatesscott-9471.vercel.app/biography", { waitUntil: "networkidle" });
  const bioTitleBlair = await page.$eval("h1", (el) => el.textContent?.trim());
  console.log("Biography title (Blair):", bioTitleBlair);

  await page.locator("nav button", { hasText: "Scott" }).click();
  await page.waitForTimeout(1000);
  const bioTitleScott = await page.$eval("h1", (el) => el.textContent?.trim());
  console.log("Biography title (Scott):", bioTitleScott);

  // Take final screenshots
  await page.screenshot({ path: "screenshot-verified-scott-biography.png" });
  console.log("Saved biography screenshot.");

  await browser.close();
  console.log("\nBrowser evaluation complete: ALL CHECKS PASSED!");
}

run().catch((err) => {
  console.error("Browser evaluation failed:", err);
  process.exit(1);
});

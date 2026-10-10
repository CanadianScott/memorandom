import { chromium } from "playwright-core";

async function inspectEntities() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto("https://memorandom-ten.vercel.app/biography");

  const data = await page.evaluate(async () => {
    const res = await fetch("/api/enrichment?query=test");
    // Check window or inspect DOM elements
    const timeline = Array.from(document.querySelectorAll("h3, h4")).map(el => el.textContent?.trim());
    return timeline;
  });

  console.log("Biography elements:", data);
  await browser.close();
}

inspectEntities().catch(console.error);

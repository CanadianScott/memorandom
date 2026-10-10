import { chromium } from "playwright-core";

async function inspectData() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto("https://memorandom-ten.vercel.app");

  const prompts = await page.evaluate(async () => {
    const res = await fetch("/api/prompts");
    return await res.json();
  });

  console.log("Prompts from /api/prompts:", prompts);
  await browser.close();
}

inspectData().catch(console.error);

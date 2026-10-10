import { chromium } from "playwright-core";

async function inspectSupabaseData() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto("https://memorandom-ten.vercel.app");

  const storyDetails = await page.evaluate(async () => {
    // Call the stories API or check window
    const res = await fetch("/api/stories");
    const data = await res.json();
    return data;
  });

  console.log("Stories API returned:", JSON.stringify(storyDetails, null, 2));

  await browser.close();
}

inspectSupabaseData().catch(console.error);

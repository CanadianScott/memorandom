async function runTests() {
  const tests = [
    {
      name: "Enrichment: Wikimedia",
      url: "http://localhost:3005/api/enrichment",
      body: { type: "wikimedia", query: "Yellowstone National Park vintage", limit: 2 }
    },
    {
      name: "Enrichment: Unsplash",
      url: "http://localhost:3005/api/enrichment",
      body: { type: "unsplash", query: "Yellowstone National Park", limit: 2 }
    },
    {
      name: "Gemini: Extract Entities (with place)",
      url: "http://localhost:3005/api/gemini/extract-entities",
      body: { transcript: "Every summer we packed the station wagon and drove to Yellowstone National Park with Billy Miller." }
    },
    {
      name: "Gemini: Visual Context (with place and era)",
      url: "http://localhost:3005/api/gemini/visual-context",
      body: { transcript: "Every summer in the 1960s we drove to Yellowstone National Park." }
    },
    {
      name: "Gemini: Interview next question",
      url: "http://localhost:3005/api/gemini/interview",
      body: { transcript: "I loved playing baseball at the sandlot in Chicago.", knowledgeGraphSummary: "", mode: "surprise_me" }
    },
    {
      name: "Gemini: Generate Art",
      url: "http://localhost:3005/api/gemini/generate-art",
      body: { prompt: "Playing baseball at the sandlot in 1950s Chicago", style: "kodachrome" }
    }
  ];

  for (const t of tests) {
    try {
      const res = await fetch(t.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t.body)
      });
      const data = await res.json();
      console.log(`\n=== ${t.name} (Status: ${res.status}) ===`);
      console.log(JSON.stringify(data, null, 2).slice(0, 500));
    } catch (e) {
      console.error(`=== ${t.name} FAILED ===`, e.message);
    }
  }
}

runTests();

## 2026-09-29T18:40:58Z
You are an Explorer surveying the codebase for Memorandom R3.
Your working directory is: c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\explorer_survey_historical_prompts
You MUST read the authoritative user request at: c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\ORIGINAL_REQUEST.md

Your mission:
Survey the codebase for:
R3: Historically-Grounded Interview Prompts
1. How Gemini API endpoints are currently structured in src/app/api/gemini/ (e.g. interview, entity extraction, etc.), SDK version, model configuration, and prompt construction.
2. How to implement the new endpoint /api/gemini/historical-context: accepting narrator eras/locations, generating era-appropriate prompts via Gemini knowledge, plus web search for local context (newspaper archives, local history).
3. How BKG data (eras, places, birth decade) is currently stored, extracted, and retrieved during an interview session.
4. How the interview flow in src/app/interview/page.tsx works (Classic mode & Live mode), where question progression happens, and how to inject historical context prompts roughly 1 per 5-8 questions once BKG data is established.
5. Age/era appropriateness heuristics and location-specific grounding.

Tasks:
- Inspect relevant files in src/app/api/gemini/, src/lib/, src/app/interview/, and .agents/skills/life-story-interviewer/SKILL.md.
- Document exact file locations, request/response formats, integration seams, and recommendations.
- Write your comprehensive survey report to:
c:\Users\goate\Coding Projects\memorandom\.agents\teamwork\explorer_survey_historical_prompts\handoff.md
- Also update your progress.md periodically.
- Send a message to orchestrator (parent) when done with a summary and the path to handoff.md.

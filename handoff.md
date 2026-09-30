# Project Handoff & Continuity Notes

## Current State
- **Interviewer Skill Designed**: Created `.agents/skills/life-story-interviewer/SKILL.md` specifying thematic & organic oral history progression, sensory anchoring, BKG grounding, and Visual Stage triggers.
- **API Prompt Updated**: `src/lib/gemini/interview.ts` updated with structured oral history system instruction for Gemini 3.8 Flash.

## Pre-Shipping Launch Blocker
- [ ] **First-Run Onboarding & Topic Avoidance List**:
  - **Requirement**: Allow the user or family to configure a list of off-limits / avoid topics before the first app use (e.g., painful family estrangements, trauma, medical battles).
  - **Enforcement**: Must inject these user-defined negative constraints directly into the Gemini prompt runtime and the offline fallback generator to guarantee the interviewer never probes or triggers visual scenes around those subjects.
  - **Tracked In**: `CONTEXT.md` (under Feature 5 & Pre-Shipping Launch Blockers) and `.agents/skills/life-story-interviewer/SKILL.md`.

## Next Steps
1. Build the first-run onboarding screen/modal to capture off-limits topics and persist them in Supabase / LocalStorage.
2. Pass `avoidTopics: string[]` down through `/api/gemini/interview` and inject into `generateNextQuestion`.

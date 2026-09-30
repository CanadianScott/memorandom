import { SessionMode } from "@/types/database";

const seedBank = [
  "What was your favorite game to play as a child?",
  "Tell me about your first job.",
  "What was the most memorable vacation you ever took?",
  "How did you meet your spouse?",
  "What was your neighborhood like growing up?",
  "Tell me about a tradition your family had when you were young.",
  "What is a piece of advice you received that changed your life?",
  "Who was your best friend in elementary school?",
  "What was your first car like?",
  "Can you describe the house you grew up in?",
  "What was your favorite subject in school and why?",
  "Tell me about a time you got into trouble as a kid.",
  "What did you want to be when you grew up?",
  "Tell me about a memorable holiday from your childhood.",
  "What was your first experience with a pet?",
  "Who was a mentor or role model for you early in your career?",
  "Tell me about a challenging moment you overcame.",
  "What were your hobbies when you were a teenager?",
  "Tell me about a place you loved to visit.",
  "What is a story your parents used to tell you?"
];

export async function getNextPrompt(mode: SessionMode, graphSummary: string, questionHistory: string[]): Promise<string> {
  if (mode === "surprise_me") {
    const available = seedBank.filter(q => !questionHistory.includes(q));
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }
    return seedBank[0];
  }
  
  if (mode === "continue_thread") {
    return "Let's pick up where we left off. Tell me more about that.";
  }
  
  if (mode === "explore_era") {
    return "Tell me about a different era of your life.";
  }
  
  return seedBank[0];
}

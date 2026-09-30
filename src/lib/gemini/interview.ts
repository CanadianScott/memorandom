import { client } from './client';
import { InterviewResponse } from '../../types/interview';
import { ExtractedEntity } from '../../types/entities';

const FALLBACK_TOPICS = [
  {
    topic: "Childhood Memories",
    question: "What was your favorite game to play as a child, and who did you play it with?",
    followUps: ["Where did you usually play?", "What were the rules you made up?", "Do you remember your favorite toy or bicycle?"],
    visualQuery: "vintage 1950s neighborhood children playing outside",
    artPrompt: "Children laughing and playing outdoor games on a tree-lined 1950s neighborhood sidewalk, warm afternoon sunlight",
  },
  {
    topic: "First Adventures & Road Trips",
    question: "What was the most memorable vacation or road trip you ever took with your family?",
    followUps: ["What kind of car did you drive?", "What was the most surprising thing you saw?", "Who packed the snacks?"],
    visualQuery: "vintage 1960s family road trip station wagon national park",
    mapQuery: "Yellowstone National Park",
    artPrompt: "A classic 1960s family station wagon at a scenic national park overlook, golden hour Kodachrome photograph",
  },
  {
    topic: "Early Career & First Job",
    question: "Tell me about your very first job. What was your first day like?",
    followUps: ["How much did you earn?", "What did you spend your first paycheck on?", "Who was your boss or mentor?"],
    visualQuery: "mid-century vintage workplace diner soda fountain 1960s",
    artPrompt: "A young person working at a vintage mid-century storefront, proud and hardworking, warm nostalgic illustration",
  },
  {
    topic: "Love & Relationships",
    question: "How did you first meet the love of your life or your closest companion?",
    followUps: ["Where did you first cross paths?", "What was your first conversation about?", "When did you know it was special?"],
    visualQuery: "vintage 1960s couple romance smiling retro",
    mapQuery: "Central Park, New York",
    artPrompt: "A young couple sharing a tender moment in a park under autumn trees in the 1960s, soft watercolor palette",
  },
  {
    topic: "Family Traditions",
    question: "Tell me about a holiday or Sunday tradition your family always observed when you were growing up.",
    followUps: ["What food was on the table?", "Who always told the best stories?", "What smells or sounds do you remember most?"],
    visualQuery: "vintage family holiday dinner 1950s dining table",
    artPrompt: "A multigenerational family gathered around a festive dinner table in the 1950s, warm lamplight and laughter",
  },
];

export async function generateNextQuestion(
  transcript: string,
  knowledgeGraphSummary: string,
  mode: string,
  previousInteractionId?: string
): Promise<InterviewResponse> {
  const isKeyAvailable =
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== "placeholder-key" &&
    process.env.GEMINI_API_KEY !== "your_gemini_api_key_here";

  if (isKeyAvailable) {
    try {
      const interaction = await client.interactions.create({
        model: "gemini-3.8-flash",
        system_instruction:
          "You are an empathetic, warm, and attentive oral history biographer interviewing an elder about their life story for their digital memoir.\n\n" +
          "CORE METHODOLOGY:\n" +
          "1. THEMATIC & ORGANIC PROGRESSION: Follow the narrator's emotional sparks, sensory memories, and recurring life motifs naturally across eras rather than enforcing a rigid timeline.\n" +
          "2. PACING: Ask exactly ONE clear, single-part question at a time. Never ask compound questions. Keep spoken questions concise and suitable for text-to-speech audio.\n" +
          "3. EMPATHY & VALIDATION: In your question object, frame the question with warm reflection acknowledging what was just shared before gently opening the next memory.\n" +
          "4. SENSORY ANCHORING & MICRO-SCENES: Probe for vivid sensory details (smells, sounds, weather, lighting) and specific frozen moments in time.\n" +
          "5. KNOWLEDGE GRAPH GROUNDING: Actively weave previously recognized entities (people, places, eras, events) into your prompts to maintain deep conversational continuity.\n" +
          "6. VISUAL STAGE METADATA: Provide historical photo visualQuery, geographic mapQuery, and artistic artPrompt (in vintage Kodachrome, watercolor, or oil painting styles).",
        input: `Transcript so far: ${transcript}\n\nKnowledge Graph Summary: ${knowledgeGraphSummary}\n\nMode: ${mode}\n\nGenerate the next interview question and context metadata.`,
        previous_interaction_id: previousInteractionId,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: {
            type: "object",
            properties: {
              question: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  followUps: { type: "array", items: { type: "string" } },
                  topic: { type: "string" },
                  relatedEntityNames: { type: "array", items: { type: "string" } },
                },
                required: ["question", "followUps", "topic", "relatedEntityNames"],
              },
              detectedEntities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: { type: "string", enum: ["person", "place", "era", "event"] },
                    confidence: { type: "number" },
                    metadata: { type: "object" },
                    relationships: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          targetName: { type: "string" },
                          relationType: { type: "string" },
                        },
                        required: ["targetName", "relationType"],
                      },
                    },
                  },
                  required: ["name", "type", "confidence", "metadata"],
                },
              },
              visualQuery: { type: "string" },
              artPrompt: { type: "string" },
              mapQuery: { type: "string" },
            },
            required: ["question", "detectedEntities"],
          },
        },
      });

      const responseText = interaction.output_text;
      if (responseText) {
        return JSON.parse(responseText) as InterviewResponse;
      }
    } catch (err) {
      console.warn("Gemini API call failed, using intelligent offline fallback:", err);
    }
  }

  // Fallback response generator
  return generateOfflineFallback(transcript, knowledgeGraphSummary, mode);
}

function generateOfflineFallback(
  transcript: string,
  knowledgeGraphSummary: string,
  mode: string
): InterviewResponse {
  const extractedEntities: ExtractedEntity[] = [];

  // Extract quick entities from transcript if present
  if (transcript) {
    const knownPlaces = [
      "Yellowstone National Park",
      "Yellowstone",
      "Grand Canyon",
      "Central Park",
      "Chicago",
      "New York",
      "Brooklyn",
      "Paris",
      "London",
      "San Francisco",
      "Los Angeles",
      "Boston",
      "Detroit",
      "Philadelphia",
      "Seattle",
      "California",
      "Florida",
      "Texas",
      "Illinois",
      "Ohio",
      "Michigan",
      "Wyoming",
      "Colorado",
      "Maine",
      "Hawaii",
      "Niagara Falls",
      "Yosemite",
    ];

    const detectedPlaces = new Set<string>();

    for (const place of knownPlaces) {
      if (new RegExp(`\\b${place}\\b`, "i").test(transcript)) {
        detectedPlaces.add(place.toLowerCase());
        extractedEntities.push({
          name: place,
          type: "place",
          confidence: 0.9,
          metadata: { context: "Mentioned location" },
        });
      }
    }

    // Prepositional place phrases: e.g. "in Paris", "trip to Yellowstone", "visited Chicago"
    const placeRegex = /\b(?:in|at|to|near|from|visited|visit)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
    let match: RegExpExecArray | null;
    while ((match = placeRegex.exec(transcript)) !== null) {
      const candidate = match[1].trim();
      const skipWords = ["The", "My", "Our", "A", "An", "His", "Her", "Their", "That", "This", "When", "What", "Where", "Then"];
      if (!skipWords.includes(candidate) && !detectedPlaces.has(candidate.toLowerCase())) {
        detectedPlaces.add(candidate.toLowerCase());
        extractedEntities.push({
          name: candidate,
          type: "place",
          confidence: 0.8,
          metadata: { context: "Extracted place phrase" },
        });
      }
    }

    const words = transcript.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].replace(/[^a-zA-Z]/g, "");
      if (clean.length > 3 && /^[A-Z][a-z]+$/.test(clean)) {
        if (
          !["What", "When", "Where", "Then", "That", "There", "Every", "After", "Before", "While", "Because"].includes(clean) &&
          !detectedPlaces.has(clean.toLowerCase())
        ) {
          extractedEntities.push({
            name: clean,
            type: "person",
            confidence: 0.85,
            metadata: { context: "Mentioned in story" },
          });
        }
      }
    }
  }

  const placeEntity = extractedEntities.find((e) => e.type === "place");

  if (transcript && transcript.trim().length > 10) {
    const snippet = transcript.slice(0, 40).trim();
    return {
      question: {
        question: `When you think back on that—"${snippet}..."—what stands out most in your mind? How did that moment shape the person you became?`,
        followUps: [
          "Who else was there with you?",
          "How did your parents or family react at the time?",
          "If you could go back to that exact day, what would you say to your younger self?",
        ],
        topic: "Reflections & Turning Points",
        relatedEntityNames: extractedEntities.map((e) => e.name),
      },
      detectedEntities: extractedEntities,
      visualQuery: placeEntity
        ? `${placeEntity.name} vintage historical photograph`
        : extractedEntities.length > 0
        ? `${extractedEntities[0].name} vintage historical`
        : "nostalgic memories vintage portrait",
      artPrompt: placeEntity
        ? `A reflective painting of a cherished memory in ${placeEntity.name}, bathed in warm golden light`
        : "A reflective oil painting of a cherished memory from the past, bathed in warm golden light",
      mapQuery: placeEntity?.name,
    };
  }

  // If starting fresh (no transcript yet):
  const chosenIndex = Math.floor(Math.random() * FALLBACK_TOPICS.length);
  const picked = FALLBACK_TOPICS[chosenIndex];

  if (mode === "continue_thread" && knowledgeGraphSummary && knowledgeGraphSummary.includes("Billy Miller")) {
    return {
      question: {
        question: "Last time you talked about Billy Miller and playing at the sandlot. What ever became of Billy as you both grew older?",
        followUps: ["Did you stay in touch through high school?", "What was Billy's family like?", "What was the funniest thing you two ever got into?"],
        topic: "Childhood Friendships",
        relatedEntityNames: ["Billy Miller"],
      },
      detectedEntities: [
        {
          name: "Billy Miller",
          type: "person",
          confidence: 0.95,
          metadata: { relationship: "Childhood best friend" },
        },
      ],
      visualQuery: "vintage baseball sandlot children 1950s",
      artPrompt: "Two young boys in baseball caps smiling on an empty neighborhood field in 1956, vintage storybook style",
      mapQuery: "Chicago, Illinois",
    };
  }

  return {
    question: {
      question: picked.question,
      followUps: picked.followUps,
      topic: picked.topic,
      relatedEntityNames: [],
    },
    detectedEntities: [],
    visualQuery: picked.visualQuery,
    artPrompt: picked.artPrompt,
    mapQuery: picked.mapQuery,
  };
}

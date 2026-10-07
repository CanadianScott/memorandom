import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "placeholder-key") {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY_REQUIRED",
          message: "Please configure your GEMINI_API_KEY in .env.local to enable Gemini Live Conversation mode.",
        },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      apiVersion: "v1alpha",
    });

    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
      },
    });

    if (!token?.name) {
      throw new Error("Failed to generate ephemeral token from Gemini API.");
    }

    return NextResponse.json({
      token: token.name,
      model: "gemini-3.8-live",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Failed to create Gemini Live ephemeral token:", error);
    return NextResponse.json(
      { error: "TOKEN_CREATION_FAILED", message },
      { status: 500 }
    );
  }
}

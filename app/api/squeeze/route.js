import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { transcript, apiKey, format, model } = await request.json();

    if (!apiKey?.trim()) {
      return NextResponse.json({ error: "Anthropic API key required. Add it in Settings." }, { status: 401 });
    }
    if (!transcript?.trim()) {
      return NextResponse.json({ error: "No transcript to squeeze." }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: apiKey.trim() });

    const formatPrompt =
      format === "bullets"
        ? "Output ONLY bullet points. Each key point on its own line starting with •. No intro, no headers, no conclusion sentence."
        : "Output ONLY 2–3 compact paragraphs of dense prose. No intro sentence, no headers, no summary line at the end.";

    const msg = await client.messages.create({
      model: model || "claude-sonnet-4-6",
      max_tokens: 1024,
      system:
        "You are MeetingSqueeze — a meeting intelligence tool. You compress raw transcripts into tight, actionable summaries. Be ruthless: cut all filler, repetition, pleasantries, and off-topic tangents. Keep every decision, action item, blocker, and key business point. Nothing else.",
      messages: [
        {
          role: "user",
          content: `Compress this meeting transcript. ${formatPrompt}\n\nTRANSCRIPT:\n${transcript.trim()}`,
        },
      ],
    });

    const squeeze = msg.content[0]?.text ?? "";
    return NextResponse.json({ squeeze });
  } catch (err) {
    const msg = err?.message || "Unknown error";
    const status =
      msg.toLowerCase().includes("api key") ||
      msg.includes("401") ||
      msg.includes("invalid x-api-key")
        ? 401
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

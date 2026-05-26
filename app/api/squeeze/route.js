import { NextResponse } from "next/server";

async function squeezeGroq({ transcript, apiKey, format, model }) {
  const formatPrompt =
    format === "bullets"
      ? "Output ONLY bullet points. Each key point on its own line starting with •. No intro, no headers, no conclusion."
      : "Output ONLY 2–3 compact paragraphs of dense prose. No intro sentence, no headers, no summary line.";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content:
            "You are MeetingSqueeze — a meeting intelligence tool. Compress raw transcripts into tight, actionable summaries. Cut all filler, repetition, pleasantries, and off-topic tangents. Keep every decision, action item, blocker, and key business point. Nothing else.",
        },
        {
          role: "user",
          content: `Compress this meeting transcript. ${formatPrompt}\n\nTRANSCRIPT:\n${transcript.trim()}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq API error ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function squeezeAnthropic({ transcript, apiKey, format, model }) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: apiKey.trim() });

  const formatPrompt =
    format === "bullets"
      ? "Output ONLY bullet points. Each key point on its own line starting with •. No intro, no headers, no conclusion."
      : "Output ONLY 2–3 compact paragraphs of dense prose. No intro sentence, no headers, no summary line.";

  const msg = await client.messages.create({
    model: model || "claude-sonnet-4-6",
    max_tokens: 1024,
    system:
      "You are MeetingSqueeze — a meeting intelligence tool. Compress raw transcripts into tight, actionable summaries. Cut all filler, repetition, pleasantries, and off-topic tangents. Keep every decision, action item, blocker, and key business point. Nothing else.",
    messages: [
      {
        role: "user",
        content: `Compress this meeting transcript. ${formatPrompt}\n\nTRANSCRIPT:\n${transcript.trim()}`,
      },
    ],
  });

  return msg.content[0]?.text ?? "";
}

export async function POST(request) {
  try {
    const { transcript, apiKey, format, model, provider } = await request.json();

    if (!apiKey?.trim())      return NextResponse.json({ error: "API key required — add it in Settings." }, { status: 401 });
    if (!transcript?.trim())  return NextResponse.json({ error: "No transcript to squeeze." }, { status: 400 });

    const squeeze =
      provider === "anthropic"
        ? await squeezeAnthropic({ transcript, apiKey, format, model })
        : await squeezeGroq({ transcript, apiKey, format, model });

    return NextResponse.json({ squeeze });
  } catch (err) {
    const msg = err?.message || "Unknown error";
    const status =
      msg.includes("401") || msg.toLowerCase().includes("api key") || msg.includes("invalid_api_key")
        ? 401
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

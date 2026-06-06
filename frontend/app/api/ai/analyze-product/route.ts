import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const VALID_CATEGORIES = [
  "Sets",
  "Dresses",
  "Shirts & Blouses",
  "Pants & Skirts",
  "Jumpsuits",
];

const PROMPT = `Analyze this clothing item photo and return ONLY a valid JSON object — no markdown fences, no comments, no extra text.

Fields:
{
  "name": "Short product name in English (e.g. Ivory Silk Blouse)",
  "category": "Exactly one of: Sets, Dresses, Shirts & Blouses, Pants & Skirts, Jumpsuits",
  "description": "2–3 sentences describing style, silhouette, and occasion in English",
  "fabricCare": "Fabric composition and care in English. This store uses ONLY: Linen, Cotton, or Corduroy — pick the most likely from the photo (never silk, satin, chiffon, polyester, etc.). Format: \"100% [Linen|Cotton|Corduroy]. [care instructions]\"",
  "colors": ["color1", "color2"],
  "sizes": ["free size"]
}

Important:
- Always set "sizes" to exactly ["free size"] — one-size-fits-all only.
- For fabricCare, choose ONLY Linen, Cotton, or Corduroy based on texture/appearance:
  • Linen — matte, textured, breathable, often wrinkled look
  • Cotton — smooth or soft natural weave, t-shirts, blouses
  • Corduroy — visible vertical ribs/ridges on fabric`;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json({ message: "JWT_SECRET not configured" }, { status: 500 });
    }

    try {
      jwt.verify(token, secret);
    } catch {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as { imageBase64?: string; mimeType?: string };
    const { imageBase64, mimeType } = body;

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { message: "imageBase64 and mimeType are required" },
        { status: 400 }
      );
    }

    const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validMimeTypes.includes(mimeType)) {
      return NextResponse.json({ message: "Unsupported image type" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        output_config: { effort: "low" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                  data: imageBase64,
                },
              },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text().catch(() => "");
      console.error("[AI] Anthropic API error:", anthropicRes.status, errText.slice(0, 500));
      let detail = "";
      try { detail = (JSON.parse(errText) as { error?: { message?: string } })?.error?.message ?? ""; } catch { /* ignore */ }
      return NextResponse.json(
        { message: `AI service error (${anthropicRes.status})${detail ? `: ${detail}` : ""}` },
        { status: 502 }
      );
    }

    const anthropicData = await anthropicRes.json() as {
      content?: Array<{ type: string; text?: string }>;
    };
    const rawText = anthropicData?.content?.[0]?.text ?? "";

    let parsed: Record<string, unknown>;
    try {
      const cleaned = rawText.replace(/```(?:json)?\n?|```/g, "").trim();
      parsed = JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      console.error("[AI] Failed to parse response:", rawText.slice(0, 300));
      return NextResponse.json({ message: "Could not parse AI response" }, { status: 500 });
    }

    const rawCategory = String(parsed.category ?? "");
    const category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : "";

    return NextResponse.json({
      name: String(parsed.name ?? "").trim(),
      category,
      description: String(parsed.description ?? "").trim(),
      fabricCare: String(parsed.fabricCare ?? "").trim(),
      colors: Array.isArray(parsed.colors)
        ? (parsed.colors as unknown[]).map((c) => String(c)).filter(Boolean)
        : [],
      sizes: ["free size"],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("[AI] analyze-product error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}

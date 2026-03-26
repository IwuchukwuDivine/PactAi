// extract-terms
// Receives raw text or a screenshot URL, calls Claude with tool_choice forced,
// and returns structured agreement terms using service_provider/client naming.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const SYSTEM_PROMPT = `You are PactAI's agreement extraction engine.

Your job is to read informal digital agreements — WhatsApp chats, DMs, voice note transcripts, emails —
and extract the key terms into a structured format.

NIGERIAN PIDGIN INTERPRETATION GUIDE
You will frequently encounter Nigerian Pidgin English. Interpret these correctly:

Payment intent:
- "I go pay you", "I go send am" → future payment commitment
- "pay me first", "drop something" → upfront payment request
- "we go split am" → split payment agreement
- "half half" → 50/50 split

Delivery / status:
- "I don done am", "e don ready" → work is completed
- "e still dey" → still in progress
- "I go send by..." → delivery commitment with deadline

Scope creep triggers:
- "abeg add small thing", "just do one more" → potential scope expansion — flag as ambiguity
- "e no too much" → downplaying additional work — flag as ambiguity

Vague deadlines:
- "next week", "tomorrow", "soon", "sharp sharp" → flag as ambiguity, ask for specific date

CRITICAL RULES:
- Wrong extraction is worse than no extraction. When in doubt, flag as an ambiguity.
- Never invent terms not present in the conversation.
- service_provider = the party doing the work / delivering the service
- client = the party paying for the work
- If roles are ambiguous, flag it in ambiguities and make your best inference.
- Extract payment amounts exactly as stated. Do not convert currencies.
- If no explicit deadline exists, leave timeline.deadline null and flag it.`;

const ANALYZE_TOOL = {
  name: "analyze_agreement",
  description:
    "Extract structured agreement terms from an informal digital conversation. Call this once with all extracted data.",
  input_schema: {
    type: "object",
    required: [
      "service_provider",
      "client",
      "deliverables",
      "payment",
      "timeline",
      "ambiguities",
    ],
    properties: {
      service_provider: {
        type: "object",
        description: "The party doing the work or delivering the service",
        required: ["name"],
        properties: {
          name: { type: "string" },
          role: {
            type: "string",
            description: "e.g. 'Graphic designer', 'Video editor', 'Developer'",
          },
          contact: {
            type: "string",
            description: "Phone, email, or handle if mentioned",
          },
        },
      },
      client: {
        type: "object",
        description: "The party paying for the work",
        required: ["name"],
        properties: {
          name: { type: "string" },
          role: {
            type: "string",
            description: "e.g. 'Business owner', 'Brand', 'Individual'",
          },
          contact: {
            type: "string",
            description: "Phone, email, or handle if mentioned",
          },
        },
      },
      deliverables: {
        type: "object",
        required: ["items"],
        properties: {
          items: {
            type: "array",
            items: { type: "string" },
            description: "List of specific deliverables agreed upon",
          },
          revision_limit: {
            type: "number",
            description: "Number of revisions agreed. Null if not mentioned.",
          },
          exclusions: {
            type: "array",
            items: { type: "string" },
            description: "Things explicitly excluded from scope",
          },
        },
      },
      payment: {
        type: "object",
        required: ["amount", "currency"],
        properties: {
          amount: { type: "number" },
          currency: {
            type: "string",
            description: "e.g. 'NGN', 'USD'. Default to NGN if unclear.",
          },
          schedule: {
            type: "string",
            enum: ["upfront", "on_delivery", "milestone", "split"],
            description: "When/how payment is made",
          },
          milestone_split: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                amount: { type: "number" },
                trigger: { type: "string" },
              },
            },
            description: "Breakdown if milestone or split payment",
          },
        },
      },
      timeline: {
        type: "object",
        properties: {
          deadline: {
            type: "string",
            description:
              "ISO 8601 date if extractable. Null if vague or not mentioned.",
          },
          milestones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                due_date: { type: "string" },
              },
            },
          },
        },
      },
      default_clause: {
        type: "object",
        description:
          "What happens if either party defaults. Extract only if explicitly mentioned.",
        properties: {
          service_provider_default: {
            type: "string",
            description:
              "Consequence if service provider fails to deliver (e.g. refund terms)",
          },
          client_default: {
            type: "string",
            description:
              "Consequence if client fails to pay (e.g. work withheld)",
          },
        },
      },
      ambiguities: {
        type: "array",
        description:
          "Vague, missing, or conflicting terms that need clarification before contract generation",
        items: {
          type: "object",
          required: ["phrase", "reason", "clarification_question"],
          properties: {
            phrase: {
              type: "string",
              description: "The exact phrase or term that is unclear",
            },
            reason: {
              type: "string",
              description: "Why this is ambiguous",
            },
            clarification_question: {
              type: "string",
              description: "The question to ask the user to resolve this",
            },
          },
        },
      },
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const { text, image_url, image_urls, input_type } = await req.json();

    if (!text && !image_url && (!image_urls || image_urls.length === 0)) {
      return Response.json(
        { error: "Provide either text or image_url(s)" },
        { status: 400 }
      );
    }

    // Build message content — text paste or image screenshot(s)
    let userContent: unknown[] = [];

    if (input_type === "screenshot") {
      const urls = image_urls && image_urls.length ? image_urls : image_url ? [image_url] : [];
      for (const url of urls) {
        const imgResponse = await fetch(url);
        const imgBuffer = await imgResponse.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
        const mimeType = imgResponse.headers.get("content-type") ?? "image/png";

        userContent.push({
          type: "image",
          source: { type: "base64", media_type: mimeType, data: base64 },
        });
      }

      userContent.push({
        type: "text",
        text: "Extract the agreement terms from these chat screenshot(s).",
      });
    } else {
      userContent.push({
        type: "text",
        text: `Extract the agreement terms from this conversation:\n\n${text}`,
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6", // ✅ Updated from claude-sonnet-4-5
        max_tokens: 4096,           // ✅ Increased from 2048 — Sonnet 4.6 supports up to 16k output tokens
        system: SYSTEM_PROMPT,
        tools: [ANALYZE_TOOL],
        // Force Claude to always call analyze_agreement — no free-text fallback
        tool_choice: { type: "tool", name: "analyze_agreement" },
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", err);
      return Response.json({ error: "Claude API error", detail: err }, { status: 502 });
    }

    const result = await response.json();

    // Extract the tool_use block — guaranteed by tool_choice forcing
    const toolBlock = result.content.find(
      (b: { type: string }) => b.type === "tool_use"
    );

    if (!toolBlock) {
      return Response.json(
        { error: "Claude did not return structured output" },
        { status: 500 }
      );
    }

    return Response.json(
      { extracted_terms: toolBlock.input },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("extract-terms error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
});
// generate-contract
// Takes extracted terms from a contract row and generates professional contract HTML
// using Claude. Stores the result in contract_html and updates status to "negotiating".

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const SYSTEM_PROMPT = `You are PactAI's contract drafting engine. Your job is to take structured agreement terms and produce a professional, legally sound contract document in HTML format.

CRITICAL RULES:
1. The output must be ONLY the HTML content of the contract body — no <html>, <head>, or <body> tags. Start with the contract title and sections directly.
2. Use clean, semantic HTML: <h1> for the title, <h2> for section headers, <p> for paragraphs, <ul>/<ol> for lists, <strong> for emphasis.
3. Include proper legal language but keep it clear and readable — avoid excessive legalese.
4. The contract must include these sections (where applicable):
   - Title (e.g. "Service Agreement" or "Contract for [deliverable]")
   - Parties section (full names, roles)
   - Scope of Work / Deliverables
   - Payment Terms (amount, currency, schedule)
   - Timeline / Milestones (start date, deadline if any)
   - Revision Policy (if revision_limit specified)
   - Intellectual Property (standard: client owns deliverables upon full payment)
   - Confidentiality (standard mutual NDA clause)
   - Termination (standard: either party with written notice)
   - Default / Breach (use default_clause if provided, otherwise standard)
   - Dispute Resolution (standard: good faith negotiation, then arbitration)
   - General Provisions (amendments in writing, entire agreement, severability)
   - Signature Block (placeholders for both parties)
5. Format currency amounts with proper symbols (₦ for NGN, $ for USD, etc.)
6. Use the current date as the contract date.
7. If escrow is involved, include an Escrow section explaining the escrow terms.
8. Do NOT invent terms not present in the input. If something is missing, use reasonable standard clauses.
9. Style the HTML with inline styles for clean PDF rendering later:
   - font-family: 'Georgia', serif for body text
   - Clean margins and spacing
   - Professional, formal appearance
   - Section headers in a slightly larger, bold font
   - A horizontal rule before the signature block`;

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
    const {
      contract_id,
      title,
      reference,
      service_provider,
      client,
      deliverables,
      payment,
      timeline,
      default_clause,
      escrow_proposed,
    } = await req.json();

    if (!contract_id) {
      return Response.json(
        { error: "contract_id is required" },
        { status: 400 }
      );
    }

    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const termsJson = JSON.stringify(
      {
        title,
        reference,
        date: today,
        service_provider,
        client,
        deliverables,
        payment,
        timeline,
        default_clause,
        escrow_proposed,
      },
      null,
      2
    );

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Generate the contract HTML for the following terms:\n\n${termsJson}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", err);
      return Response.json(
        { error: "Claude API error", detail: err },
        { status: 502 }
      );
    }

    const result = await response.json();

    let contractHtml = "";
    try {
      contractHtml = result.content[0].text;
    } catch {
      return Response.json(
        { error: "Unexpected Claude response format" },
        { status: 500 }
      );
    }

    // Strip markdown code fences if Claude wrapped the HTML
    contractHtml = contractHtml
      .replace(/^```html?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    return Response.json(
      { contract_id, contract_html: contractHtml },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("generate-contract error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
});

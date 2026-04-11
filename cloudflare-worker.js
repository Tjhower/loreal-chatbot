// Copy this code into your Cloudflare Worker script- EDITED

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: corsHeaders,
      });
    }
    // Parse request body safely
    let userInput;
    try {
      userInput = await request.json();
    } catch (error) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    //Validate message array
    if (!userInput.messages || !Array.isArray(userInput.messages)) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid "messages" array' }),
        { status: 400, headers: corsHeaders },
      );
    }

    const apiKey = env.OPENAI_API_KEY; // Make sure to name your secret OPENAI_API_KEY in the Cloudflare Workers dashboard
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    const requestBody = {
      model: "gpt-4o",
      messages: userInput.messages,
      max_tokens: 300,
    };
    let apiResponse;
    // Call OpenAI safely
    try {
      apiResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Failed to connect to OpenAI API" }),
        { status: 500, headers: corsHeaders },
      );
    }
    // Debug: capture raw response for logging
    const rawText = await apiResponse.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Invalid response from OpenAI API",
          raw: rawText,
        }),
        { status: 500, headers: corsHeaders },
      );
    }
    // Handle OpenAI API errors explicitly
    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API error",
          details: data,
        }),
        { status: apiResponse.status, headers: corsHeaders },
      );
    }
    // Return successful response
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: corsHeaders,
    });
  },
};

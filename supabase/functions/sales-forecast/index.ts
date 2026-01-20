import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SalesData {
  itemName: string;
  soldAt: string;
  quantitySold: number;
}

interface ForecastRequest {
  salesData: SalesData[];
  daysToForecast: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { salesData, daysToForecast = 30 }: ForecastRequest = await req.json();

    if (!salesData || salesData.length === 0) {
      return new Response(
        JSON.stringify({ error: "No sales data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare sales summary for AI
    const salesSummary = salesData.reduce((acc: Record<string, { total: number; dates: string[] }>, sale) => {
      if (!acc[sale.itemName]) {
        acc[sale.itemName] = { total: 0, dates: [] };
      }
      acc[sale.itemName].total += sale.quantitySold;
      acc[sale.itemName].dates.push(sale.soldAt);
      return acc;
    }, {});

    const prompt = `Analyze the following sales data and provide a demand forecast for the next ${daysToForecast} days.

Sales History:
${Object.entries(salesSummary).map(([item, data]) => 
  `- ${item}: ${data.total} units sold across ${data.dates.length} transactions (dates: ${data.dates.slice(0, 5).join(', ')}${data.dates.length > 5 ? '...' : ''})`
).join('\n')}

Based on this data, predict the expected sales quantity for each item over the next ${daysToForecast} days.

Respond in this exact JSON format:
{
  "forecasts": [
    {
      "itemName": "Item Name",
      "predictedQuantity": 50,
      "confidence": 0.85,
      "trend": "increasing" | "decreasing" | "stable",
      "reasoning": "Brief explanation"
    }
  ],
  "overallInsight": "Brief overall market insight",
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a sales forecasting AI. Analyze historical sales data and provide accurate demand predictions. Always respond with valid JSON only."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0]?.message?.content;

    // Extract JSON from response
    let forecast;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        forecast = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      forecast = {
        forecasts: [],
        overallInsight: "Unable to generate forecast due to insufficient data.",
        recommendations: ["Add more sales data for better predictions."]
      };
    }

    return new Response(JSON.stringify(forecast), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Forecast error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

import { GoogleGenAI, Type } from "@google/genai";

export async function handler(event: any, context: any) {
  // Handle preflight CORS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { text, fileData, mimeType } = body;

    if (!text && !fileData) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Please provide either written logs text or an uploaded image of the notebook page.",
        }),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "GEMINI_API_KEY environment variable is missing or empty. Please set your Gemini API Key in your Netlify site settings → Environment Variables.",
          isConfigError: true,
        }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are a strict, professional Financial Auditor for a Water Refilling Station in the Philippines.
Your job is to act as a strict Financial Auditor. You will analyze written log files, hand-typed text, or uploaded photos of handwritten notebook pages, and organize them perfectly base on standard business rules.

BUSINESS RULES:
1. WATER METER RULES:
   - Identify the "Opening Reading" and "Closing Reading" (numbers with optional decimals, e.g., 14480.6).
   - "total_consumed_m3" is strictly Closing Reading minus Opening Reading.

2. PRICING & REVENUE RULES:
   - Standard water prices are STRICTLY ₱20 per gallon (Wholesale/Bulk) or ₱25 per gallon (Retail).
   - For every customer item, identify their quantity in gallons, how much they actually paid, and calculate if the math aligns with either the 20 or 25 rate.
   - ISOLATE MISCELLANEOUS FEES: If a customer paid more than the standard rate (e.g., they bought a physical container/bottle like "NEW Gallon" for ₱200, paid delivery fees, or temporary deposits), calculate the base water cost at the standard ₱20 or ₱25 rate, and allocate the rest of the extra money into "Miscellaneous Revenue".
     Example customer entry: "Juan: 5 gallons water + New Container bottle = ₱325".
     Base water cost: 5 gallons * ₱25 (Retail) = ₱125.
     Remaining amount: ₱325 - ₱125 = ₱200. This ₱200 goes to "miscellaneous_revenue".
     So name is "Juan", gallons is 5, total_paid is 325, inferred_rate_per_gallon is 25. The ₱200 represents miscellaneous revenue part of that transaction.

3. AUDIT RECONCILIATION & NOTES:
   - Spot mathematical discrepancies. If a customer paid too much or too little for water without extra items, write note details in 'audit_errors_or_notes'.
   - Meter and Sales reconciliation: Note that 1 m3 is equal to 1000 liters. 1 gallon is approximately 3.78541 liters. So 1 m3 corresponds to about 264.17 gallons of water.
     Check if the calculated 'total_consumed_m3' multiplied by 264.17 matches the 'total_gallons_sold' (normal refilling operations see about 5-15% overhead waste for bucket washing and flushing).
     If there is a severe mismatch (e.g., 5 m3 meter difference which is 1320 gallons, but only 20 gallons sold!), explicitly point out the massive water loss, leakage, or potential unlogged sales as a percentage of consumed water.
   - Summarize daily insights in notes. Return the results in the requested exact JSON structure.`;

    const contents: any[] = [];

    if (fileData && mimeType) {
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: fileData,
        },
      });
    }

    const logPrompt = text
      ? `Analyze the following refilling station daily log:\n\n${text}`
      : "Analyze the uploaded photograph of a handwritten refilling station notebook log.";
    contents.push({ text: logPrompt });

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        date: {
          type: Type.STRING,
          description: "The date of the daily logs in YYYY-MM-DD format.",
        },
        meter_reading: {
          type: Type.OBJECT,
          properties: {
            opening: { type: Type.NUMBER },
            closing: { type: Type.NUMBER },
            total_consumed_m3: { type: Type.NUMBER },
          },
          required: ["opening", "closing", "total_consumed_m3"],
        },
        financial_summary: {
          type: Type.OBJECT,
          properties: {
            total_gallons_sold: { type: Type.INTEGER },
            pure_water_sales: { type: Type.NUMBER },
            miscellaneous_revenue: { type: Type.NUMBER },
            grand_total_cash_expected: { type: Type.NUMBER },
          },
          required: ["total_gallons_sold", "pure_water_sales", "miscellaneous_revenue", "grand_total_cash_expected"],
        },
        customer_breakdown: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              gallons: { type: Type.INTEGER },
              total_paid: { type: Type.NUMBER },
              inferred_rate_per_gallon: { type: Type.INTEGER },
            },
            required: ["name", "gallons", "total_paid", "inferred_rate_per_gallon"],
          },
        },
        audit_errors_or_notes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ["date", "meter_reading", "financial_summary", "customer_breakdown", "audit_errors_or_notes"],
    };

    const gResponse = await ai.models.generateContent({
      model: "gemini-1.5-flash",  // Fixed: was "gemini-3.5-flash" which doesn't exist
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const resultText = gResponse.text;
    if (!resultText) {
      throw new Error("Empty response received from the Gemini analysis engine.");
    }

    const auditedData = JSON.parse(resultText.trim());

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(auditedData),
    };

  } catch (error: any) {
    console.error("Auditing Netlify function error:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: error.message || "An unexpected error occurred during the financial audit process.",
      }),
    };
  }
}

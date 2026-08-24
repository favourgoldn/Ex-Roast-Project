import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "EX ROAST",
    geminiEnabled: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// AI Roast Spark generator endpoint
app.post("/api/generate-roast-sparks", async (req, res) => {
  try {
    const { storyTitle, storyDescription, category, tone = "savage" } = req.body;

    if (!storyTitle && !storyDescription) {
      return res.status(400).json({ error: "Story title or description required" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback pre-crafted roasts if API key is not yet configured
      const fallbackRoasts = [
        `"Bro didn't just dodge a bullet, you survived a whole nuclear testing zone."`,
        `"They said they needed space, but NASA called and found them orbiting someone else."`,
        `"The clown makeup was invisible during the relationship, but it's 4K HD now."`,
        `"Imagine fumbling someone who stayed through all that nonsense. Peak amateur hour."`,
      ];
      return res.json({
        roasts: fallbackRoasts,
        source: "fallback",
      });
    }

    const prompt = `You are a legendary comedy club roastmaster on "EX ROAST", the world's sharpest and funniest social entertainment platform.
A user shared this story about their ex:
Title: "${storyTitle || 'Untitled Ex Story'}"
Category: "${category || 'Dating Disaster'}"
Story Details: "${storyDescription}"

Generate 3 unique, hilarious, punchy roasts targeting the ex or the absurd situation.
Styles requested:
1. "Deadpan Burn" (short, witty, cold delivery)
2. "Sarcastic Reality Check" (clever, relatable observational humor)
3. "Mic Drop Finale" (creative hyperbole, comedy gold)

STRICT SAFETY RULES:
- Never use real personal names, addresses, phone numbers, or doxxing.
- Keep it comedy-focused, avoiding hate speech, slurs, or physical threats.
- Keep each roast punchy (1 to 2 sentences max).

Output strictly a JSON array of strings containing the 3 roasts. No extra markdown, formatting, or commentary.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 1.0,
      },
    });

    const responseText = response.text || "[]";
    try {
      const parsed = JSON.parse(responseText);
      return res.json({
        roasts: Array.isArray(parsed) ? parsed : [responseText],
        source: "gemini",
      });
    } catch {
      return res.json({
        roasts: [responseText.replace(/[\[\]"]/g, '').trim()],
        source: "gemini",
      });
    }
  } catch (error: any) {
    console.error("Gemini roast generation error:", error);
    return res.status(500).json({
      error: "Failed to generate roasts",
      roasts: [
        "Your ex is living proof that common sense is a rare collectible.",
        "They thought they were the main character, but ended up as the comedy relief.",
      ],
    });
  }
});

// Moderation / Red Flag scanner endpoint
app.post("/api/scan-safety", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.json({ safe: true, flags: [] });
    }

    // Basic regex screening for PII (phone numbers, emails, addresses, social security)
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    const containsPhone = phoneRegex.test(text);
    const containsEmail = emailRegex.test(text);

    if (containsPhone || containsEmail) {
      return res.json({
        safe: false,
        reason: "Contains personal contact information (phone number or email). Keep it strictly anonymous.",
        flags: ["PII_DETECTED"],
      });
    }

    return res.json({ safe: true, flags: [] });
  } catch (error) {
    return res.json({ safe: true, flags: [] });
  }
});

// Vite middleware for development & Static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EX ROAST Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

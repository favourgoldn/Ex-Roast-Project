export interface RoastSparkResponse {
  roasts: string[];
  source: "gemini" | "fallback";
}

export interface SafetyScanResponse {
  safe: boolean;
  reason?: string;
  flags?: string[];
}

export async function generateRoastSparks(
  storyTitle: string,
  storyDescription: string,
  category?: string
): Promise<RoastSparkResponse> {
  try {
    const res = await fetch("/api/generate-roast-sparks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyTitle, storyDescription, category }),
    });

    if (!res.ok) {
      throw new Error("Server error");
    }

    const data = await res.json();
    return data;
  } catch (error) {
    // Client-side fallback roasts tailored to categories
    const smartFallbacks: Record<string, string[]> = {
      "Ghosting": [
        "NASA called. They found their inner peace was just ghosting and a new co-worker.",
        "They vanished so fast Houdini is taking notes.",
        "Grown adult acting like a supernatural apparition because communication is too scary.",
      ],
      "Money": [
        "Bro didn't take you out for dinner, he drafted you as a financial sponsor.",
        "Subtracting the bread basket from the bill is generational broke-boy gymnastics.",
        "His wallet has cobwebs and a 'Do Not Disturb' sign.",
      ],
      "Cheating": [
        "Imagine risking a diamond for a cheap scratch-off lottery ticket.",
        "They wanted options, but ended up as nobody's priority.",
        "Their loyalty is like free airport Wi-Fi: weak, unreliable, and disconnects every 15 minutes.",
      ],
      "Dumb Excuse": [
        "That excuse was made in Canva with a free template.",
        "Bro wasn't unready for a relationship, he was unready for high standards.",
        "Trauma cured in 48 hours? Drop the therapist's number for science.",
      ],
    };

    const list = smartFallbacks[category || ""] || [
      "Your ex is living proof that common sense is a rare collectible item.",
      "They thought they were the main character, but ended up as the comedy relief.",
      "The clown makeup was invisible during the relationship, but it's 4K HD now.",
    ];

    return {
      roasts: list,
      source: "fallback",
    };
  }
}

export async function scanContentSafety(text: string): Promise<SafetyScanResponse> {
  try {
    const res = await fetch("/api/scan-safety", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) return { safe: true };
    return await res.json();
  } catch {
    // Local regex fallback
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    if (phoneRegex.test(text) || emailRegex.test(text)) {
      return {
        safe: false,
        reason: "Contains personal contact information. Keep all stories anonymous.",
        flags: ["PII_DETECTED"],
      };
    }

    return { safe: true };
  }
}

export async function scanSafetyAndAnonymity(
  title: string,
  content: string
): Promise<{ isSafe: boolean; warningMessage?: string }> {
  const combined = `${title}\n${content}`;
  const result = await scanContentSafety(combined);
  return {
    isSafe: result.safe,
    warningMessage: result.reason,
  };
}

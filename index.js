import dotenv from "dotenv";

dotenv.config();

import { GoogleGenAI } from "@google/genai";
import express from "express";
import path from "path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, "static")));
app.use(express.json());
// Without middleware
app.get("/", function (req, res) {
  res.sendFile(
    "static/index.html",
    { root: path.join(__dirname) },
    function (err) {
      if (err) {
        console.error("Error sending file:", err);
      } else {
        console.log("Sent:", "index.html");
      }
    },
  );
});

app.get("/ns", function (req, res) {
  res.sendFile(
    "static/games/neuralStories.html",
    { root: path.join(__dirname) },
    function (err) {
      if (err) {
        console.error("Error sending file:", err);
      } else {
        console.log("Sent:", "neuralStories.html");
      }
    },
  );
});

app.post("/nsData", async (req, res) => {
  try {
    const { statement, apiKey } = req.body;
    let keyToUse;
    if (apiKey && apiKey.trim() !== "") {
      keyToUse = apiKey.trim(); // User-provided key only
    } else {
      keyToUse = process.env.GEMINI_API_KEY; // Only if user left it blank
    }

    if (!keyToUse) {
      return res.status(400).json({ error: "No API key provided." });
    }

    console.log(`API key:${apiKey}\nKey actually used: ${keyToUse}`);
    const aiInstance = new GoogleGenAI({ key: keyToUse });

    // Test key validity BEFORE generating
    try {
      await aiInstance.models.list(); // Light API call to verify key
    } catch (err) {
      if (
        err.message?.toLowerCase().includes("unauthorized") ||
        err.message?.toLowerCase().includes("invalid")
      ) {
        return res.status(401).json({ error: "Invalid API key." });
      }
      throw err; // Not an auth error, rethrow
    }

    // Proceed with story generation
    const generation = await aiInstance.models.generateContent({
      model: "gemini-2.5-flash",
      contents: statement,
      config: { thinkingConfig: { thinkingBudget: 0 } },
    });

    if (
      !generation ||
      typeof generation.text !== "string" ||
      generation.text.trim() === ""
    ) {
      throw new Error("AI returned no text.");
    }

    res.json({ text: generation.text });
  } catch (err) {
    console.error("Error in /nsData:", err);
    res.status(500).json({
      error: "Server error while generating story.",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

app.listen(PORT, function (err) {
  if (err) console.error(err);
  console.log("Server listening on PORT", PORT);
});

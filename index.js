import dotenv from "dotenv";

dotenv.config();

import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ key: process.env.GEMINI_API_KEY });
import express from "express";
import path from "path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;
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
  const { statement } = req.body;
  try {
    const generation = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: statement,
      // Optional: config to encourage creativity
      config: { thinkingConfig: { thinkingBudget: 0 } },
    });
    res.json({ text: generation.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

app.listen(PORT, function (err) {
  if (err) console.error(err);
  console.log("Server listening on PORT", PORT);
});

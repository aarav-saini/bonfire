import dotenv from "dotenv";

dotenv.config();

import { GoogleGenAI } from "@google/genai";
import express from "express";
import path from "path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import axios from "axios"; // For Node.js, npm install axios
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const GITHUB_OWNER = process.env.GITHUB_OWNER;

const GITHUB_REPO = process.env.GITHUB_REPO;

const GITHUB_BRANCH = process.env.GITHUB_BRANCH;
const webhookUrl = process.env.WEBHOOK_URL;

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

async function getLatestCommit() {
  const base = "https://api.github.com";
  const headers = {
    Accept: "application/vnd.github+json",
    ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // If a branch is provided, get that ref directly; else list commits on default branch (per_page=1)
  if (GITHUB_BRANCH) {
    const url = `${base}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits/${encodeURIComponent(GITHUB_BRANCH)}`;
    const { data } = await axios.get(url, { headers }); // returns a single commit object
    return {
      sha: data.sha,
      message: data.commit?.message || "",
      author: data.commit?.author?.name || data.author?.login || "unknown",
      htmlUrl: data.html_url,
    };
  } else {
    const url = `${base}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?per_page=1`;
    const { data } = await axios.get(url, { headers }); // returns an array
    const c = Array.isArray(data) ? data[0] : data;
    return {
      sha: c.sha,
      message: c.commit?.message || "",
      author: c.commit?.author?.name || c.author?.login || "unknown",
      htmlUrl: c.html_url,
    };
  }
}

// Your existing server listen with webhook post
app.listen(PORT, async function (err) {
  if (err) {
    console.error(err);
    return;
  }

  console.log("Server listening on PORT", PORT);

  let commitText = "";
  try {
    const latest = await getLatestCommit();
    const shortSha = latest.sha?.slice(0, 7);
    commitText = `\n\n> Commit: ${shortSha} — ${latest.message.split("\n")[0]} by ${latest.author}`;
  } catch (e) {
    console.warn(
      "Could not fetch latest commit:",
      e?.response?.status || e.message,
    );
  }

  await axios.post(webhookUrl, {
    content: `🚨 Deployment successful!\n> Port: ${PORT}${commitText}`,
  });
});

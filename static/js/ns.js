const button = document.getElementById("generate");
const input = document.getElementById("storyInput");
const apiKeyInput = document.querySelector('input[type="password"]');

async function sendToAI(statement, prompt, apiKey) {
  let realPrompt;
  if (!prompt) {
    realPrompt = `You are an AI which has the objective to create a story out of the given statement. Inspire your story from the players of gartic phone, For example, In gartic phone, the story eventually veers offcourse. Make it, like, no punctuation at all, and make it like a human is talking. Use short forms, but don't capitalize them. Keep in mind, only output 1 line at a time. Do not be afraid to use the statement to the fullest extent, just make sure it ends up with an absolutely absurd story. The starting statement was: \n"${input.value}".\nThe current statement is: \n"${statement}".\n Do NOT repeat anything of this statement, only continue forward from this. Build on what you have, and follow all the instructions carefully.`;
  } else {
    realPrompt = prompt;
  }

  try {
    const response = await fetch("/nsData", {
      method: "POST",
      body: JSON.stringify({ statement: realPrompt, apiKey }),
      headers: { "Content-type": "application/json; charset=UTF-8" },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unknown server error");
    }

    return data;
  } catch (error) {
    return { error: error.message };
  }
}

function createContinueButton(container, prevText) {
  const contBtn = document.createElement("button");
  contBtn.textContent = "Continue";

  contBtn.addEventListener("click", async () => {
    contBtn.remove();

    const { text: nextText, error } = await sendToAI(
      prevText,
      null,
      apiKeyInput.value.trim(),
    );

    if (error) {
      const errMsg = document.createElement("div");
      errMsg.className = "story-error";
      errMsg.textContent = `Error: ${error}`;
      container.appendChild(errMsg);
      return;
    }

    const nextMsg = document.createElement("div");
    nextMsg.className = "story-message";
    nextMsg.textContent = nextText;
    container.appendChild(nextMsg);

    createContinueButton(container, nextText);
  });

  container.appendChild(contBtn);
}

button.addEventListener("click", async function () {
  const promptText = input.value;
  const userApiKey = apiKeyInput.value.trim();

  const initialPrefix = `You are an AI which has the objective to create a story out of the given statement. Inspire your story from the players of gartic phone, For example, In gartic phone, the story eventually veers offcourse. Make it, like, no punctuation at all, and make it like a human is talking. Use short forms, but don't capitalize them. Keep in mind, only output 1 line at a time. Do not be afraid to use the statement to the fullest extent, just make sure it ends up with an absolutely absurd story. The starting statement is: ${promptText}\n Do NOT repeat anything of this statement, only continue forward from this. Build on what you have, and follow all the instructions carefully.`;

  input.remove();
  button.remove();

  const container = document.getElementById("story");
  const loader = document.createElement("p");
  loader.textContent = "Thinking...";
  container.appendChild(loader);

  const { text, error } = await sendToAI(promptText, initialPrefix, userApiKey);
  loader.remove();

  if (error) {
    const errMsg = document.createElement("div");
    errMsg.className = "story-error";
    errMsg.textContent = `Error: ${error}`;
    container.appendChild(errMsg);
    return;
  }

  const msg = document.createElement("div");
  msg.className = "story-message";
  msg.textContent = text;
  container.appendChild(msg);

  createContinueButton(container, text);
});

document.getElementById("storySection").style.marginTop =
  `${document.getElementById("title").offsetHeight}px`;
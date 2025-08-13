const button = document.getElementById("generate");
const input = document.getElementById("storyInput");

const startingStatement = input.value;

async function sendToAI(statement, prompt) {
  let realPrompt;
  if (!prompt) {
    realPrompt = `You are an AI which has the objective to create a story out of the given statement. Inspire your story from the players of gartic phone, For example, In gartic phone, the story eventually veers offcourse. Make it, like, no punctuation at all, and make it like a human is talking. Use short forms, but don't capitalize them. Keep in mind, only output 1 line at a time. Do not be afraid to use the statement to the fullest extent, just make sure it ends up with an absolutely absurd story. The starting statement was: \n"${startingStatement}".\nThe current statement is: \n"${statement}".\n Do NOT repeat anything of this statement, only continue forward from this. Build on what you have, and follow all the instructions carefully.`;
  } else {
    realPrompt = prompt;
  }
  return fetch("/nsData", {
    method: "POST",
    body: JSON.stringify({ statement: realPrompt }),
    headers: { "Content-type": "application/json; charset=UTF-8" },
  }).then((response) => response.json());
}

// ---- Function for continuing story ----
function createContinueButton(container, prevText) {
  const contBtn = document.createElement("button");
  contBtn.textContent = "Continue";
  contBtn.addEventListener("click", async () => {
    contBtn.remove();

    const { text: nextText } = await sendToAI(prevText);
    const nextMsg = document.createElement("div");
    nextMsg.className = "story-message";
    nextMsg.textContent = nextText;
    container.appendChild(nextMsg);

    // Add another continue button for the new text
    createContinueButton(container, nextText);
  });

  container.appendChild(contBtn);
}

button.addEventListener("click", async function () {
  const promptText = input.value;
  const initialPrefix = `You are an AI which has the objective to create a story out of the given statement. Inspire your story from the players of gartic phone, For example, In gartic phone, the story eventually veers offcourse. Make it, like, no punctuation at all, and make it like a human is talking. Use short forms, but don't capitalize them. Keep in mind, only output 1 line at a time. Do not be afraid to use the statement to the fullest extent, just make sure it ends up with an absolutely absurd story. The starting statement is: ${promptText}\n Do NOT repeat anything of this statement, only continue forward from this. Build on what you have, and follow all the instructions carefully.`;

  input.remove();
  document.getElementById("generate").remove();

  const container = document.getElementById("story");
  const loader = document.createElement("p");
  loader.textContent = "Thinking...";
  container.appendChild(loader);

  const { text } = await sendToAI(promptText, initialPrefix);
  loader.remove();

  const msg = document.createElement("div");
  msg.className = "story-message";
  msg.textContent = text;
  container.appendChild(msg);

  // First continue button
  createContinueButton(container, text);
});

/* DOM elements */
const workerUrl = "https://openai-api-key.tjhower2004.workers.dev/";
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

/* Store conversation */
let messages = [
  {
    role: "system",
    content: `
You are a helpful beauty assistant focused ONLY on L’Oréal products, including makeup, skincare, haircare, and fragrance.

Your responsibilities:
- Recommend L’Oréal products
- Suggest personalized beauty routines
- Explain ingredients and product benefits
- Help users choose products based on their needs

STRICT RULES:
- If a question is NOT related to beauty, skincare, makeup, haircare, fragrance, or L’Oréal products, politely refuse.
- Say something like: "I'm here to help with L’Oréal beauty products and routines. Let me know how I can assist with that!"
- Keep responses friendly, concise, and helpful.
`,
  },
];

/* Helper: Add message to UI */
function addMessage(content, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);

  messageDiv.textContent = content;
  chatWindow.appendChild(messageDiv);

  // Auto scroll
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Set initial message
addMessage("👋 Hello! Ask me about L’Oréal products or routines!", "bot");

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userText = userInput.value.trim();
  if (!userText) return;
  // Show user message
  addMessage(userText, "user");

  // Add to conversation
  messages.push({
    role: "user",
    content: userText,
  });

  // Clear input
  userInput.value = "";

  //Show loading message
  const loadingMsg = document.createElement("div");
  loadingMsg.classList.add("message", "bot");
  loadingMsg.textContent = "Typing...";
  chatWindow.appendChild(loadingMsg);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // When using Cloudflare, you'll need to POST a `messages` array in the body,
  // and handle the response using: data.choices[0].message.content
  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Content type to JSON
      },
      body: JSON.stringify({
        messages: messages,
      }),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      console.error("Raw response:", text);
      throw new Error("Invalid JSON from server");
    }
    // Remove loading message
    chatWindow.removeChild(loadingMsg);

    if (!data.choices || !data.choices[0]) {
      console.error("Bad response:", data);
      throw new Error("Invalid API structure");
    }

    const botReply = data.choices[0].message.content;
    // Show bot reply
    addMessage(botReply, "bot");
    // Save assistant reply
    messages.push({
      role: "assistant",
      content: botReply,
    });
  } catch (error) {
    chatWindow.removeChild(loadingMsg);

    addMessage("⚠️ Sorry, something went wrong. Please try again.", "bot");
    console.error(error);
  }
});

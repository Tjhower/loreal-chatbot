/* DOM ELEMENTS */

const workerUrl = "https://openai-api-key.tjhower2004.workers.dev/";
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

/* CONVERSATION STATE */

let messages = [
  {
    role: "system",
    content: `
You are a helpful beauty assistant focused ONLY on L’Oréal products.

Maintain context of previous messages and build naturally.

STRICT RULES:
- Only answer beauty-related questions
- Keep responses concise and helpful
`,
  },
];

/* limit context size */
const MAX_MESSAGES = 12;

/* UI HELPERS */

function addMessage(content, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);
  messageDiv.textContent = content;
}

function addMessage(content, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);

  messageDiv.textContent = content;

  // start hidden
  messageDiv.style.opacity = "0";

  chatWindow.appendChild(messageDiv);

  // trigger animation
  messageDiv.offsetHeight;
  messageDiv.style.opacity = "";
  messageDiv.classList.add("animate");

  // scroll to bottom after append
  scrollToBottom(true);
  function scrollToBottom(force = false) {
    const threshold = 120;

    const isNearBottom =
      chatWindow.scrollHeight - chatWindow.scrollTop <=
      chatWindow.clientHeight + threshold;

    if (force || isNearBottom) {
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  }
}

/* typing dots */
function createTypingIndicator() {
  const div = document.createElement("div");
  div.classList.add("message", "bot");

  div.innerHTML = `
    <div class="typing">
      <span></span><span></span><span></span>
    </div>
  `;

  return div;
}

/* typewriter effect */
function typeWriter(element, text, speed = 18) {
  let i = 0;
  element.textContent = "";

  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;

      //scroll during typing
      scrollToBottom();

      setTimeout(type, speed);
    }
  }

  type();
}

/* scroll effect */

window.addEventListener("scroll", () => {
  const scrollY = window.scrollY;
  const max = 300;
  const opacity = Math.min(scrollY / max, 1);

  document.body.style.setProperty("--scroll-dark", opacity);
});

/* INITIAL MESSAGE */

addMessage("👋 Hello! Ask me about L’Oréal products or routines!", "bot");

/* FORM SUBMIT HANDLER */

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userText = userInput.value.trim();
  if (!userText) return;

  /* show user message */
  addMessage(userText, "user");

  /* store message */
  messages.push({
    role: "user",
    content: userText,
  });

  /* trim history */
  if (messages.length > MAX_MESSAGES) {
    messages = [messages[0], ...messages.slice(-MAX_MESSAGES)];
  }

  userInput.value = "";

  /* typing indicator */
  const loadingMsg = createTypingIndicator();
  chatWindow.appendChild(loadingMsg);
  scrollToBottom(true);

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
      }),
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Raw response:", text);
      throw new Error("Invalid JSON");
    }

    chatWindow.removeChild(loadingMsg);

    if (!data.choices || !data.choices[0]) {
      console.error("Bad response:", data);
      throw new Error("Invalid API structure");
    }

    const botReply = data.choices[0].message.content;

    /* create bot message container */
    const botDiv = document.createElement("div");
    botDiv.classList.add("message", "bot");

    chatWindow.appendChild(botDiv);

    /* animate in */
    botDiv.style.opacity = "0";
    botDiv.offsetHeight;
    botDiv.style.opacity = "";
    botDiv.classList.add("animate");

    scrollToBottom(true);

    /* typewriter */
    typeWriter(botDiv, botReply);

    /* store reply */
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

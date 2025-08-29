
# BrowseMe - AI-Powered Browser Automation Agent

**BrowseMe** is a sophisticated, AI-driven agent designed to autonomously navigate and interact with the web. Powered by large language models and the robust Playwright browser automation framework, it can understand complex user commands, analyze web pages, and execute tasks with human-like precision.

---

## ✨ Features

- **Intelligent Web Navigation**: The agent can open and navigate to any URL, automatically waiting for pages to become stable and interactive before proceeding.  
- **Advanced Element Interaction**: Instead of relying on brittle selectors, the agent intelligently finds elements by their text, role (button, link), or purpose, making it resilient to minor UI changes.  
- **Human-Like Typing**: Uses key-press simulation for filling out forms, ensuring compatibility with modern web applications that rely on JavaScript events.  
- **Deep Page Analysis**: The agent can read a simplified DOM structure or the full page HTML to understand the layout and find the elements it needs to interact with.  
- **Visual Understanding**: With the ability to take screenshots, the agent can be extended for visual analysis tasks, helping it to "see" the page and make more informed decisions.  
- **LLM-Powered Reasoning**: At its core, BrowseMe is driven by a language model that follows a strategic workflow to *sense, plan, and act*, allowing it to handle complex, multi-step tasks.  
- **Extensible Toolset**: The agent's capabilities are defined by a modular set of tools, which can be easily expanded or modified.  

---

## ⚙️ Core Workflow: Sense → Plan → Act

- **Sense**: The agent begins by analyzing the current state of the web page. It uses tools like `GET_DOM_ELEMENTS` or `Get_Page_HTML` to understand the content and identify all interactive components.  
- **Plan**: Based on this analysis and the user's goal, the LLM creates a precise, multi-step plan. For example, to fill a form, it will first read the HTML to identify all input fields and their corresponding labels.  
- **Act**: The agent executes its plan with precision using its action tools, such as `Click_Element` and `Fill_Input`, to interact with the page and move closer to completing the task.  

---

## 🛠 Tech Stack & Requirements

- Node.js (v18+ recommended)  
- [Playwright](https://playwright.dev/) – robust, cross-browser automation  
- [@openai/agents](https://www.npmjs.com/package/@openai/agents) – core SDK for building the agent's logic  
- [Zod](https://zod.dev/) – schema validation for tool parameters  
- An OpenAI-Compatible LLM (e.g., OpenAI, Groq, OpenRouter)  

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Node.js installed on your system.

### 2. Installation

```bash
# Clone the project
git clone <your-repository-url>
cd BrowseMe

# Install dependencies
npm install

# Install Playwright's browser binaries
npx playwright install
```

### 3. Environment Configuration

Create a `.env` file in the root of the project:

```env
# Your API key from your chosen LLM provider
GOOGLE_GENERATIVE_AI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"

# The model you want the agent to use (e.g., gpt-4, gemma-7b, etc.)
MODEL="gemini-2.0-flash"
```

### 4. Running the Agent

```bash
node index.js
```

You will be greeted with a banner. Simply type your task at the prompt and press **Enter**.

**Example Task:**

```
TASK > go to ui.chaicode.com, find the sign up form, and fill it out with dummy data
```

The agent will then launch a browser window and begin executing the task, printing its progress to the console.

---

## 📁 Project Structure

* `index.js` – Main entry point of the application; initializes the agent, sets up the CLI, and manages the execution loop.
* `createBrowserTools.js` – Defines all the agent's capabilities (tools) for interacting with the browser.
* `systemPrompt.js` – Contains core instructions and strategic framework for guiding the LLM's reasoning and decision-making.



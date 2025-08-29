/**
 * Functional AI Agent for Browser Automation using the @openai/agents SDK with Gemini
 *
 * This script creates a dynamic, interactive browser automation agent. It uses a
 * CLI to accept user commands, controls a Playwright browser, and is powered by
 * Google's Gemini model.
 *
 * Major Features:
 * - Interactive Command-Line Interface (CLI) for continuous task input.
 * - An expanded and more efficient toolset including screenshots, scrolling, and coordinate-based clicks.
 * - Enhanced UI with colored text and a startup banner.
 *
 * To Run This Code:
 * 1. Make sure you have Node.js (v18+) installed.
 * 2. Save this file as `agent.js` and in your `package.json`, add `"type": "module"`.
 * 3. In your terminal, install the required libraries:
 * npm install playwright @openai/agents @openai/agents-extensions @ai-sdk/google zod@3 dotenv kleur
 * 4. Run the Playwright installer to get the browser binaries:
 * npx playwright install
 * 5. Create a `.env` file in the same directory and add your Gemini API key:
 * GOOGLE_GENERATIVE_AI_API_KEY="your_api_key_here"
 * 6. Run the script from your terminal:
 * node agent.js
 */
import 'dotenv/config';

import { chromium } from 'playwright';
import { Agent, run, tool, setTracingDisabled } from '@openai/agents';
import { aisdk } from '@openai/agents-extensions';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import readline from 'readline';
import kleur from 'kleur';
import createBrowserTools from './createBrowserTools.js';
// --- System Configuration ---

// Disable OpenAI tracing to prevent the SDK from looking for an OPENAI_API_KEY.
setTracingDisabled(true);

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error(kleur.red("GOOGLE_GENERATIVE_AI_API_KEY not found in .env file. Please add it to proceed."));
    process.exit(1);
}

const SYSTEM_PROMPT = `You are a sophisticated AI agent designed to autonomously operate a web browser. Your primary directive is to achieve the user's goal by intelligently interacting with web pages.

### Core Strategy: Sense -> Plan -> Act

You must follow this workflow for every step to ensure accuracy:

**1. Sense:** Always begin by understanding the current state of the page. Your primary tools for this are \`getPageElements\` and \`findElementsByText\`. Use them to get a structured list of all interactive elements, their labels, and their exact coordinates. Use \`takeScreenshot\` only when you need additional visual context to resolve ambiguity.

**2. Plan:** Analyze the data from the "Sense" step to create a precise plan. Identify the specific element required for the current task based on its text or role. From that element's data, determine the exact coordinates needed for your action.

**3. Act:** Execute your plan with precision.
   - **All clicks must be performed using the \`clickAtCoordinates\` tool.** Do not guess; use the coordinates you identified in the "Plan" step.
   - For text entry, use \`fillField\` for specific form inputs or \`typeText\` for more general typing.

### Guiding Principles

- **Think Step-by-Step:** Deconstruct complex user requests into a logical sequence of tool calls. Verbalize your reasoning for each step.
- **Precision Over Speed:** Always prefer a methodical Sense -> Plan -> Act cycle over making assumptions. If you are uncertain, use a sense tool again to re-evaluate the page.
- **Self-Correction:** If an action does not produce the expected result, do not repeat it blindly. Re-run the "Sense" step to understand what has changed and formulate a new plan.
`;

// Wrap Google Gemini with aisdk
const model = aisdk(google('gemini-2.0-flash'));



// const openrouter = createOpenRouter({
//   apiKey: process.env.OPENROUTER_API_KEY,
//   baseUrl: "https://openrouter.ai/api/v1",
// });
// const model = aisdk(openrouter.chat("deepseek/deepseek-chat-v3-0324:free"));

// --- Tool Definitions ---
// An expanded set of tools for more efficient and precise browser control.



// --- Agent Execution Logic ---

const runAgentTask = async (message) => {
    let browser = null;
    try {
        browser = await chromium.launch({ headless: false });
        const page = await browser.newPage();
        const browserTools = createBrowserTools(page);

        const agent = new Agent({
            name: 'BrowseMe Agent',
            instructions: SYSTEM_PROMPT,
            tools: browserTools,
            model,
        });

        console.log(kleur.yellow(`\n🚀 Executing Task: "${message}"`));

        const result = await run(agent, message);

        console.log(kleur.green("\n--- ✅ Agent Execution Finished ---"));
        console.log(kleur.bold("Final Output:"), result.final_output);
        console.log(kleur.green("----------------------------------\n"));

        console.log("Task completed. Browser will close in 3 seconds.");
        await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
        console.error(kleur.red("\nAn error occurred during the agent execution:"), error);
    } finally {
        if (browser) {
            await browser.close();
            console.log(kleur.gray("Browser closed."));
        }
    }
};

// --- CLI and Main Application Logic ---

const printBanner = () => {
    const banner = `
░B░r░o░w░s░e░M░e░                                                                  
`;

    console.log(kleur.magenta(banner));
    console.log(kleur.bold().inverse(' Welcome to the BrowseMe AI Agent! '));
    console.log(kleur.gray("Describe the web task you want to automate. Type 'exit' to quit.\n"));
};

const main = () => {
    printBanner();

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: kleur.bold().blue('TASK > ')
    });

    rl.prompt();

    rl.on('line', async (line) => {
        const task = line.trim();
        if (task.toLowerCase() === 'exit') {
            console.log(kleur.yellow('Goodbye! 👋'));
            rl.close();
            process.exit(0);
        }

        if (task) {
            await runAgentTask(task);
        }

        rl.prompt();
    }).on('close', () => {
        process.exit(0);
    });
};

main();
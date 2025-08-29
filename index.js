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
import SYSTEM_PROMPT from './SYSTEM_PROMPT.js';
// --- System Configuration ---

// Disable OpenAI tracing to prevent the SDK from looking for an OPENAI_API_KEY.
setTracingDisabled(true);

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error(kleur.red("GOOGLE_GENERATIVE_AI_API_KEY not found in .env file. Please add it to proceed."));
    process.exit(1);
}


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

        const result = await run(agent, message, { maxTurns: 25 });

        console.log(kleur.green("\n--- ✅ Agent Execution Finished ---"));
        console.log(kleur.bold("Final Output:"), result.finalOutput);
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
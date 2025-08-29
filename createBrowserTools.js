import { tool } from "@openai/agents";
import { z } from "zod";
import fs from "fs";
import path from "path";

/**
 * Creates a suite of browser automation tools that operate on a given Playwright page object.
 * @param {import('playwright').Page} page The Playwright page instance to control.
 * @returns {Array} An array containing all the browser automation tools.
 */
const createBrowserTools = (page) => {
    // Ensure screenshots folder exists for the takeScreenshot tool
    const screenshotsDir = path.join(process.cwd(), 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir);
    }
    const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

    return [
        tool({
            name: "Open_web_page",
            description: "Open browser for a given URL. Should be the first step.",
            parameters: z.object({ url: z.string().url() }),
            async execute({ url }) {
                console.log(`Navigating to page: ${url}`);
                // Use a more robust waiting strategy for modern web applications
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
                await page.waitForLoadState('networkidle', { timeout: 30000 });
                return `Successfully opened web page: ${url}`;
            },
        }),

        tool({
            name: "GET_DOM_ELEMENTS",
            description: "Gets a simplified list of interactive elements from the current page DOM.",
            parameters: z.object({}),
            async execute() {
                console.log("Getting DOM elements...");
                const elements = await page.evaluate(() => {
                    const interactiveElements = [];
                    document
                        .querySelectorAll("a, button, input[type=submit], input[type=button], [role='button'], [role='link']")
                        .forEach((el) => {
                            // Filter out non-visible elements
                            if (el.offsetWidth > 0 && el.offsetHeight > 0) {
                                interactiveElements.push({
                                    text: el.innerText || el.value || el.getAttribute('aria-label') || "",
                                    selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ""),
                                });
                            }
                        });
                    return interactiveElements;
                });
                return elements;
            },
        }),

        tool({
            name: "Click_Element",
            description: "Intelligently clicks on an element. It first tries to find the element by its visible text or role, then falls back to a CSS selector.",
            parameters: z.object({ target: z.string().describe("The text of the element or its CSS selector.") }),
            async execute({ target }) {
                try {
                    // Try to find by role (button)
                    let locator = page.getByRole("button", { name: new RegExp(target, "i") });
                    if (await locator.count() > 0) {
                        await locator.first().click();
                        console.log(`Clicked button with text: ${target}`);
                        return `Successfully clicked button with text: ${target}`;
                    }

                    // Try to find by role (link)
                    locator = page.getByRole("link", { name: new RegExp(target, "i") });
                    if (await locator.count() > 0) {
                        await locator.first().click();
                        console.log(`Clicked link with text: ${target}`);
                        return `Successfully clicked link with text: ${target}`;
                    }

                    // Fallback to general text
                    locator = page.getByText(new RegExp(`^${target}$`, "i"));
                    if (await locator.count() > 0) {
                        await locator.first().click();
                        console.log(`Clicked element with text: ${target}`);
                        return `Successfully clicked element with text: ${target}`;
                    }

                    // Fallback to CSS selector
                    locator = page.locator(target);
                    if (await locator.count() > 0) {
                        await locator.first().click();
                        console.log(`Clicked CSS selector: ${target}`);
                        return `Successfully clicked CSS selector: ${target}`;
                    }

                    console.log(`No element found for: ${target}`);
                    return `Error: No element found for target "${target}".`;
                } catch (err) {
                    console.log(`Failed to click ${target}`, err);
                    return `Error: Failed to click "${target}". Details: ${err.message}`;
                }
            },
        }),

        tool({
            name: "Fill_Input",
            description: "Types text into an input field using its CSS selector by simulating key presses.",
            parameters: z.object({
                selector: z.string().describe("The CSS selector of the input field."),
                value: z.string().describe("The text to type into the field."),
            }),
            async execute({ selector, value }) {
                try {
                    console.log(`Typing '${value}' into '${selector}' manually...`);
                    // Use pressSequentially for a more human-like typing simulation
                    await page.locator(selector).pressSequentially(value, { delay: 50 });
                    return `Successfully typed '${value}' into '${selector}'.`;
                } catch (err) {
                    console.log(`Failed to fill input ${selector}: ${err}`);
                    return `Error: Failed to fill input "${selector}". Details: ${err.message}`;
                }
            },
        }),

        tool({
            name: "Take_Screenshot",
            description: "Takes a screenshot of the current page viewport and saves it to a file.",
            parameters: z.object({
                filename: z.string().nullable().optional().describe("An optional filename for the screenshot. Defaults to a timestamped name."),
            }),
            async execute({ filename }) {
                try {
                    const finalFilename = filename || `screenshot-${timestamp()}.png`;
                    const filePath = path.join(screenshotsDir, finalFilename);
                    await page.screenshot({ path: filePath });
                    console.log(`Screenshot saved to ${filePath}`);
                    return `Successfully saved screenshot to ${filePath}`;
                } catch (err) {
                    console.log(`Failed to take screenshot: ${err}`);
                    return `Error: Failed to take screenshot. Details: ${err.message}`;
                }
            },
        }),
        tool({
            name: "Task_Complete",
            description: "Call this tool when the user's task has been successfully completed.",
            parameters: z.object({
                summary: z.string().describe("A brief summary of what was accomplished."),
            }),
            async execute({ summary }) {
                console.log(`Task Complete: ${summary}`);
                return `Task successfully marked as complete.`;
            },
        }),
        tool({
            name: "Get_Page_HTML",
            description: "Gets the full HTML content of the current page. Useful for understanding the structure of forms and elements.",
            parameters: z.object({}),
            async execute() {
                try {
                    console.log('Fetching page HTML...');
                    const html = await page.content();
                    // Truncate if the HTML is too long to avoid overwhelming the model
                    return html.length > 20000 ? html.slice(0, 20000) + '... [HTML Truncated]' : html;
                } catch (err) {
                    console.log(`Failed to get page HTML: ${err}`);
                    return `Error: Failed to get page HTML. Details: ${err.message}`;
                }
            },
        }),
    ];
};

export default createBrowserTools;


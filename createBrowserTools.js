import fs from 'fs';
import path from 'path';
import kleur from 'kleur';
import { tool } from '@openai/agents';
import { z } from 'zod';

const createBrowserTools = (page) => {
    // Ensure screenshots folder exists
    const screenshotsDir = path.join(process.cwd(), 'screenshots');
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);

    const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

    return [
        // Navigate to page
        tool({
            name: 'goToPage',
            description: 'Navigates the browser to a specified URL.',
            parameters: z.object({ url: z.string().url() }),
            execute: async ({ url }) => {
                try {
                    console.log(kleur.cyan(`Navigating to ${url}...`));
                    await page.goto(url);

                    // This makes the tool adaptable to the current login state.
                    console.log(kleur.yellow('Waiting for login page or main timeline...'));

                  
                    return `Successfully navigated to ${url} and the page is ready.`;
                } catch (error) {
                    console.error(error);
                    return `Failed to navigate or find the essential page elements. Details: ${error.message}`;
                }
            },
        }),

        // Take Screenshot (Corrected Version)
        tool({
            name: 'takeScreenshot',
            description: 'Takes a screenshot of the current viewport and saves it in the screenshots folder.',
            parameters: z.object({
                filename: z.string().nullable().optional().describe("The desired filename without extension. Defaults to a timestamp.")
            }),
            execute: async ({ filename }) => {
                try {
                    // Use provided filename or generate a new one
                    let baseFilename = filename ? filename : `screenshot-${timestamp()}`;

                    // FIX: Ensure the filename always has a .png extension
                    if (path.extname(baseFilename) === '') {
                        baseFilename += '.png';
                    }

                    const filePath = path.join(screenshotsDir, baseFilename);
                    await page.screenshot({ path: filePath });

                    console.log(kleur.green(`Screenshot saved at: ${filePath}`));
                    return `Screenshot saved successfully at ${filePath}`;
                } catch (error) {
                    console.error(error);
                    return `Failed to take screenshot. Details: ${error.message}`;
                }
            },
        }),
        // Get Page Elements
        tool({
            name: 'getPageElements',
            description: 'Scans the webpage and returns a list of all interactive elements with text, role, and coordinates.',
            parameters: z.object({}),
            execute: async () => {
                try {
                    console.log(kleur.cyan('Scanning page for interactive elements...'));
                    const elements = await page.evaluate(() => {
                        const interactiveElements = Array.from(
                            document.querySelectorAll('a, button, input[type="submit"], input[type="button"], [role="button"], [onclick]')
                        );
                        return interactiveElements.map((el, index) => {
                            const rect = el.getBoundingClientRect();
                            return {
                                id: index + 1,
                                text: el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '',
                                role: el.tagName.toLowerCase(),
                                coords: { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) }
                            };
                        });
                    });
                    return `Found ${elements.length} interactive elements.`;
                } catch (error) {
                    console.error(error);
                    return `Failed to get page elements. Details: ${error.message}`;
                }
            }
        }),

        // Fill Field
        tool({
            name: 'fillField',
            description: 'Fills a form field with text, identified by a CSS selector.',
            parameters: z.object({ selector: z.string(), text: z.string() }),
            execute: async ({ selector, text }) => {
                try {
                    console.log(kleur.cyan(`Filling "${text}" into "${selector}"...`));
                    await page.fill(selector, text);
                    return `Successfully filled "${selector}".`;
                } catch (error) {
                    console.error(error);
                    return `Failed to fill field. Details: ${error.message}`;
                }
            }
        }),

        // Scroll Page
        tool({
            name: 'scrollPage',
            description: 'Scrolls the page vertically.',
            parameters: z.object({ scrollAmount: z.number() }),
            execute: async ({ scrollAmount }) => {
                try {
                    console.log(kleur.cyan(`Scrolling by ${scrollAmount} pixels...`));
                    await page.mouse.wheel(0, scrollAmount);
                    return `Successfully scrolled by ${scrollAmount} pixels.`;
                } catch (error) {
                    console.error(error);
                    return `Failed to scroll. Details: ${error.message}`;
                }
            }
        }),

        // Type Text
        tool({
            name: 'typeText',
            description: 'Types text into the currently focused element.',
            parameters: z.object({ text: z.string() }),
            execute: async ({ text }) => {
                try {
                    console.log(kleur.cyan(`Typing text: "${text}"...`));
                    await page.keyboard.type(text);
                    return `Successfully typed "${text}".`;
                } catch (error) {
                    console.error(error);
                    return `Failed to type text. Details: ${error.message}`;
                }
            }
        }),

        // Click At Coordinates
        tool({
            name: 'clickAtCoordinates',
            description: 'Clicks at a specific (x, y) coordinate on the page.',
            parameters: z.object({ x: z.number(), y: z.number() }),
            execute: async ({ x, y }) => {
                try {
                    console.log(kleur.cyan(`Clicking at coordinates (${x}, ${y})...`));
                    await page.mouse.click(x, y);
                    return `Successfully clicked at (${x}, ${y}).`;
                } catch (error) {
                    console.error(error);
                    return `Failed to click at coordinates. Details: ${error.message}`;
                }
            }
        }),

        // Drag and Drop
        tool({
            name: 'dragAndDropElement',
            description: 'Drags an element from a source to a target location.',
            parameters: z.object({ sourceSelector: z.string(), targetSelector: z.string() }),
            execute: async ({ sourceSelector, targetSelector }) => {
                try {
                    console.log(kleur.cyan(`Dragging "${sourceSelector}" to "${targetSelector}"...`));
                    await page.dragAndDrop(sourceSelector, targetSelector);
                    return `Successfully dragged "${sourceSelector}" to "${targetSelector}".`;
                } catch (error) {
                    console.error(error);
                    return `Failed to drag and drop. Details: ${error.message}`;
                }
            }
        }),

        // Get Page HTML
        tool({
            name: 'getPageHTML',
            description: 'Gets the full HTML of the current page.',
            parameters: z.object({}),
            execute: async () => {
                try {
                    console.log(kleur.cyan('Fetching page HTML...'));
                    const html = await page.content();
                    return html.length > 10000 ? html.slice(0, 10000) + '... [truncated]' : html;
                } catch (error) {
                    console.error(error);
                    return `Failed to get page HTML. Details: ${error.message}`;
                }
            }
        }),

        // Find Elements By Text
        tool({
            name: 'findElementsByText',
            description: 'Finds elements containing specific text.',
            parameters: z.object({ text: z.string() }),
            execute: async ({ text }) => {
                try {
                    console.log(kleur.cyan(`Searching for elements containing text "${text}"...`));
                    const elements = await page.evaluate((searchText) => {
                        const matches = [];
                        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
                        let node;
                        while ((node = walker.nextNode())) {
                            if (node.innerText && node.innerText.toLowerCase().includes(searchText.toLowerCase())) {
                                const rect = node.getBoundingClientRect();
                                if (rect.width > 0 && rect.height > 0) {
                                    matches.push({
                                        tag: node.tagName.toLowerCase(),
                                        text: node.innerText.trim(),
                                        selector: node.outerHTML.slice(0, 100),
                                        coords: { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) },
                                    });
                                }
                            }
                        }
                        return matches;
                    }, text);

                    if (elements.length === 0) return `No elements found with text "${text}".`;
                    return `Found ${elements.length} elements with text "${text}".\nDetails (first 5):\n${JSON.stringify(elements.slice(0, 5), null, 2)}`;
                } catch (error) {
                    console.error(error);
                    return `Failed to search elements. Details: ${error.message}`;
                }
            }
        }),
    ];
};

export default createBrowserTools;
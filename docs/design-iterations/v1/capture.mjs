#!/usr/bin/env node
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
mkdirSync(__dirname, { recursive: true });

const htmlPath = path.join(__dirname, 'preview.html').replace(/\\/g, '/');
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();
await page.goto(`file:///${htmlPath}`);
await page.waitForTimeout(600);
const screenshotPath = path.join(__dirname, 'screenshot.png');
await page.screenshot({
  path: screenshotPath,
  fullPage: true,
});
await browser.close();
console.log('V1 screenshot saved:', screenshotPath);

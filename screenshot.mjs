import puppeteer from 'puppeteer';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

const dir = join(__dirname, 'temporary screenshots');
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

let n = 1;
while (existsSync(join(dir, `screenshot-${n}${label ? '-' + label : ''}.png`))) n++;
const filename = `screenshot-${n}${label ? '-' + label : ''}.png`;
const filepath = join(dir, filename);

const chromePaths = [
  `C:/Users/${process.env.USERNAME}/.cache/puppeteer/chrome/win64-131.0.6778.204/chrome-win64/chrome.exe`,
  'C:/Users/dibye/.cache/puppeteer/chrome/win64-131.0.6778.204/chrome-win64/chrome.exe',
  'C:/Users/nateh/.cache/puppeteer/chrome/win64-131.0.6778.204/chrome-win64/chrome.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];

const executablePath = chromePaths.find(p => existsSync(p));
if (!executablePath) {
  console.warn('Chrome not found at known paths. Letting puppeteer use its default.');
}

const browser = await puppeteer.launch({
  ...(executablePath ? { executablePath } : {}),
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  headless: true,
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));

// Scroll through page to trigger IntersectionObserver reveals, then scroll back to top
await page.evaluate(async () => {
  await new Promise(resolve => {
    const distance = 300;
    const delay = 80;
    const timer = setInterval(() => {
      window.scrollBy(0, distance);
      if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
        clearInterval(timer);
        window.scrollTo(0, 0);
        resolve();
      }
    }, delay);
  });
});
await new Promise(r => setTimeout(r, 800));

const buf = await page.screenshot({ fullPage: true });
await browser.close();

writeFileSync(filepath, buf);
console.log(`Saved: temporary screenshots/${filename}`);

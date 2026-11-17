import puppeteer from 'puppeteer-core';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = await puppeteer.launch({
  executablePath: edge,
  headless: true,
  args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
const logs = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') logs.push(msg.text());
});
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto('http://127.0.0.1:5173/#/', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 700));

const clickLabel = async (label) => {
  const ok = await page.evaluate((value) => {
    const el = [...document.querySelectorAll('button')].find(
      (item) => (item.getAttribute('aria-label') || item.textContent || '').trim() === value,
    );
    if (!el) return false;
    el.click();
    return true;
  }, label);
  await new Promise((r) => setTimeout(r, 500));
  return ok;
};

const drawerOpened = await clickLabel('Відкрити меню');
const drawer = await page.evaluate(() => {
  const aside = document.querySelector('aside');
  const box = aside?.getBoundingClientRect();
  return { open: Boolean(box && box.left >= -1), left: box?.left, width: box?.width };
});
await page.screenshot({ path: 'C:\\Users\\Admin\\AppData\\Local\\Temp\\mf-mobile-drawer.png' });
const navToLibrary = await page.evaluate(() => {
  const link = [...document.querySelectorAll('a')].find((a) => a.textContent.trim() === 'Моя музика');
  link?.click();
  return Boolean(link);
});
await new Promise((r) => setTimeout(r, 900));
const url = page.url();

const played = await page.evaluate(() => {
  const button = [...document.querySelectorAll('button')].find((b) =>
    (b.getAttribute('aria-label') || '').startsWith('Відтворити:'),
  );
  button?.click();
  return Boolean(button);
});
await new Promise((r) => setTimeout(r, 2200));
const player = await page.evaluate(() => {
  const range = document.querySelector('input[aria-label="Позиція відтворення"]');
  return { value: range?.value, max: range?.max, now: document.body.innerText.split('\n').slice(-4) };
});

await clickLabel('Відкрити екран «Зараз грає»');
await new Promise((r) => setTimeout(r, 700));
const nowPlaying = await page.evaluate(() => ({
  dialog: document.querySelector('[role="dialog"]')?.getAttribute('aria-label'),
  text: document.body.innerText.slice(-500),
}));
await page.screenshot({ path: 'C:\\Users\\Admin\\AppData\\Local\\Temp\\mf-mobile-nowplaying.png' });

console.log(
  JSON.stringify({ drawerOpened, drawer, navToLibrary, url, played, player, nowPlaying, logs }, null, 2),
);
await browser.close();

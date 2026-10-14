/**
 * Drives the built app the way a person does: pick Upload, choose a PDF, press
 * Roast, and look at what is actually POSTed to /api/roast.
 *
 * That request body is the whole reason this file exists. The upload tab used
 * to validate the file type, show the filename and never read the file, so
 * pressing Roast sent an empty resume and got back a roast of nothing. It
 * looked like it worked. Checking that the UI says "uploaded" would have
 * passed; only looking at the outgoing request catches it.
 *
 * The three fixtures are generated here rather than committed, so there are no
 * binaries in the repo and the inputs are visible as the HTML they came from.
 *
 *     npm run build && npx vite preview --port 4173 &
 *     node scripts/upload-check.mjs
 */
import p from 'puppeteer-core';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = process.argv[2] || 4173;
const dir = mkdtempSync(join(tmpdir(), 'roast-fixtures-'));

const pdf = (name, html) => {
  const src = join(dir, `${name}.html`), out = join(dir, `${name}.pdf`);
  writeFileSync(src, html);
  execFileSync(CHROME, ['--headless', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${out}`, src],
    { stdio: 'ignore' });
  return out;
};

const resume = pdf('resume', `<html><body style="font-family:Georgia;font-size:12pt;padding:40px">
  <h1>Priya Raman</h1><p>Senior Synergy Facilitator | priya@example.com</p>
  <h2>Experience</h2><p><b>Lead Innovation Evangelist, Acme Dynamics</b> 2021 to present</p>
  <ul><li>Passionate about leveraging synergies across cross-functional verticals</li>
  <li>Team player who thinks outside the box and wears many hats</li></ul></body></html>`);
/* A scan is a picture of words. It opens fine and yields nothing, which is the
   exact shape of the original bug. */
const scanned = pdf('scanned', `<html><body style="margin:0">
  <div style="width:600px;height:800px;background:linear-gradient(#888,#333)"></div></body></html>`);
const fake = join(dir, 'fake.pdf');
writeFileSync(fake, 'this is not a pdf at all, just text pretending');

const browser = await p.launch({ executablePath: CHROME, headless: 'new' });
const fails = [];
const is = (n, g, w) => {
  if (g !== w) fails.push(`${n}: got ${JSON.stringify(g)}, expected ${JSON.stringify(w)}`);
  else console.log('  ok ', n);
};

/** Opens the app, uploads `file`, optionally presses Roast, returns what was sent. */
async function run(file, { press = true } = {}) {
  const pg = await browser.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  let posted = null;
  await pg.setRequestInterception(true);
  pg.on('request', r => {
    if (r.url().endsWith('/api/roast') && r.method() === 'POST') {
      posted = JSON.parse(r.postData() || '{}');
      return r.respond({ status: 200, contentType: 'application/json', body: '{"roast":"Stubbed roast."}' });
    }
    r.continue();
  });
  await pg.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle2' });
  await pg.evaluate(() => [...document.querySelectorAll('button')]
    .find(b => /Upload PDF/i.test(b.textContent)).click());
  (await pg.$('input[type=file]')).uploadFile(file);
  await pg.waitForFunction(
    () => /page.*read|No text|could not be opened|password/i.test(document.body.innerText),
    { timeout: 25000 });
  const shown = await pg.evaluate(() => document.body.innerText);
  if (press) {
    await pg.evaluate(() => [...document.querySelectorAll('button')]
      .find(b => /roast/i.test(b.textContent) && !/Upload/i.test(b.textContent)).click());
    await new Promise(r => setTimeout(r, 1400));
  }
  await pg.close();
  return { posted, shown, errs };
}

console.log('a readable resume');
{
  const { posted, shown, errs } = await run(resume);
  is('UI reports what it read', /\d+ page.? read, \d+ words/.test(shown), true);
  is('a request was made', posted !== null, true);
  is('text is NOT empty', (posted?.text || '').trim().length > 0, true);
  is('text came from the PDF', /Priya Raman/.test(posted?.text || ''), true);
  is('bullets survived', /synergies across cross-functional/.test(posted?.text || ''), true);
  is('line structure preserved', (posted?.text || '').split('\n').length > 4, true);
  is('client sends no system prompt', 'system' in (posted || {}), false);
  is('no page errors', errs.length, 0);
}

for (const [name, file, expect] of [
  ['a scan with no text layer', scanned, /No text in that PDF/i],
  ['a file that is not a PDF', fake, /could not be opened as a PDF/i],
]) {
  console.log(`\n${name}`);
  const { posted, shown } = await run(file);
  is('says why, in words', expect.test(shown), true);
  is('nothing reaches the model', posted, null);
}

await browser.close();
if (fails.length) { console.log(`\nFAILED (${fails.length}):`); fails.forEach(f => console.log('  -', f)); process.exit(1); }
console.log('\nOK: a readable PDF reaches the model as text, an unreadable one is refused out loud and never sent');

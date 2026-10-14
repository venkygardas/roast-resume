# Resume Roast

Paste a resume, pick a heat level, get it torn apart honestly.

**[roast-resume-lilac.vercel.app](https://roast-resume-lilac.vercel.app)**

Built in a weekend, which was its own kind of scope lesson.

## The idea

Resume feedback is useless because it is polite. Everybody tells you it looks
great and nobody tells you that "passionate about synergies" is the reason
nobody called back. So the heat is a dial, and you choose it:

| Level | What you get |
| --- | --- |
| **Mild** | A witty career coach. Cheeky, ultimately warm, three or four specific observations. |
| **Medium** | A sharp recruiter. Every cliche, every vague bullet, every inflated title. No sugarcoating. |
| **Savage** | A roast MC with no mercy. Nothing left standing. |

Every level ends the same way: three genuinely useful improvement tips. The
joke is the delivery, not the advice. A roast that leaves you with nothing to
fix is just an insult.

## How it works

One React component for the page, one serverless function for the roast. Your
resume goes to `/api/roast`, which picks the system prompt and calls
`llama-3.3-70b-versatile` on Groq. The heat level is not a parameter, it is a
different system prompt.

```
React 19 + Vite        no framework beyond that, no router, no UI library
api/roast.js           Vercel serverless function, holds the key and the prompts
src/readPdf.js         pdf.js text extraction, in the browser, lazily loaded
Groq                   llama-3.3-70b-versatile, max_tokens 1000
styling                inline style objects, no CSS framework
dependencies           react, react-dom, pdfjs-dist
```

### Why the PDF is read in the browser

A resume is somebody's address, phone number and employment history, and the
only thing a roast needs is the words. Extracting locally means the file never
leaves the machine: `/api/roast` receives text, exactly as it does when you
paste. pdf.js is imported lazily, so the 1.6 MB of it loads only for someone
who actually drops a file.

A scanned resume is a picture of words rather than words, so it opens fine and
yields nothing. That is said out loud instead of being sent as an empty resume,
which is what this tab used to do.

### Why the roast is not called from the browser

It used to be. The browser held the key in a `VITE_GROQ_KEY`, and Vite inlines
anything named `VITE_*` into the bundle at build time, so that key was readable
by anyone who opened the network tab for as long as the site was up.

Moving the call to a function fixes that, but only if the function refuses to
be a general purpose one. Two things make it a proxy rather than a free LLM on
my account:

- **The server owns the prompts.** The browser sends `mild`, `medium` or
  `savage`, not words. An id that is not one of the three is refused, so there
  is no request that makes this model do something other than roast a resume.
- **The key has no `VITE_` prefix.** `GROQ_KEY` cannot be inlined even by
  accident. `node scripts/roast-check.mjs` builds with a canary key in the
  environment and asserts that nothing key shaped reaches `dist/`.

There is also a size cap, a per IP rate limit, and errors from Groq are logged
rather than forwarded, because an upstream message can name the key or the
account.

## Running it

```bash
npm install
echo "GROQ_KEY=your_key_here" > .env.local
npx vercel dev
```

A key is free from [console.groq.com](https://console.groq.com).

`npm run dev` runs Vite alone, which serves the page but not `/api`, so the
roast button will 404. Use `vercel dev` for the whole thing.

### Deploying

Set `GROQ_KEY` in the Vercel project's environment variables. Not
`VITE_GROQ_KEY`, which is the bug this was built to remove.

## Checks

```bash
node scripts/roast-check.mjs                       # the endpoint
npm run build && npx vite preview --port 4173 &
node scripts/upload-check.mjs                      # the upload path
```

`roast-check` is twenty one assertions with no network and no real key: every
refusal fires, a caller cannot substitute their own system prompt, the bearer
token comes from the environment, and an upstream error naming a key does not
reach the browser.

`upload-check` drives the built app in a real browser against three generated
PDFs and asserts on the **outgoing request**, not the screen. The upload tab
used to show a filename and a tick while sending an empty resume, so anything
that checked the UI would have passed it. Only the request body catches that.

## Known issues

- No streaming, so a roast arrives all at once after a few seconds of rotating
  loading lines.
- The rate limit lives in one instance's memory. It resets on a cold start and
  does not see what another instance served, so it stops a loop from one
  machine and not much else. Real limiting needs shared state, which this does
  not have and does not yet justify.

## Why it exists

I wanted to see how far a single afternoon goes when the product is one idea
and the idea is good. The answer is: quite far, as long as you are honest
afterwards about what you did not build.

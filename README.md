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

One React component, about 430 lines, and no backend. Your resume goes
straight from the browser to `llama-3.3-70b-versatile` on Groq's
OpenAI-compatible endpoint, and the roast comes back. The heat level is not a
parameter, it is a different system prompt.

```
React 19 + Vite        no framework beyond that, no router, no UI library
Groq                   llama-3.3-70b-versatile, max_tokens 1000
styling                inline style objects, no CSS framework
dependencies           react, react-dom. That is the whole list.
```

## Running it

```bash
npm install
echo "VITE_GROQ_KEY=your_key_here" > .env.local
npm run dev
```

A key is free from [console.groq.com](https://console.groq.com).

**One thing to know before you deploy this.** Anything Vite names `VITE_*` is
inlined into the JavaScript bundle at build time, which means it is readable by
anyone who opens the network tab. That is fine for a weekend toy on a free
tier. It is not fine for a key you care about, and the fix is to move the call
behind a serverless function so the key stays on the server. That is the next
thing this needs.

## Known issues

- **PDF upload does not read the file.** The upload tab accepts a PDF, checks
  the type and shows the filename, but nothing extracts the text, so the roast
  is generated from an empty resume. Paste works correctly. Either the tab
  needs a real text extraction step or it should come out.
- **The key is in the client.** See above.
- No streaming, so a roast arrives all at once after a few seconds of rotating
  loading lines.

## Why it exists

I wanted to see how far a single afternoon goes when the product is one idea
and the idea is good. The answer is: quite far, as long as you are honest
afterwards about what you did not build.

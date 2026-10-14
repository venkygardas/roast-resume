/**
 * The roast, moved off the client.
 *
 * It used to be a fetch straight from the browser to Groq with the key in an
 * `import.meta.env.VITE_GROQ_KEY`. Vite inlines anything named `VITE_*` into
 * the bundle at build time, so that key was readable by anyone who opened the
 * network tab, and it was readable for as long as the site was up.
 *
 * Two things change here, and the second one matters more than it looks.
 *
 * THE KEY NEVER LEAVES THE SERVER. `GROQ_KEY` has no `VITE_` prefix, so Vite
 * cannot inline it even by accident. If it is missing the endpoint says so
 * plainly instead of calling Groq without authorisation and surfacing a 401.
 *
 * THE CLIENT CHOOSES A LEVEL, NOT A PROMPT. Before, the browser sent the whole
 * system prompt and this would have forwarded it. A proxy that forwards
 * whatever it is given is not a proxy, it is a free LLM with somebody else's
 * credit card attached: anyone could POST their own system prompt and use this
 * for whatever they liked. So the prompts live here, the request carries an id,
 * and an id that is not one of the three is refused. The protection is that the
 * capability is absent, not that the wording is clever.
 */

const LEVELS = {
  mild:
    "You're a witty career coach doing a light comedy roast. Be funny and a bit cheeky but ultimately warm. Make 3–4 specific, funny observations that reference real things in the resume. Call out buzzwords or vague claims gently. End with 3 genuinely useful improvement tips labeled clearly.",
  medium:
    "You're a sharp recruiter hosting a proper roast. Be genuinely funny, specific, and a bit savage — call out every cliché, every vague bullet point, every inflated job title you see. Don't sugarcoat it. Be merciless but constructive. End with 3 real improvement tips labeled clearly.",
  savage:
    "You are a brutal comedy roast MC with absolutely zero mercy. Obliterate this resume. Mock every buzzword, every 'team player', every 'passionate about synergies', every gap, every weak verb, every lie you can smell. Be hilarious, specific, and relentlessly savage. Leave nothing standing. But — because even monsters have hearts — end with 3 genuinely useful improvement tips labeled clearly.",
};

const MODEL = 'llama-3.3-70b-versatile';
const MAX_TOKENS = 1000;

/* A resume is a page or two. 20k characters is roughly ten pages, so this
   refuses a pasted novel without ever refusing a real resume. Without it the
   token bill is whatever a stranger decides to paste. */
const MAX_CHARS = 20_000;

/* A speed bump, not a wall. It lives in the memory of one instance, so it
   resets on a cold start and does not see what another instance served. Real
   limiting needs shared state, which this does not have and does not yet
   justify. It is here because the endpoint spends money and the cheapest
   version of abuse is a loop from one machine. */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const hits = new Map();

function overLimit(ip) {
  const now = Date.now();
  const seen = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  seen.push(now);
  hits.set(ip, seen);
  if (hits.size > 5000) hits.clear();          // bounded, since this never drains
  return seen.length > MAX_PER_WINDOW;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST a resume or go home.' });
  }

  const key = process.env.GROQ_KEY;
  if (!key) {
    // Said plainly, because the alternative is a 401 from Groq that reads like
    // the key is wrong rather than absent.
    return res.status(500).json({ error: 'Roasting is not configured on this deployment.' });
  }

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  if (overLimit(ip)) {
    return res.status(429).json({ error: 'Easy. Give it a minute before the next roast.' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  const { level, text } = body || {};

  const system = Object.prototype.hasOwnProperty.call(LEVELS, level) ? LEVELS[level] : null;
  if (!system) {
    return res.status(400).json({ error: 'Pick a heat level: mild, medium or savage.' });
  }
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: "Can't roast nothing. Send the resume text." });
  }
  if (text.length > MAX_CHARS) {
    return res.status(413).json({ error: 'That is longer than any resume should be. Trim it and try again.' });
  }

  try {
    const groq = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `Here is my resume. Roast it:\n\n${text}` },
        ],
      }),
    });

    const data = await groq.json();

    if (!groq.ok || data.error) {
      // Upstream errors can name the account, the key or the org. The browser
      // gets a sentence; the detail goes to the server log where it belongs.
      console.error('groq error', groq.status, data?.error?.message);
      return res.status(502).json({ error: 'The roast judges are unavailable. Try again in a moment.' });
    }

    const roast = data.choices?.[0]?.message?.content;
    if (!roast) {
      console.error('groq returned no content', JSON.stringify(data).slice(0, 400));
      return res.status(502).json({ error: 'Nothing came back. Try again.' });
    }

    return res.status(200).json({ roast });
  } catch (err) {
    console.error('roast failed', err);
    return res.status(502).json({ error: 'Something broke on the way to the judges.' });
  }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

/* Exported so the guards can be exercised without a network or a key. */
export const __test = { LEVELS, MAX_CHARS, MAX_PER_WINDOW, WINDOW_MS };

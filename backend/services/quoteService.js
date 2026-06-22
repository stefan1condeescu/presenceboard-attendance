const crypto = require('crypto');

const DEFAULT_QUOTE_API_URL = 'https://dummyjson.com/quotes/random';
const QUOTE_API_TIMEOUT_MS = 3500;

const FALLBACK_QUOTES = [
  {
    text: 'A clean demo is a happy path with honest edge cases.',
    author: 'Engineering note',
  },
  {
    text: 'Small systems are easiest to trust when every flow can be explained.',
    author: 'PresenceBoard',
  },
  {
    text: 'Good tools should make the room calmer, not busier.',
    author: 'Product note',
  },
  {
    text: 'The best attendance sheet is the one nobody has to chase after.',
    author: 'PresenceBoard',
  },
  {
    text: 'Reliable software starts with clear ownership and simple recovery paths.',
    author: 'Engineering note',
  },
  {
    text: 'A useful feature is one that still makes sense under interview pressure.',
    author: 'Demo note',
  },
];

function getFallbackQuote() {
  const quoteIndex = crypto.randomInt(0, FALLBACK_QUOTES.length);
  return {
    id: quoteIndex + 1,
    ...FALLBACK_QUOTES[quoteIndex],
    source: 'Local fallback',
    external: false,
  };
}

function normalizeExternalQuote(payload) {
  if (!payload?.quote || !payload?.author) {
    throw new Error('Quote API returned an unexpected response.');
  }

  return {
    id: payload.id,
    text: payload.quote,
    author: payload.author,
    source: 'DummyJSON Quotes API',
    external: true,
  };
}

async function fetchExternalQuote() {
  const quoteApiUrl = process.env.QUOTE_API_URL || DEFAULT_QUOTE_API_URL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), QUOTE_API_TIMEOUT_MS);

  try {
    const res = await fetch(quoteApiUrl, {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Quote API failed with ${res.status}.`);
    }

    return normalizeExternalQuote(await res.json());
  } finally {
    clearTimeout(timeout);
  }
}

async function getRandomQuote() {
  try {
    return await fetchExternalQuote();
  } catch {
    return getFallbackQuote();
  }
}

module.exports = { getRandomQuote };

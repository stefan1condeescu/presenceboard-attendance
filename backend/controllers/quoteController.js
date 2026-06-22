const { getRandomQuote } = require('../services/quoteService');

async function getRandomQuoteHandler(req, res) {
  const quote = await getRandomQuote();

  return res.status(200).json({
    status: 'success',
    data: quote,
  });
}

module.exports = { getRandomQuoteHandler };

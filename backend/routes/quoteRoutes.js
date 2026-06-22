const express = require('express');
const { getRandomQuoteHandler } = require('../controllers/quoteController');

const quoteRouter = express.Router();

quoteRouter.get('/random', getRandomQuoteHandler);

module.exports = { quoteRouter };

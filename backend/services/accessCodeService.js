const crypto = require('crypto');
const { Event } = require('../models');

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

function buildCode() {
  let code = '';

  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += CODE_ALPHABET[crypto.randomInt(0, CODE_ALPHABET.length)];
  }

  return code;
}

async function generateUniqueAccessCode(transaction) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = buildCode();
    const existingEvent = await Event.findOne({
      where: { accessCode: code },
      transaction,
    });

    if (!existingEvent) {
      return code;
    }
  }

  throw new Error('Could not generate a unique access code.');
}

module.exports = { generateUniqueAccessCode };

const { Event } = require('../models');

async function getNextEventSequenceNumber(eventGroupId, options = {}) {
  const maxSequenceNumber = await Event.max('sequenceNumber', {
    where: { eventGroupId },
    transaction: options.transaction,
  });

  const normalizedMax = Number(maxSequenceNumber);

  if (!Number.isFinite(normalizedMax) || normalizedMax < 1) {
    return 1;
  }

  return normalizedMax + 1;
}

module.exports = { getNextEventSequenceNumber };

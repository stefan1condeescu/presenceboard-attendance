const VALID_RECURRENCES = ['weekly', 'biweekly', 'monthly'];

const calculateRecurringEvents = (startDate, endDate, recurrence, durationHours = 2) => {
  if (!VALID_RECURRENCES.includes(recurrence)) {
    throw new Error('Invalid recurrence. Allowed values: weekly, biweekly, monthly');
  }

  const events = [];
  const currentDate = new Date(startDate);
  const endBoundary = new Date(endDate);
  let sequenceNumber = 1;

  while (currentDate <= endBoundary) {
    const eventStart = new Date(currentDate);
    const eventEnd = new Date(currentDate);
    eventEnd.setHours(eventEnd.getHours() + Number(durationHours || 2));

    events.push({
      startTime: eventStart.toISOString(),
      endTime: eventEnd.toISOString(),
      sequenceNumber,
    });

    if (recurrence === 'monthly') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else {
      currentDate.setDate(currentDate.getDate() + (recurrence === 'biweekly' ? 14 : 7));
    }

    sequenceNumber += 1;
  }

  return events;
};

module.exports = { VALID_RECURRENCES, calculateRecurringEvents };

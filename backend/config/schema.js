const { DataTypes } = require('sequelize');
const { Event, EventGroup } = require('../models');

function isPositiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

async function ensureEventSequenceColumn(queryInterface) {
  const eventsTable = await queryInterface.describeTable('events');

  if (!eventsTable.sequence_number) {
    await queryInterface.addColumn('events', 'sequence_number', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  }
}

async function ensureEventSequenceIndex(queryInterface) {
  const indexes = await queryInterface.showIndex('events');
  const hasSequenceIndex = indexes.some((index) => index.name === 'events_event_group_sequence_unique');

  if (!hasSequenceIndex) {
    await queryInterface.addIndex('events', ['event_group_id', 'sequence_number'], {
      unique: true,
      name: 'events_event_group_sequence_unique',
    });
  }
}

async function backfillEventSequenceNumbers() {
  const eventGroups = await EventGroup.findAll({
    attributes: ['id'],
    order: [['id', 'ASC']],
  });

  for (const eventGroup of eventGroups) {
    const usedSequenceNumbers = new Set();
    let nextSequenceNumber = 1;

    const events = await Event.findAll({
      where: { eventGroupId: eventGroup.id },
      order: [
        ['startTime', 'ASC'],
        ['id', 'ASC'],
      ],
    });

    for (const event of events) {
      const currentSequenceNumber = Number(event.sequenceNumber);

      if (isPositiveInteger(currentSequenceNumber) && !usedSequenceNumbers.has(currentSequenceNumber)) {
        usedSequenceNumbers.add(currentSequenceNumber);
        continue;
      }

      while (usedSequenceNumbers.has(nextSequenceNumber)) {
        nextSequenceNumber += 1;
      }

      await event.update({ sequenceNumber: nextSequenceNumber });
      usedSequenceNumbers.add(nextSequenceNumber);
    }
  }
}

async function ensureDatabaseSchema(sequelize) {
  const queryInterface = sequelize.getQueryInterface();

  await ensureEventSequenceColumn(queryInterface);
  await backfillEventSequenceNumbers();
  await ensureEventSequenceIndex(queryInterface);
}

module.exports = { ensureDatabaseSchema };

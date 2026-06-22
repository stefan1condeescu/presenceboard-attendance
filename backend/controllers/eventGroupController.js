const { sequelize } = require('../config/database');
const { Event, EventGroup } = require('../models');
const { generateUniqueAccessCode } = require('../services/accessCodeService');
const { getDefaultGroupDescription } = require('../services/groupDescriptionService');
const { VALID_RECURRENCES, calculateRecurringEvents } = require('../services/recurrenceService');
const { validateOptionalDateRange } = require('../utils/dateValidation');

async function getAllEventGroups(req, res) {
  try {
    const organizerId = req.user.id;
    const eventGroups = await EventGroup.findAll({
      where: { organizerId },
      order: [['id', 'DESC']],
    });

    return res.status(200).json({
      status: 'success',
      data: eventGroups,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'failed',
      message: 'Could not load event groups.',
      error: error.message,
    });
  }
}

async function getEventGroupById(req, res) {
  try {
    const id = req.params.id;
    const organizerId = req.user.id;
    const eventGroup = await EventGroup.findOne({
      where: { id, organizerId },
    });

    if (!eventGroup) {
      return res.status(404).json({
        status: 'failed',
        message: 'Event group was not found, or you do not have access to it.',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: eventGroup,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'failed',
      message: 'Could not load event group.',
      error: error.message,
    });
  }
}

async function createEventGroup(req, res) {
  const title = String(req.body.title || '').trim();
  const description = String(req.body.description || '').trim() || getDefaultGroupDescription();
  const recurrence = req.body.recurrence || null;
  const durationHours = Number(req.body.durationHours || 2);
  const organizerId = req.user.id;
  const dateError = validateOptionalDateRange(req.body.startDate, req.body.endDate);

  if (!title) {
    return res.status(400).json({
      status: 'failed',
      message: 'Group title is required.',
    });
  }

  if (dateError) {
    return res.status(400).json({
      status: 'failed',
      message: dateError,
    });
  }

  if (recurrence && !VALID_RECURRENCES.includes(recurrence)) {
    return res.status(400).json({
      status: 'failed',
      message: `Recurrence must be one of: ${VALID_RECURRENCES.join(', ')}.`,
    });
  }

  if (recurrence && (!req.body.startDate || !req.body.endDate)) {
    return res.status(400).json({
      status: 'failed',
      message: 'Start and end dates are required when recurrence is enabled.',
    });
  }

  if (!Number.isFinite(durationHours) || durationHours < 1 || durationHours > 12) {
    return res.status(400).json({
      status: 'failed',
      message: 'Event duration must be between 1 and 12 hours.',
    });
  }

  try {
    const result = await sequelize.transaction(async (transaction) => {
      const newEventGroup = await EventGroup.create({
        title,
        description,
        startDate: req.body.startDate || null,
        endDate: req.body.endDate || null,
        recurrence,
        organizerId,
      }, { transaction });

      const generatedEvents = [];

      if (recurrence) {
        const eventDates = calculateRecurringEvents(
          req.body.startDate,
          req.body.endDate,
          recurrence,
          durationHours,
        );

        for (const eventDate of eventDates) {
          const event = await Event.create({
            startTime: eventDate.startTime,
            endTime: eventDate.endTime,
            sequenceNumber: eventDate.sequenceNumber,
            accessCode: await generateUniqueAccessCode(transaction),
            eventGroupId: newEventGroup.id,
          }, { transaction });

          generatedEvents.push(event);
        }
      }

      return { eventGroup: newEventGroup, events: generatedEvents };
    });

    return res.status(201).json({
      status: 'success',
      message: result.events.length > 0
        ? `Group created with ${result.events.length} generated events.`
        : 'Group created successfully.',
      data: result.eventGroup,
      events: result.events,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'failed',
      message: 'Could not create event group.',
      error: error.message,
    });
  }
}

async function updateEventGroup(req, res) {
  try {
    const id = req.params.id;
    const organizerId = req.user.id;
    const eventGroup = await EventGroup.findOne({
      where: { id, organizerId },
    });

    if (!eventGroup) {
      return res.status(404).json({
        status: 'failed',
        message: 'Event group was not found, or you do not have permission to update it.',
      });
    }

    const title = req.body.title === undefined ? eventGroup.title : String(req.body.title || '').trim();

    if (!title) {
      return res.status(400).json({
        status: 'failed',
        message: 'Group title is required.',
      });
    }

    const dateError = validateOptionalDateRange(
      req.body.startDate ?? eventGroup.startDate,
      req.body.endDate ?? eventGroup.endDate,
    );

    if (dateError) {
      return res.status(400).json({
        status: 'failed',
        message: dateError,
      });
    }

    const recurrence = req.body.recurrence === undefined ? eventGroup.recurrence : req.body.recurrence;

    if (recurrence && !VALID_RECURRENCES.includes(recurrence)) {
      return res.status(400).json({
        status: 'failed',
        message: `Recurrence must be one of: ${VALID_RECURRENCES.join(', ')}.`,
      });
    }

    await eventGroup.update({
      title,
      description: req.body.description === undefined ? eventGroup.description : String(req.body.description || '').trim(),
      startDate: req.body.startDate ?? eventGroup.startDate,
      endDate: req.body.endDate ?? eventGroup.endDate,
      recurrence: recurrence || null,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Event group updated successfully.',
      data: eventGroup,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'failed',
      message: 'Could not update event group.',
      error: error.message,
    });
  }
}

async function deleteEventGroup(req, res) {
  try {
    const id = req.params.id;
    const organizerId = req.user.id;
    const eventGroup = await EventGroup.findOne({
      where: { id, organizerId },
    });

    if (!eventGroup) {
      return res.status(404).json({
        status: 'failed',
        message: 'Event group was not found, or you do not have permission to delete it.',
      });
    }

    await eventGroup.destroy();

    return res.status(200).json({
      status: 'success',
      message: 'Event group deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      status: 'failed',
      message: 'Could not delete event group.',
      error: error.message,
    });
  }
}

module.exports = {
  getAllEventGroups,
  getEventGroupById,
  createEventGroup,
  updateEventGroup,
  deleteEventGroup,
};

const { Event, EventGroup } = require('../models');
const { generateUniqueAccessCode } = require('../services/accessCodeService');
const { getNextEventSequenceNumber } = require('../services/eventSequenceService');
const { validateRequiredDateRange } = require('../utils/dateValidation');

async function createEvent(req, res) {
  const { startTime, endTime, eventGroupId } = req.body;
  const organizerId = req.user.id;
  const dateError = validateRequiredDateRange(startTime, endTime);

  if (!eventGroupId) {
    return res.status(400).json({
      status: 'failed',
      message: 'Group id is required.',
    });
  }

  if (dateError) {
    return res.status(400).json({
      status: 'failed',
      message: dateError,
    });
  }

  try {
    const eventGroup = await EventGroup.findOne({
      where: {
        id: eventGroupId,
        organizerId,
      },
    });

    if (!eventGroup) {
      return res.status(404).json({
        status: 'failed',
        message: 'Event group was not found, or you do not have permission to create events in it.',
      });
    }

    const event = await Event.create({
      startTime,
      endTime,
      eventGroupId,
      sequenceNumber: await getNextEventSequenceNumber(eventGroupId),
      accessCode: await generateUniqueAccessCode(),
    });

    return res.status(201).json({
      status: 'success',
      message: 'Event created successfully.',
      data: event,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'failed',
      message: 'Could not create event.',
      error: error.message,
    });
  }
}

async function getAllEvents(req, res) {
  try {
    const organizerId = req.user.id;
    const eventGroups = await EventGroup.findAll({
      where: { organizerId },
      attributes: ['id'],
    });

    const eventGroupIds = eventGroups.map((eventGroup) => eventGroup.id);

    if (eventGroupIds.length === 0) {
      return res.status(200).json([]);
    }

    const events = await Event.findAll({
      where: {
        eventGroupId: eventGroupIds,
      },
      include: [{
        model: EventGroup,
        attributes: ['title', 'organizerId'],
      }],
      order: [['startTime', 'ASC']],
    });

    return res.status(200).json(events);
  } catch (error) {
    return res.status(500).json({
      status: 'failed',
      message: 'Could not load events.',
      error: error.message,
    });
  }
}

async function getEventById(req, res) {
  try {
    const organizerId = req.user.id;
    const event = await Event.findByPk(req.params.id, {
      include: [{
        model: EventGroup,
        attributes: ['title', 'organizerId'],
      }],
    });

    if (!event) {
      return res.status(404).json({
        status: 'failed',
        message: 'Event was not found.',
      });
    }

    if (Number(event.EventGroup.organizerId) !== Number(organizerId)) {
      return res.status(403).json({
        status: 'failed',
        message: 'You do not have permission to access this event.',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: event,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'failed',
      message: 'Could not load event.',
      error: error.message,
    });
  }
}

async function updateEvent(req, res) {
  try {
    const organizerId = req.user.id;
    const event = await Event.findByPk(req.params.id, {
      include: [{
        model: EventGroup,
        attributes: ['organizerId'],
      }],
    });

    if (!event) {
      return res.status(404).json({
        status: 'failed',
        message: 'Event was not found.',
      });
    }

    if (Number(event.EventGroup.organizerId) !== Number(organizerId)) {
      return res.status(403).json({
        status: 'failed',
        message: 'You do not have permission to update this event.',
      });
    }

    const startTime = req.body.startTime ?? event.startTime;
    const endTime = req.body.endTime ?? event.endTime;
    const dateError = validateRequiredDateRange(startTime, endTime);

    if (dateError) {
      return res.status(400).json({
        status: 'failed',
        message: dateError,
      });
    }

    await event.update({
      startTime,
      endTime,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Event updated successfully.',
      data: event,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'failed',
      message: 'Could not update event.',
      error: error.message,
    });
  }
}

async function deleteEvent(req, res) {
  try {
    const organizerId = req.user.id;
    const event = await Event.findByPk(req.params.id, {
      include: [{
        model: EventGroup,
        attributes: ['organizerId'],
      }],
    });

    if (!event) {
      return res.status(404).json({
        status: 'failed',
        message: 'Event was not found.',
      });
    }

    if (Number(event.EventGroup.organizerId) !== Number(organizerId)) {
      return res.status(403).json({
        status: 'failed',
        message: 'You do not have permission to delete this event.',
      });
    }

    await event.destroy();

    return res.status(200).json({
      status: 'success',
      message: 'Event deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      status: 'failed',
      message: 'Could not delete event.',
      error: error.message,
    });
  }
}

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};

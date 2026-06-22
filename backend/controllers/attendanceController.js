const { Parser } = require('json2csv');
const { UniqueConstraintError } = require('sequelize');
const { AttendanceRecord, Event, EventGroup } = require('../models');

const getEventStatus = (event) => {
  const now = new Date();
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  if (now < start || now > end) {
    return 'CLOSED';
  }

  return 'OPEN';
};

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function createAttendanceRecord(req, res) {
  try {
    const accessCode = String(req.body.accessCode || '').trim().toUpperCase();
    const participantName = String(req.body.participantName || '').trim();
    const participantEmail = normalizeEmail(req.body.participantEmail);

    if (!accessCode || !participantName || !participantEmail) {
      return res.status(400).json({
        status: 'failed',
        message: 'Access code, participant name, and participant email are required.',
      });
    }

    if (!isEmail(participantEmail)) {
      return res.status(400).json({
        status: 'failed',
        message: 'Please enter a valid email address.',
      });
    }

    const event = await Event.findOne({
      where: { accessCode },
    });

    if (!event) {
      return res.status(404).json({
        status: 'failed',
        message: 'No event was found for this access code.',
      });
    }

    if (getEventStatus(event) === 'CLOSED') {
      return res.status(400).json({
        status: 'failed',
        message: 'This event is not open for attendance check-in.',
      });
    }

    const existingAttendance = await AttendanceRecord.findOne({
      where: {
        eventId: event.id,
        participantEmail,
      },
    });

    if (existingAttendance) {
      return res.status(200).json({
        status: 'success',
        message: 'You are already checked in for this event.',
        data: existingAttendance,
      });
    }

    const newAttendance = await AttendanceRecord.create({
      participantName,
      participantEmail,
      eventId: event.id,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Attendance confirmed. You are checked in.',
      data: newAttendance,
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({
        status: 'failed',
        message: 'This participant is already checked in for this event.',
      });
    }

    return res.status(500).json({
      status: 'failed',
      message: 'Could not confirm attendance.',
      error: error.message,
    });
  }
}

async function getEventAttendance(req, res) {
  try {
    const id = req.params.id;
    const organizerId = req.user.id;
    const event = await Event.findByPk(id, {
      include: [{
        model: EventGroup,
        attributes: ['organizerId', 'title'],
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
        message: 'You do not have permission to view attendance for this event.',
      });
    }

    const attendance = await AttendanceRecord.findAll({
      where: {
        eventId: id,
      },
      order: [['checkedInAt', 'ASC']],
    });

    return res.status(200).json({
      status: 'success',
      event: {
        id: event.id,
        eventGroupId: event.eventGroupId,
        sequenceNumber: event.sequenceNumber,
        accessCode: event.accessCode,
        startTime: event.startTime,
        endTime: event.endTime,
        status: getEventStatus(event),
        eventGroupTitle: event.EventGroup.title,
      },
      totalAttendance: attendance.length,
      data: attendance,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'failed',
      message: 'Could not load attendance.',
      error: error.message,
    });
  }
}

async function exportEventAttendance(req, res) {
  try {
    const eventId = req.params.id;
    const organizerId = req.user.id;
    const event = await Event.findByPk(eventId, {
      include: [{
        model: EventGroup,
        attributes: ['organizerId', 'title'],
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
        message: 'You do not have permission to export attendance for this event.',
      });
    }

    const attendance = await AttendanceRecord.findAll({
      where: { eventId },
      order: [['checkedInAt', 'ASC']],
    });

    const csvData = attendance.map((entry) => ({
      Name: entry.participantName,
      Email: entry.participantEmail,
      'Checked in at': new Date(entry.checkedInAt).toLocaleString('en-US'),
    }));

    const parser = new Parser({
      fields: ['Name', 'Email', 'Checked in at'],
      delimiter: ',',
      withBOM: true,
    });

    const csv = parser.parse(csvData);
    const fileName = `attendance_event_${eventId}_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({
      status: 'failed',
      message: 'Could not export attendance.',
      error: error.message,
    });
  }
}

module.exports = {
  createAttendanceRecord,
  getEventAttendance,
  exportEventAttendance,
  getEventStatus,
};

const express = require('express');
const {
  createAttendanceRecord,
  getEventAttendance,
  exportEventAttendance,
} = require('../controllers/attendanceController');
const { authenticateToken } = require('../middleware/auth');

const attendanceRouter = express.Router();

attendanceRouter.post('/', createAttendanceRecord);
attendanceRouter.get('/events/:id', authenticateToken, getEventAttendance);
attendanceRouter.get('/export/:id', authenticateToken, exportEventAttendance);

module.exports = { attendanceRouter };

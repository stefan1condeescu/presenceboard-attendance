const express = require('express');
const { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { authenticateToken } = require('../middleware/auth');

const eventRouter = express.Router();

eventRouter.get('/', authenticateToken, getAllEvents);
eventRouter.get('/:id', authenticateToken, getEventById);
eventRouter.post('/', authenticateToken, createEvent);
eventRouter.put('/:id', authenticateToken, updateEvent);
eventRouter.delete('/:id', authenticateToken, deleteEvent);

module.exports = { eventRouter };

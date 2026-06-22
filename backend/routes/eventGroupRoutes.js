const express = require('express');
const {
  getAllEventGroups,
  getEventGroupById,
  createEventGroup,
  updateEventGroup,
  deleteEventGroup,
} = require('../controllers/eventGroupController');
const { authenticateToken } = require('../middleware/auth');

const eventGroupRouter = express.Router();

eventGroupRouter.get('/', authenticateToken, getAllEventGroups);
eventGroupRouter.get('/:id', authenticateToken, getEventGroupById);
eventGroupRouter.post('/', authenticateToken, createEventGroup);
eventGroupRouter.put('/:id', authenticateToken, updateEventGroup);
eventGroupRouter.delete('/:id', authenticateToken, deleteEventGroup);

module.exports = { eventGroupRouter };

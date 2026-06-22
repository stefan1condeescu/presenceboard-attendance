const express = require('express');
const { getAllOrganizers, getOrganizerById, register, login } = require('../controllers/organizerController');
const { authenticateToken } = require('../middleware/auth');

const organizerRouter = express.Router();

organizerRouter.post('/register', register);
organizerRouter.post('/login', login);
organizerRouter.get('/', authenticateToken, getAllOrganizers);
organizerRouter.get('/:id', authenticateToken, getOrganizerById);

module.exports = { organizerRouter };

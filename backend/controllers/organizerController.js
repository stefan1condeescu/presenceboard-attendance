const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Organizer } = require('../models');
const { getJwtSecret } = require('../middleware/auth');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function serializeOrganizer(organizer) {
  if (!organizer) {
    return null;
  }

  return {
    id: organizer.id,
    name: organizer.name,
    email: organizer.email,
    createdAt: organizer.createdAt,
  };
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function register(req, res) {
  const name = String(req.body.name || '').trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!name || !email || !password) {
    return res.status(400).json({
      status: 'failed',
      message: 'Name, email, and password are required.',
    });
  }

  if (!isEmail(email)) {
    return res.status(400).json({
      status: 'failed',
      message: 'Please enter a valid email address.',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      status: 'failed',
      message: 'Password must be at least 6 characters long.',
    });
  }

  try {
    const existingOrganizer = await Organizer.findOne({ where: { email } });

    if (existingOrganizer) {
      return res.status(409).json({
        status: 'failed',
        message: 'This email address is already in use.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newOrganizer = await Organizer.create({
      name,
      email,
      passwordHash,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Account created successfully.',
      organizer: serializeOrganizer(newOrganizer),
    });
  } catch (error) {
    console.error('Registration failed:', error);
    return res.status(500).json({
      status: 'failed',
      message: 'Internal server error.',
    });
  }
}

async function login(req, res) {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({
      status: 'failed',
      message: 'Email and password are required.',
    });
  }

  try {
    const organizer = await Organizer.findOne({ where: { email } });

    if (!organizer) {
      return res.status(401).json({
        status: 'failed',
        message: 'Email or password is incorrect.',
      });
    }

    const passwordMatches = await bcrypt.compare(password, organizer.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        status: 'failed',
        message: 'Email or password is incorrect.',
      });
    }

    const token = jwt.sign(
      {
        id: organizer.id,
        email: organizer.email,
      },
      getJwtSecret(),
      { expiresIn: '8h' },
    );

    return res.status(200).json({
      status: 'success',
      message: 'Signed in successfully.',
      token,
      organizer: serializeOrganizer(organizer),
    });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({
      status: 'failed',
      message: 'Internal server error.',
    });
  }
}

async function getAllOrganizers(req, res) {
  try {
    const organizers = await Organizer.findAll({
      attributes: ['id', 'name', 'email', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      status: 'success',
      data: organizers,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'failed',
      message: 'Could not load organizers.',
      error: error.message,
    });
  }
}

async function getOrganizerById(req, res) {
  try {
    const id = Number(req.params.id);

    if (Number(req.user.id) !== id) {
      return res.status(403).json({
        status: 'failed',
        message: 'You can only view your own organizer profile.',
      });
    }

    const organizer = await Organizer.findByPk(id);

    if (!organizer) {
      return res.status(404).json({
        status: 'failed',
        message: 'Organizer was not found.',
      });
    }

    return res.json({
      status: 'success',
      data: serializeOrganizer(organizer),
    });
  } catch (error) {
    return res.status(500).json({
      status: 'failed',
      message: 'Could not load organizer.',
      error: error.message,
    });
  }
}

module.exports = {
  register,
  login,
  getAllOrganizers,
  getOrganizerById,
};

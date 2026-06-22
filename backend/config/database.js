require('dotenv').config({ quiet: true });

const path = require('path');
const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: process.env.DB_SSL === 'false'
      ? {}
      : {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
  });
} else {
  const databasePath = process.env.DB_NAME || path.join(__dirname, '..', '..', 'presence.sqlite');

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: databasePath,
    logging: false,
  });

  sequelize.query('PRAGMA foreign_keys = ON;').catch((error) => {
    console.error('Could not enable SQLite foreign keys:', error.message);
  });
}

module.exports = { sequelize };

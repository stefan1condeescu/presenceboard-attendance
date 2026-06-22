const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Event = sequelize.define(
  'Event',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_time',
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_time',
    },
    sequenceNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'sequence_number',
      validate: {
        min: 1,
      },
    },
    accessCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'access_code',
      validate: {
        notEmpty: true,
      },
    },
    eventGroupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'event_group_id',
      references: {
        model: 'event_groups',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'events',
    timestamps: false,
  },
);

module.exports = Event;

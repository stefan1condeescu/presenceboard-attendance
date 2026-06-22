const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EventGroup = sequelize.define(
  'EventGroup',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_date',
    },
    recurrence: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    organizerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'organizer_id',
      references: {
        model: 'organizers',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'event_groups',
    timestamps: false,
  },
);

module.exports = EventGroup;

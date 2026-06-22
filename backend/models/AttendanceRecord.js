const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AttendanceRecord = sequelize.define(
  'AttendanceRecord',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    participantName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'participant_name',
      validate: {
        notEmpty: true,
      },
    },
    participantEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'participant_email',
      validate: {
        isEmail: true,
      },
    },
    checkedInAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'checked_in_at',
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'event_id',
      references: {
        model: 'events',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'attendance_records',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['event_id', 'participant_email'],
      },
    ],
  },
);

module.exports = AttendanceRecord;

const Organizer = require('./Organizer');
const EventGroup = require('./EventGroup');
const Event = require('./Event');
const AttendanceRecord = require('./AttendanceRecord');

Organizer.hasMany(EventGroup, {
  foreignKey: 'organizerId',
  onDelete: 'CASCADE',
});
EventGroup.belongsTo(Organizer, {
  foreignKey: 'organizerId',
});

EventGroup.hasMany(Event, {
  foreignKey: 'eventGroupId',
  onDelete: 'CASCADE',
});
Event.belongsTo(EventGroup, {
  foreignKey: 'eventGroupId',
});

Event.hasMany(AttendanceRecord, {
  foreignKey: 'eventId',
  onDelete: 'CASCADE',
});
AttendanceRecord.belongsTo(Event, {
  foreignKey: 'eventId',
});

module.exports = {
  Organizer,
  EventGroup,
  Event,
  AttendanceRecord,
};

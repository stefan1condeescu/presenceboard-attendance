const fs = require('fs');
const os = require('os');
const path = require('path');

const databasePath = path.join(os.tmpdir(), `presenceboard-smoke-${Date.now()}.sqlite`);
process.env.DB_NAME = databasePath;
process.env.JWT_SECRET = 'smoke-test-secret';

const { app, sequelize } = require('../app');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(baseUrl, route, options = {}) {
  const res = await fetch(`${baseUrl}${route}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${route} failed with ${res.status}: ${JSON.stringify(body)}`);
  }

  return body;
}

async function main() {
  await sequelize.sync({ force: true });

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const health = await request(baseUrl, '/api/health');
    assert(health.status === 'ok', 'Health check did not return ok.');

    const quote = await request(baseUrl, '/api/quotes/random');
    assert(quote.data?.text && quote.data?.author, 'Random quote API did not return a quote.');

    const email = `demo-${Date.now()}@example.com`;
    await request(baseUrl, '/api/organizers/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Demo Organizer',
        email,
        password: 'secret123',
      }),
    });

    const login = await request(baseUrl, '/api/organizers/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password: 'secret123',
      }),
    });

    assert(login.token, 'Login did not return a token.');
    const authHeaders = { Authorization: `Bearer ${login.token}` };

    let group = await request(baseUrl, '/api/event-groups', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Smoke Test Group',
        description: 'Created by the smoke test',
      }),
    });

    assert(group.data?.id, 'Group was not created.');

    group = await request(baseUrl, `/api/event-groups/${group.data.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Renamed Smoke Test Group',
        description: 'Updated by the smoke test',
      }),
    });

    assert(group.data?.title === 'Renamed Smoke Test Group', 'Group title was not updated.');

    const start = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const event = await request(baseUrl, '/api/events', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        eventGroupId: group.data.id,
        startTime: start,
        endTime: end,
      }),
    });

    assert(event.data?.accessCode, 'Event did not receive an access code.');
    assert(event.data?.sequenceNumber === 1, 'First event in a group should receive sequence number 1.');

    const recurringStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const recurringEnd = new Date(recurringStart.getTime() + 8 * 24 * 60 * 60 * 1000);
    const recurringGroup = await request(baseUrl, '/api/event-groups', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Recurring Smoke Group',
        description: 'Recurring events created by the smoke test',
        startDate: recurringStart.toISOString(),
        endDate: recurringEnd.toISOString(),
        recurrence: 'weekly',
        durationHours: 1,
      }),
    });

    assert(recurringGroup.events?.length === 2, 'Recurring group should generate two events.');
    assert(recurringGroup.events[0].sequenceNumber === 1, 'Recurring events should start at sequence number 1.');
    assert(recurringGroup.events[1].sequenceNumber === 2, 'Recurring events should continue inside their own group.');

    const attendance = await request(baseUrl, '/api/attendance', {
      method: 'POST',
      body: JSON.stringify({
        accessCode: event.data.accessCode,
        participantName: 'Demo Participant',
        participantEmail: 'participant@example.com',
      }),
    });

    assert(attendance.status === 'success', 'Attendance check-in failed.');

    const duplicateAttendance = await request(baseUrl, '/api/attendance', {
      method: 'POST',
      body: JSON.stringify({
        accessCode: event.data.accessCode,
        participantName: 'Demo Participant',
        participantEmail: 'participant@example.com',
      }),
    });

    assert(duplicateAttendance.status === 'success', 'Duplicate check-in should be handled safely.');

    const attendanceList = await request(baseUrl, `/api/attendance/events/${event.data.id}`, {
      headers: authHeaders,
    });

    assert(attendanceList.totalAttendance === 1, 'Attendance list should contain exactly one participant.');

    const csv = await request(baseUrl, `/api/attendance/export/${event.data.id}`, {
      headers: authHeaders,
    });

    assert(String(csv).includes('Name') && String(csv).includes('Email'), 'CSV export does not contain expected headers.');

    console.log('Smoke test passed: register -> login -> group -> event -> check-in -> export.');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await sequelize.close();

    for (const suffix of ['', '-journal']) {
      fs.rmSync(`${databasePath}${suffix}`, { force: true });
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

const { app, sequelize } = require('./app');
const { ensureDatabaseSchema } = require('./config/schema');

async function startServer() {
  const port = process.env.PORT || 3000;

  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: false });
    await ensureDatabaseSchema(sequelize);

    const server = app.listen(port, () => {
      console.log(`PresenceBoard is running on http://localhost:${port}`);
    });

    return server;
  } catch (error) {
    console.error('Failed to start PresenceBoard:', error);
    process.exitCode = 1;
    throw error;
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };

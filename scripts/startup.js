const { spawn } = require('child_process');
const ensureDatabaseSetup = require('./ensure-database-setup');

async function startup() {
  console.log('🚀 Starting DashboardPro...');
  console.log('📋 Checking database setup...');

  try {
    // Ensure database is properly set up
    await ensureDatabaseSetup();
    console.log('✅ Database setup verified');

    // Start the development server
    console.log('🌐 Starting development server...');
    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });

    devProcess.on('error', (error) => {
      console.error('❌ Failed to start development server:', error);
      process.exit(1);
    });

    devProcess.on('exit', (code) => {
      console.log(`📱 Development server exited with code ${code}`);
      process.exit(code);
    });

  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
}

// Run startup
if (require.main === module) {
  startup();
}

module.exports = startup;

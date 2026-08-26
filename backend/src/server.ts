import http from 'http';
import app from './app';
import { config } from './config';
import { initSocketServer } from './services/socket';
import { ensureStorageDirs } from './services/fileStorage';

ensureStorageDirs();

const server = http.createServer(app);

// Initialize real-time Socket.io server
initSocketServer(server);

const PORT = config.PORT;

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 ${config.COLLEGE_NAME} - Backend Server`);
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`🛡️  Allowed College Domain: @${config.COLLEGE_EMAIL_DOMAIN}`);
  console.log(`📁 File Storage: ${config.STORAGE_DIR}`);
  console.log(`⚡ WebSocket / Socket.io: READY`);
  console.log(`=======================================================`);
});

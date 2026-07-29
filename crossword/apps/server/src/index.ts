import 'dotenv/config';
import http from 'node:http';
import { Server } from 'socket.io';

import { createApp } from './app.js';
import { registerSocketGateway } from './game/socketGateway.js';
import { startNotificationCron } from './notifications/cron.js';

const PORT = Number(process.env.PORT ?? 4000);
const CORS_ORIGIN = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((s) => s.trim());

const app = createApp();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, credentials: true },
});

registerSocketGateway(io);
startNotificationCron();

httpServer.listen(PORT, () => {
  console.log(`[server] listening on :${PORT}`);
});

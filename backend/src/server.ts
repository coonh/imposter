import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerLobbyHandlers } from './handlers/lobby.handler';
import { registerGameHandlers } from './handlers/game.handler';
import { startCleanupInterval } from './services/lobby.service';

const app = express();
const httpServer = createServer(app);

const allowedOrigins = process.env['FRONTEND_URL'] ? process.env['FRONTEND_URL'].split(',') : ['http://localhost:4200'];

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
    },
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    registerLobbyHandlers(io, socket);
    registerGameHandlers(io, socket);

    socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env['PORT'] || 3000;

httpServer.listen(PORT, () => {
    console.log(`[Server] Imposter Game backend running on http://localhost:${PORT}`);
    startCleanupInterval();
});

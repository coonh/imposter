import { Server, Socket } from 'socket.io';
import * as lobbyService from '../services/lobby.service';

// Track which socket belongs to which player/lobby
const socketMap = new Map<string, { playerId: string; lobbyCode: string }>();

export function registerLobbyHandlers(io: Server, socket: Socket): void {
    socket.on('lobby:create', (data: { playerName: string; character: 'man' | 'woman' }, callback) => {
        try {
            const { lobby, player } = lobbyService.createLobby(data.playerName, data.character);
            socketMap.set(socket.id, { playerId: player.id, lobbyCode: lobby.code });

            socket.join(lobby.code);

            if (typeof callback === 'function') {
                callback({ success: true, lobby, player });
            }

            io.to(lobby.code).emit('lobby:updated', { lobby });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            if (typeof callback === 'function') {
                callback({ success: false, error: message });
            }
        }
    });

    socket.on('lobby:join', (data: { lobbyCode: string; playerName: string; character: 'man' | 'woman' }, callback) => {
        try {
            const { lobby, player } = lobbyService.joinLobby(data.lobbyCode, data.playerName, data.character);
            socketMap.set(socket.id, { playerId: player.id, lobbyCode: lobby.code });

            socket.join(lobby.code);

            if (typeof callback === 'function') {
                callback({ success: true, lobby, player });
            }

            io.to(lobby.code).emit('lobby:playerJoined', {
                player,
                players: lobby.players,
            });
            io.to(lobby.code).emit('lobby:updated', { lobby });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            if (typeof callback === 'function') {
                callback({ success: false, error: message });
            }
        }
    });

    socket.on('lobby:leave', (_data, callback) => {
        handlePlayerLeave(io, socket);
        if (typeof callback === 'function') {
            callback({ success: true });
        }
    });

    socket.on('disconnect', () => {
        handlePlayerLeave(io, socket);
    });
}

function handlePlayerLeave(io: Server, socket: Socket): void {
    const mapping = socketMap.get(socket.id);
    if (!mapping) return;

    const { playerId, lobbyCode } = mapping;
    const lobby = lobbyService.removePlayer(lobbyCode, playerId);
    socketMap.delete(socket.id);
    socket.leave(lobbyCode);

    if (lobby) {
        io.to(lobbyCode).emit('lobby:playerLeft', {
            playerId,
            players: lobby.players,
        });
        io.to(lobbyCode).emit('lobby:updated', { lobby });
    }
}

export function getSocketMap(): Map<string, { playerId: string; lobbyCode: string }> {
    return socketMap;
}

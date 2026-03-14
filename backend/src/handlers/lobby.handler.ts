import { Server, Socket } from 'socket.io';
import * as lobbyService from '../services/lobby.service';
import { Lobby } from '../models/lobby.model';

// Track which socket belongs to which player/lobby
const socketMap = new Map<string, { playerId: string; lobbyCode: string }>();

// Grace period timers for disconnected players (playerId → timer)
const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
const DISCONNECT_GRACE_MS = 2 * 60 * 1000; // 2 minutes

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

    socket.on('lobby:rejoin', (data: { lobbyCode: string; playerId: string }, callback) => {
        try {
            const lobby = lobbyService.getLobby(data.lobbyCode);
            if (!lobby) {
                throw new Error('Lobby no longer exists');
            }

            const player = lobby.players.find((p) => p.id === data.playerId);
            if (!player) {
                throw new Error('Player no longer in lobby');
            }

            // Cancel any pending disconnect timer for this player
            const existingTimer = disconnectTimers.get(data.playerId);
            if (existingTimer) {
                clearTimeout(existingTimer);
                disconnectTimers.delete(data.playerId);
                console.log(`[Rejoin] Cancelled disconnect timer for player ${player.name} (${data.playerId})`);
            }

            // Remove old socket mapping for this player (if any)
            for (const [oldSocketId, mapping] of socketMap.entries()) {
                if (mapping.playerId === data.playerId) {
                    socketMap.delete(oldSocketId);
                }
            }

            // Map new socket to player
            socketMap.set(socket.id, { playerId: data.playerId, lobbyCode: data.lobbyCode });
            socket.join(data.lobbyCode);

            lobbyService.touchActivity(data.lobbyCode);

            console.log(`[Rejoin] Player ${player.name} rejoined lobby ${data.lobbyCode}`);

            if (typeof callback === 'function') {
                callback({ success: true, lobby, player });
            }

            // Restore GameService state for the rejoining client if a game is active
            if (lobby.gameState) {
                // Determine word assignment payload
                const payload = player.isImposter
                    ? { isImposter: true, category: lobby.gameState.category, word: null }
                    : { isImposter: false, category: '', word: lobby.gameState.word };

                // Emitting specifically to the re-joining socket, not the whole room
                io.to(socket.id).emit('game:phaseChanged', { phase: lobby.gameState.phase });
                io.to(socket.id).emit('game:wordAssigned', payload);

                // If in voting phase or later, optionally restore vote counts here, 
                // but the phase change handles the UI routing correctly.
                if (lobby.gameState.phase === 'VOTING') {
                    const voteCounts: Record<string, number> = {};
                    for (const targetId of Object.values(lobby.gameState.votes)) {
                        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
                    }
                    const votedCount = lobby.players.filter((p) => p.hasVoted).length;
                    io.to(socket.id).emit('game:voteUpdate', {
                        votedCount,
                        totalPlayers: lobby.players.length,
                        voteCounts,
                    });
                }
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            if (typeof callback === 'function') {
                callback({ success: false, error: message });
            }
        }
    });

    socket.on('lobby:setGameLanguage', (data: { lobbyCode: string; language: string }, callback) => {
        try {
            const lobby = lobbyService.getLobby(data.lobbyCode);
            if (!lobby) {
                throw new Error('Lobby not found');
            }

            const mapping = socketMap.get(socket.id);
            if (!mapping || lobby.hostId !== mapping.playerId) {
                throw new Error('Only the host can change the game language');
            }

            if (data.language !== 'en' && data.language !== 'de') {
                throw new Error('Invalid language');
            }

            lobby.gameLanguage = data.language;
            lobbyService.touchActivity(data.lobbyCode);

            if (typeof callback === 'function') {
                callback({ success: true });
            }

            io.to(lobby.code).emit('lobby:updated', { lobby });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            if (typeof callback === 'function') {
                callback({ success: false, error: message });
            }
        }
    });

    socket.on('lobby:leave', (_data, callback) => {
        handlePlayerLeave(io, socket, false);
        if (typeof callback === 'function') {
            callback({ success: true });
        }
    });

    socket.on('disconnect', () => {
        handlePlayerLeave(io, socket, true);
    });
}

function handlePlayerLeave(io: Server, socket: Socket, isDisconnect: boolean): void {
    const mapping = socketMap.get(socket.id);
    if (!mapping) return;

    const { playerId, lobbyCode } = mapping;
    socketMap.delete(socket.id);
    socket.leave(lobbyCode);

    if (isDisconnect) {
        // Start grace period — player has 2 minutes to reconnect
        console.log(`[Disconnect] Player ${playerId} disconnected from lobby ${lobbyCode}. Starting ${DISCONNECT_GRACE_MS / 1000}s grace period.`);

        const timer = setTimeout(() => {
            disconnectTimers.delete(playerId);
            console.log(`[Disconnect] Grace period expired for player ${playerId}. Removing from lobby ${lobbyCode}.`);
            const lobby = lobbyService.removePlayer(lobbyCode, playerId);
            if (lobby) {
                io.to(lobbyCode).emit('lobby:playerLeft', {
                    playerId,
                    players: lobby.players,
                });
                io.to(lobbyCode).emit('lobby:updated', { lobby });
            }
        }, DISCONNECT_GRACE_MS);

        disconnectTimers.set(playerId, timer);
    } else {
        // Intentional leave — remove immediately
        const lobby = lobbyService.removePlayer(lobbyCode, playerId);
        if (lobby) {
            io.to(lobbyCode).emit('lobby:playerLeft', {
                playerId,
                players: lobby.players,
            });
            io.to(lobbyCode).emit('lobby:updated', { lobby });
        }
    }
}

export function getSocketMap(): Map<string, { playerId: string; lobbyCode: string }> {
    return socketMap;
}

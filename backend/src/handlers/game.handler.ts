import { Server, Socket } from 'socket.io';
import * as lobbyService from '../services/lobby.service';
import * as gameService from '../services/game.service';
import { GamePhase } from '../models/game.model';
import { getSocketMap } from './lobby.handler';

export function registerGameHandlers(io: Server, socket: Socket): void {
    socket.on('game:start', (data: { lobbyCode: string }, callback) => {
        try {
            const lobby = lobbyService.getLobby(data.lobbyCode);
            if (!lobby) throw new Error('Lobby not found');

            const mapping = getSocketMap().get(socket.id);
            if (!mapping || mapping.playerId !== lobby.hostId) {
                throw new Error('Only the host can start the game');
            }

            if (lobby.players.length < 3) {
                throw new Error('Need at least 3 players to start');
            }

            gameService.startGame(lobby);

            // Send word info individually to each player
            for (const [socketId, socketMapping] of getSocketMap().entries()) {
                if (socketMapping.lobbyCode === lobby.code) {
                    const player = lobby.players.find((p) => p.id === socketMapping.playerId);
                    if (player && lobby.gameState) {
                        const payload = player.isImposter
                            ? { isImposter: true, category: lobby.gameState.category, word: null }
                            : { isImposter: false, category: '', word: lobby.gameState.word };

                        io.to(socketId).emit('game:wordAssigned', payload);
                    }
                }
            }

            io.to(lobby.code).emit('game:phaseChanged', { phase: GamePhase.WORD_REVEAL });
            io.to(lobby.code).emit('lobby:updated', { lobby });

            if (typeof callback === 'function') {
                callback({ success: true });
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            if (typeof callback === 'function') {
                callback({ success: false, error: message });
            }
        }
    });

    socket.on('game:requestVote', (data: { lobbyCode: string }, callback) => {
        try {
            const lobby = lobbyService.getLobby(data.lobbyCode);
            if (!lobby) throw new Error('Lobby not found');

            const mapping = getSocketMap().get(socket.id);
            if (!mapping || mapping.playerId !== lobby.hostId) {
                throw new Error('Only the host can start voting');
            }

            gameService.setPhase(lobby, GamePhase.VOTING);

            io.to(lobby.code).emit('game:voteStarted', {});
            io.to(lobby.code).emit('game:phaseChanged', { phase: GamePhase.VOTING });
            io.to(lobby.code).emit('lobby:updated', { lobby });

            if (typeof callback === 'function') {
                callback({ success: true });
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            if (typeof callback === 'function') {
                callback({ success: false, error: message });
            }
        }
    });

    socket.on('game:readyForVote', (data: { lobbyCode: string }, callback) => {
        try {
            const lobby = lobbyService.getLobby(data.lobbyCode);
            if (!lobby) throw new Error('Lobby not found');

            const mapping = getSocketMap().get(socket.id);
            if (!mapping) throw new Error('Player not in lobby');

            const player = lobby.players.find(p => p.id === mapping.playerId);
            if (!player) throw new Error('Player not found');

            player.isReadyForVote = true;

            const readyCount = lobby.players.filter(p => p.isReadyForVote).length;
            const threshold = Math.floor(lobby.players.length / 2) + 1;

            if (readyCount >= threshold) {
                gameService.setPhase(lobby, GamePhase.VOTING);
                io.to(lobby.code).emit('game:voteStarted', {});
                io.to(lobby.code).emit('game:phaseChanged', { phase: GamePhase.VOTING });
            }

            io.to(lobby.code).emit('lobby:updated', { lobby });

            if (typeof callback === 'function') {
                callback({ success: true, readyCount, threshold });
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            if (typeof callback === 'function') {
                callback({ success: false, error: message });
            }
        }
    });

    socket.on('game:vote', (data: { lobbyCode: string; voterId: string; targetId: string }, callback) => {
        try {
            const lobby = lobbyService.getLobby(data.lobbyCode);
            if (!lobby) throw new Error('Lobby not found');

            const allVoted = gameService.submitVote(lobby, data.voterId, data.targetId);

            // Notify all players about the vote count
            const votedCount = lobby.players.filter((p) => p.hasVoted).length;
            io.to(lobby.code).emit('game:voteUpdate', {
                votedCount,
                totalPlayers: lobby.players.length,
            });

            if (allVoted) {
                const result = gameService.tallyVotes(lobby);

                if (result.isMajorityCorrect) {
                    // Imposter was caught — give them a chance to guess
                    gameService.setPhase(lobby, GamePhase.IMPOSTER_GUESS);
                    io.to(lobby.code).emit('game:voteResult', result);
                    io.to(lobby.code).emit('game:phaseChanged', { phase: GamePhase.IMPOSTER_GUESS });
                } else {
                    // Imposter wins
                    const finalResult = gameService.getImposterWinsResult(lobby);
                    io.to(lobby.code).emit('game:voteResult', result);
                    io.to(lobby.code).emit('game:finalResult', finalResult);
                    io.to(lobby.code).emit('game:phaseChanged', { phase: GamePhase.RESULT });
                }

                io.to(lobby.code).emit('lobby:updated', { lobby });
            }

            if (typeof callback === 'function') {
                callback({ success: true });
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            if (typeof callback === 'function') {
                callback({ success: false, error: message });
            }
        }
    });

    socket.on('game:imposterGuess', (data: { lobbyCode: string; isCorrect: boolean }, callback) => {
        try {
            const lobby = lobbyService.getLobby(data.lobbyCode);
            if (!lobby) throw new Error('Lobby not found');

            const mapping = getSocketMap().get(socket.id);
            if (!mapping || !lobby.gameState || mapping.playerId !== lobby.gameState.imposterId) {
                throw new Error('Only the imposter can guess');
            }

            const result = gameService.imposterGuess(lobby, data.isCorrect);

            io.to(lobby.code).emit('game:finalResult', result);
            io.to(lobby.code).emit('game:phaseChanged', { phase: GamePhase.RESULT });
            io.to(lobby.code).emit('lobby:updated', { lobby });

            if (typeof callback === 'function') {
                callback({ success: true, result });
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            if (typeof callback === 'function') {
                callback({ success: false, error: message });
            }
        }
    });

    socket.on('game:newRound', (data: { lobbyCode: string }, callback) => {
        try {
            const lobby = lobbyService.getLobby(data.lobbyCode);
            if (!lobby) throw new Error('Lobby not found');

            const mapping = getSocketMap().get(socket.id);
            if (!mapping || mapping.playerId !== lobby.hostId) {
                throw new Error('Only the host can start a new round');
            }

            gameService.startGame(lobby);

            // Send word info individually to each player
            for (const [socketId, socketMapping] of getSocketMap().entries()) {
                if (socketMapping.lobbyCode === lobby.code) {
                    const player = lobby.players.find((p) => p.id === socketMapping.playerId);
                    if (player && lobby.gameState) {
                        const payload = player.isImposter
                            ? { isImposter: true, category: lobby.gameState.category, word: null }
                            : { isImposter: false, category: '', word: lobby.gameState.word };

                        io.to(socketId).emit('game:wordAssigned', payload);
                    }
                }
            }

            io.to(lobby.code).emit('game:phaseChanged', { phase: GamePhase.WORD_REVEAL });
            io.to(lobby.code).emit('lobby:updated', { lobby });

            if (typeof callback === 'function') {
                callback({ success: true });
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            if (typeof callback === 'function') {
                callback({ success: false, error: message });
            }
        }
    });

    socket.on('game:backToLobby', (data: { lobbyCode: string }, callback) => {
        try {
            const lobby = lobbyService.getLobby(data.lobbyCode);
            if (!lobby) throw new Error('Lobby not found');

            gameService.resetToLobby(lobby);

            io.to(lobby.code).emit('game:phaseChanged', { phase: null });
            io.to(lobby.code).emit('lobby:updated', { lobby });

            if (typeof callback === 'function') {
                callback({ success: true });
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            if (typeof callback === 'function') {
                callback({ success: false, error: message });
            }
        }
    });
}

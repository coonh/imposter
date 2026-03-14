import { v4 as uuidv4 } from 'uuid';
import { Lobby } from '../models/lobby.model';
import { Player } from '../models/player.model';

const MAX_LOBBIES = 100;
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const lobbies = new Map<string, Lobby>();

function generateLobbyCode(): string {
    let code: string;
    do {
        code = Math.floor(1000 + Math.random() * 9000).toString();
    } while (lobbies.has(code));
    return code;
}

export function createLobby(playerName: string, character: 'man' | 'woman'): { lobby: Lobby; player: Player } {
    if (lobbies.size >= MAX_LOBBIES) {
        throw new Error('Server is at capacity. Please try again later.');
    }

    const code = generateLobbyCode();
    const player: Player = {
        id: uuidv4(),
        name: playerName,
        character,
        isHost: true,
        isImposter: false,
        hasVoted: false,
    };

    const lobby: Lobby = {
        code,
        players: [player],
        hostId: player.id,
        status: 'waiting',
        gameLanguage: 'en',
        lastActivity: Date.now(),
    };

    lobbies.set(code, lobby);
    return { lobby, player };
}

export function joinLobby(code: string, playerName: string, character: 'man' | 'woman'): { lobby: Lobby; player: Player } {
    const lobby = lobbies.get(code);

    if (!lobby) {
        throw new Error('Lobby not found');
    }

    if (lobby.status === 'playing') {
        throw new Error('Game already in progress');
    }

    const duplicateName = lobby.players.find(
        (p) => p.name.toLowerCase() === playerName.toLowerCase()
    );
    if (duplicateName) {
        throw new Error('Username already taken in this lobby');
    }

    const player: Player = {
        id: uuidv4(),
        name: playerName,
        character,
        isHost: false,
        isImposter: false,
        hasVoted: false,
    };

    lobby.players.push(player);
    lobby.lastActivity = Date.now();
    return { lobby, player };
}

export function getLobby(code: string): Lobby | undefined {
    return lobbies.get(code);
}

export function touchActivity(code: string): void {
    const lobby = lobbies.get(code);
    if (lobby) {
        lobby.lastActivity = Date.now();
    }
}

export function getLobbyCount(): number {
    return lobbies.size;
}

export function removePlayer(code: string, playerId: string): Lobby | null {
    const lobby = lobbies.get(code);
    if (!lobby) return null;

    lobby.players = lobby.players.filter((p) => p.id !== playerId);

    if (lobby.players.length === 0) {
        lobbies.delete(code);
        return null;
    }

    // Transfer host if host left
    if (lobby.hostId === playerId) {
        const newHost = lobby.players[0];
        if (newHost) {
            newHost.isHost = true;
            lobby.hostId = newHost.id;
        }
    }

    return lobby;
}

export function removeLobby(code: string): void {
    lobbies.delete(code);
}

export function findLobbyByPlayerId(playerId: string): Lobby | undefined {
    for (const lobby of lobbies.values()) {
        if (lobby.players.some((p) => p.id === playerId)) {
            return lobby;
        }
    }
    return undefined;
}

export function cleanupInactiveLobbies(): number {
    const now = Date.now();
    let removed = 0;
    for (const [code, lobby] of lobbies.entries()) {
        if (now - lobby.lastActivity > INACTIVITY_TIMEOUT_MS) {
            lobbies.delete(code);
            removed++;
            console.log(`[Cleanup] Removed inactive lobby ${code} (inactive for ${Math.round((now - lobby.lastActivity) / 60000)}min)`);
        }
    }
    return removed;
}

export function startCleanupInterval(): void {
    setInterval(() => {
        const removed = cleanupInactiveLobbies();
        if (removed > 0) {
            console.log(`[Cleanup] Removed ${removed} inactive lobbies. Active: ${lobbies.size}`);
        }
    }, CLEANUP_INTERVAL_MS);
    console.log('[Cleanup] Inactive lobby cleanup scheduled (every 5 minutes, 30-minute timeout)');
}

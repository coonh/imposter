import { v4 as uuidv4 } from 'uuid';
import { Lobby } from '../models/lobby.model';
import { Player } from '../models/player.model';

const lobbies = new Map<string, Lobby>();

function generateLobbyCode(): string {
    let code: string;
    do {
        code = Math.floor(1000 + Math.random() * 9000).toString();
    } while (lobbies.has(code));
    return code;
}

export function createLobby(playerName: string): { lobby: Lobby; player: Player } {
    const code = generateLobbyCode();
    const player: Player = {
        id: uuidv4(),
        name: playerName,
        isHost: true,
        isImposter: false,
        hasVoted: false,
    };

    const lobby: Lobby = {
        code,
        players: [player],
        hostId: player.id,
        status: 'waiting',
    };

    lobbies.set(code, lobby);
    return { lobby, player };
}

export function joinLobby(code: string, playerName: string): { lobby: Lobby; player: Player } {
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
        isHost: false,
        isImposter: false,
        hasVoted: false,
    };

    lobby.players.push(player);
    return { lobby, player };
}

export function getLobby(code: string): Lobby | undefined {
    return lobbies.get(code);
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

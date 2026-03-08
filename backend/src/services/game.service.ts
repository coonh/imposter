import { Lobby } from '../models/lobby.model';
import { GamePhase, GameState, VoteResult, FinalResult, WordEntry } from '../models/game.model';
import words from '../data/words.json';

const wordBank: WordEntry[] = words;

export function startGame(lobby: Lobby): void {
    // Pick random word
    const entry = wordBank[Math.floor(Math.random() * wordBank.length)];

    // Pick random imposter
    const imposterIndex = Math.floor(Math.random() * lobby.players.length);
    const imposterId = lobby.players[imposterIndex].id;

    // Pick random start player
    const startPlayerIndex = Math.floor(Math.random() * lobby.players.length);
    const startPlayerId = lobby.players[startPlayerIndex].id;

    // Reset all players
    for (const player of lobby.players) {
        player.isImposter = player.id === imposterId;
        player.hasVoted = false;
        player.votedFor = undefined;
        player.isReadyForVote = false;
    }

    const round = lobby.gameState ? lobby.gameState.round + 1 : 1;

    lobby.gameState = {
        word: entry.word,
        category: entry.category,
        imposterId,
        startPlayerId,
        phase: GamePhase.WORD_REVEAL,
        votes: {},
        round,
    };

    lobby.status = 'playing';
}

export function setPhase(lobby: Lobby, phase: GamePhase): void {
    if (!lobby.gameState) {
        throw new Error('No active game');
    }
    lobby.gameState.phase = phase;

    // Reset votes when entering voting phase
    if (phase === GamePhase.VOTING) {
        lobby.gameState.votes = {};
        for (const player of lobby.players) {
            player.hasVoted = false;
            player.votedFor = undefined;
        }
    }
}

export function submitVote(lobby: Lobby, voterId: string, targetId: string): boolean {
    if (!lobby.gameState) {
        throw new Error('No active game');
    }

    if (lobby.gameState.phase !== GamePhase.VOTING) {
        throw new Error('Not in voting phase');
    }

    if (voterId === targetId) {
        throw new Error('Cannot vote for yourself');
    }

    const voter = lobby.players.find((p) => p.id === voterId);
    if (!voter) {
        throw new Error('Voter not found');
    }

    if (voter.hasVoted) {
        throw new Error('Already voted');
    }

    voter.hasVoted = true;
    voter.votedFor = targetId;
    lobby.gameState.votes[voterId] = targetId;

    // Check if all players have voted
    const allVoted = lobby.players.every((p) => p.hasVoted);
    return allVoted;
}

export function tallyVotes(lobby: Lobby): VoteResult {
    if (!lobby.gameState) {
        throw new Error('No active game');
    }

    const voteCounts: Record<string, number> = {};
    for (const targetId of Object.values(lobby.gameState.votes)) {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    }

    // Find player with most votes
    let maxVotes = 0;
    let caughtPlayerId = '';
    for (const [playerId, count] of Object.entries(voteCounts)) {
        if (count > maxVotes) {
            maxVotes = count;
            caughtPlayerId = playerId;
        }
    }

    // Check for tie (imposter wins on tie)
    const playersWithMaxVotes = Object.entries(voteCounts).filter(
        ([, count]) => count === maxVotes
    );

    const isTie = playersWithMaxVotes.length > 1;
    const isMajorityCorrect = !isTie && caughtPlayerId === lobby.gameState.imposterId;

    return {
        votes: lobby.gameState.votes,
        caughtPlayerId: isTie ? '' : caughtPlayerId,
        isMajorityCorrect,
        voteCounts,
    };
}

export function imposterGuess(lobby: Lobby, isCorrect: boolean): FinalResult {
    if (!lobby.gameState) {
        throw new Error('No active game');
    }

    const imposter = lobby.players.find((p) => p.id === lobby.gameState!.imposterId);

    const result: FinalResult = {
        winner: isCorrect ? 'imposter' : 'players',
        imposterGuessCorrect: isCorrect,
        imposterId: lobby.gameState.imposterId,
        imposterName: imposter?.name ?? 'Unknown',
        word: lobby.gameState.word,
    };

    lobby.gameState.phase = GamePhase.RESULT;
    return result;
}

export function getImposterWinsResult(lobby: Lobby): FinalResult {
    if (!lobby.gameState) {
        throw new Error('No active game');
    }

    const imposter = lobby.players.find((p) => p.id === lobby.gameState!.imposterId);

    const result: FinalResult = {
        winner: 'imposter',
        imposterId: lobby.gameState.imposterId,
        imposterName: imposter?.name ?? 'Unknown',
        word: lobby.gameState.word,
    };

    lobby.gameState.phase = GamePhase.RESULT;
    return result;
}

export function resetToLobby(lobby: Lobby): void {
    lobby.status = 'waiting';
    lobby.gameState = undefined;
    for (const player of lobby.players) {
        player.isImposter = false;
        player.hasVoted = false;
        player.votedFor = undefined;
    }
}

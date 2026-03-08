export enum GamePhase {
    WORD_REVEAL = 'WORD_REVEAL',
    VOTING = 'VOTING',
    IMPOSTER_GUESS = 'IMPOSTER_GUESS',
    RESULT = 'RESULT',
}

export interface GameState {
    word: string;
    category: string;
    imposterId: string;
    startPlayerId: string;
    phase: GamePhase;
    votes: Record<string, string>; // voterId → targetId
    round: number;
}

export interface WordEntry {
    word: string;
    category: string;
}

export interface VoteResult {
    votes: Record<string, string>;
    caughtPlayerId: string;
    isMajorityCorrect: boolean;
    voteCounts: Record<string, number>;
}

export interface FinalResult {
    winner: 'imposter' | 'players';
    imposterGuessCorrect?: boolean;
    imposterId: string;
    imposterName: string;
    word: string;
}

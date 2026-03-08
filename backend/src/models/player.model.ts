export interface Player {
    id: string;
    name: string;
    character: 'man' | 'woman';
    isHost: boolean;
    isImposter: boolean;
    hasVoted: boolean;
    votedFor?: string;
    isReadyForVote?: boolean;
}

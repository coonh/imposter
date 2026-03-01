export interface Player {
    id: string;
    name: string;
    isHost: boolean;
    isImposter: boolean;
    hasVoted: boolean;
    votedFor?: string;
}

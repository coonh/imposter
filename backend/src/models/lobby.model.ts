import { Player } from './player.model';
import { GameState } from './game.model';

export type LobbyStatus = 'waiting' | 'playing';

export interface Lobby {
    code: string;
    players: Player[];
    hostId: string;
    status: LobbyStatus;
    gameState?: GameState;
}

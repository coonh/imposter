import { Player } from './player.model';
import { GameState } from './game.model';

export type LobbyStatus = 'waiting' | 'playing';

export type GameLanguage = 'en' | 'de';

export interface Lobby {
    code: string;
    players: Player[];
    hostId: string;
    status: LobbyStatus;
    gameLanguage: GameLanguage;
    gameState?: GameState;
    lastActivity: number;
}

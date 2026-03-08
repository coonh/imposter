import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { LobbyService } from '../../core/services/lobby.service';
import { GameService } from '../../core/services/game.service';
import { PlayerList } from './player-list/player-list';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
    selector: 'app-lobby',
    standalone: true,
    imports: [PlayerList, IconComponent],
    templateUrl: './lobby.html',
    styleUrl: './lobby.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lobby {
    private readonly lobbyService = inject(LobbyService);
    private readonly gameService = inject(GameService);

    readonly lobby = this.lobbyService.lobby;
    readonly players = this.lobbyService.players;
    readonly lobbyCode = this.lobbyService.lobbyCode;
    readonly isHost = this.lobbyService.isHost;
    readonly playerCount = this.lobbyService.playerCount;
    readonly canStart = computed(() => this.isHost() && this.playerCount() >= 3);

    startGame(): void {
        this.gameService.startGame();
    }

    leaveLobby(): void {
        this.lobbyService.leaveLobby();
    }

    copyCode(): void {
        navigator.clipboard.writeText(this.lobbyCode());
    }
}

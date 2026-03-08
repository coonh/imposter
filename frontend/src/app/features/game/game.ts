import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { GameService } from '../../core/services/game.service';
import { LobbyService } from '../../core/services/lobby.service';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
    selector: 'app-game',
    standalone: true,
    imports: [IconComponent],
    templateUrl: './game.html',
    styleUrl: './game.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Game {
    private readonly gameService = inject(GameService);
    private readonly lobbyService = inject(LobbyService);

    readonly wordAssignment = this.gameService.wordAssignment;
    readonly isHost = this.lobbyService.isHost;
    readonly currentPlayer = this.lobbyService.currentPlayer;
    readonly lobby = this.lobbyService.lobby;
    readonly players = this.lobbyService.players;
    readonly revealed = signal(false);

    readonly isImposter = computed(() => this.wordAssignment()?.isImposter ?? false);
    readonly word = computed(() => this.wordAssignment()?.word ?? '');
    readonly category = computed(() => this.wordAssignment()?.category ?? '');

    readonly startPlayer = computed(() => {
        const state = this.lobby()?.gameState;
        if (!state) return null;
        return this.players().find((p) => p.id === state.startPlayerId) || null;
    });

    readonly isStartPlayer = computed(() => {
        const cp = this.currentPlayer();
        const sp = this.startPlayer();
        return !!cp && !!sp && cp.id === sp.id;
    });

    readonly isReadyForVote = computed(() => {
        return this.currentPlayer()?.isReadyForVote ?? false;
    });

    readonly readyCount = computed(() => {
        return this.players().filter((p) => p.isReadyForVote).length;
    });

    readonly readyThreshold = computed(() => {
        const count = this.players().length;
        return Math.floor(count / 2) + 1;
    });

    toggleReveal(): void {
        this.revealed.set(!this.revealed());
    }

    readyForVote(): void {
        this.gameService.readyForVote();
    }
}

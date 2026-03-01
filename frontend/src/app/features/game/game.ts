import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { GameService } from '../../core/services/game.service';
import { LobbyService } from '../../core/services/lobby.service';

@Component({
    selector: 'app-game',
    standalone: true,
    templateUrl: './game.html',
    styleUrl: './game.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Game {
    private readonly gameService = inject(GameService);
    private readonly lobbyService = inject(LobbyService);

    readonly wordAssignment = this.gameService.wordAssignment;
    readonly isHost = this.lobbyService.isHost;
    readonly revealed = signal(false);

    readonly isImposter = computed(() => this.wordAssignment()?.isImposter ?? false);
    readonly word = computed(() => this.wordAssignment()?.word ?? '');
    readonly category = computed(() => this.wordAssignment()?.category ?? '');

    toggleReveal(): void {
        this.revealed.set(!this.revealed());
    }

    startVoting(): void {
        this.gameService.requestVote();
    }
}

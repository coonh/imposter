import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';

import { GameService } from '../../core/services/game.service';
import { LobbyService } from '../../core/services/lobby.service';
import { GamePhase } from '../../core/models/game.model';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
    selector: 'app-voting',
    standalone: true,
    imports: [IconComponent],
    templateUrl: './voting.html',
    styleUrl: './voting.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Voting {
    private readonly gameService = inject(GameService);
    private readonly lobbyService = inject(LobbyService);

    readonly players = this.lobbyService.players;
    readonly currentPlayer = this.lobbyService.currentPlayer;
    readonly isHost = this.lobbyService.isHost;
    readonly gamePhase = this.gameService.gamePhase;
    readonly voteResult = this.gameService.voteResult;
    readonly finalResult = this.gameService.finalResult;
    readonly hasVoted = this.gameService.hasVoted;
    readonly votedCount = this.gameService.votedCount;
    readonly totalPlayers = this.gameService.totalPlayers;
    readonly wordAssignment = this.gameService.wordAssignment;
    readonly voteCounts = this.gameService.voteCounts;

    readonly selectedTarget = signal<string | null>(null);

    readonly phase = GamePhase;

    readonly liveVotes = computed(() => {
        const counts = this.voteCounts();
        const total = this.votedCount();

        return this.players().map(player => {
            const count = counts[player.id] || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;

            return {
                player,
                count,
                percentage
            };
        }).sort((a, b) => b.count - a.count);
    });

    readonly otherPlayers = computed(() => {
        const current = this.currentPlayer();
        return this.players().filter((p) => p.id !== current?.id);
    });

    readonly isImposter = computed(() => this.wordAssignment()?.isImposter ?? false);

    readonly showVoting = computed(() =>
        this.gamePhase() === GamePhase.VOTING && !this.voteResult()
    );

    readonly showResult = computed(() =>
        this.gamePhase() === GamePhase.RESULT || this.finalResult()
    );

    readonly showImposterGuess = computed(() =>
        this.gamePhase() === GamePhase.IMPOSTER_GUESS && this.isImposter() && !this.finalResult()
    );

    readonly showWaitingForGuess = computed(() =>
        this.gamePhase() === GamePhase.IMPOSTER_GUESS && !this.isImposter() && !this.finalResult()
    );

    selectTarget(playerId: string): void {
        if (this.hasVoted()) return;
        this.selectedTarget.set(playerId);
    }

    confirmVote(): void {
        const targetId = this.selectedTarget();
        if (!targetId) return;
        this.gameService.castVote(targetId);
    }

    submitGuess(isCorrect: boolean): void {
        this.gameService.submitGuess(isCorrect);
    }

    newRound(): void {
        this.selectedTarget.set(null);
        this.gameService.newRound();
    }

    backToLobby(): void {
        this.gameService.backToLobby();
    }
}

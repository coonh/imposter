import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService } from './socket.service';
import { LobbyService } from './lobby.service';
import { GamePhase, WordAssignment, VoteResult, FinalResult } from '../models/game.model';

interface GenericResponse {
    success: boolean;
    error?: string;
}

@Injectable({ providedIn: 'root' })
export class GameService {
    private readonly socket = inject(SocketService);
    private readonly lobbyService = inject(LobbyService);
    private readonly router = inject(Router);
    private listenersInitialized = false;

    readonly gamePhase = signal<GamePhase | null>(null);
    readonly wordAssignment = signal<WordAssignment | null>(null);
    readonly voteResult = signal<VoteResult | null>(null);
    readonly finalResult = signal<FinalResult | null>(null);
    readonly votedCount = signal(0);
    readonly totalPlayers = signal(0);
    readonly hasVoted = signal(false);
    readonly error = signal<string | null>(null);

    initListeners(): void {
        if (this.listenersInitialized) return;
        this.listenersInitialized = true;
        this.socket.on<WordAssignment>('game:wordAssigned', (data) => {
            this.wordAssignment.set(data);
        });

        this.socket.on<{ phase: GamePhase | null }>('game:phaseChanged', (data) => {
            this.gamePhase.set(data.phase);

            if (data.phase === GamePhase.WORD_REVEAL) {
                const code = this.lobbyService.lobbyCode();
                if (code) {
                    this.router.navigate(['/game', code]);
                }
            } else if (data.phase === GamePhase.VOTING) {
                const code = this.lobbyService.lobbyCode();
                if (code) {
                    this.router.navigate(['/vote', code]);
                }
            } else if (data.phase === null) {
                // back to lobby
                const code = this.lobbyService.lobbyCode();
                if (code) {
                    this.router.navigate(['/lobby', code]);
                }
            }
        });

        this.socket.on<{ votedCount: number; totalPlayers: number }>('game:voteUpdate', (data) => {
            this.votedCount.set(data.votedCount);
            this.totalPlayers.set(data.totalPlayers);
        });

        this.socket.on<VoteResult>('game:voteResult', (data) => {
            this.voteResult.set(data);
        });

        this.socket.on<FinalResult>('game:finalResult', (data) => {
            this.finalResult.set(data);
            this.gamePhase.set(GamePhase.RESULT);
        });
    }

    startGame(): void {
        this.error.set(null);
        this.resetRoundState();
        const code = this.lobbyService.lobbyCode();
        this.socket.emit('game:start', { lobbyCode: code }, (response: unknown) => {
            const res = response as GenericResponse;
            if (!res.success) {
                this.error.set(res.error ?? 'Failed to start game');
            }
        });
    }

    requestVote(): void {
        this.error.set(null);
        this.hasVoted.set(false);
        const code = this.lobbyService.lobbyCode();
        this.socket.emit('game:requestVote', { lobbyCode: code }, (response: unknown) => {
            const res = response as GenericResponse;
            if (!res.success) {
                this.error.set(res.error ?? 'Failed to start voting');
            }
        });
    }

    castVote(targetId: string): void {
        this.error.set(null);
        const code = this.lobbyService.lobbyCode();
        const voterId = this.lobbyService.currentPlayer()?.id;
        if (!voterId) return;

        this.socket.emit('game:vote', { lobbyCode: code, voterId, targetId }, (response: unknown) => {
            const res = response as GenericResponse;
            if (res.success) {
                this.hasVoted.set(true);
            } else {
                this.error.set(res.error ?? 'Failed to cast vote');
            }
        });
    }

    submitGuess(guess: string): void {
        this.error.set(null);
        const code = this.lobbyService.lobbyCode();
        this.socket.emit('game:imposterGuess', { lobbyCode: code, guess }, (response: unknown) => {
            const res = response as GenericResponse;
            if (!res.success) {
                this.error.set(res.error ?? 'Failed to submit guess');
            }
        });
    }

    newRound(): void {
        this.resetRoundState();
        const code = this.lobbyService.lobbyCode();
        this.socket.emit('game:newRound', { lobbyCode: code });
    }

    backToLobby(): void {
        this.resetRoundState();
        const code = this.lobbyService.lobbyCode();
        this.socket.emit('game:backToLobby', { lobbyCode: code });
    }

    private resetRoundState(): void {
        this.wordAssignment.set(null);
        this.voteResult.set(null);
        this.finalResult.set(null);
        this.hasVoted.set(false);
        this.votedCount.set(0);
        this.totalPlayers.set(0);
        this.error.set(null);
    }
}

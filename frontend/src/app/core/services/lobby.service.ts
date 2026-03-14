import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService } from './socket.service';
import { Lobby } from '../models/game.model';
import { Player } from '../models/player.model';
import { StorageService } from './storage.service';

interface LobbyResponse {
    success: boolean;
    lobby?: Lobby;
    player?: Player;
    error?: string;
}

@Injectable({ providedIn: 'root' })
export class LobbyService {
    private readonly socket = inject(SocketService);
    private readonly router = inject(Router);
    private readonly storage = inject(StorageService);
    private listenersInitialized = false;

    readonly lobby = signal<Lobby | null>(null);
    readonly currentPlayer = signal<Player | null>(null);
    readonly error = signal<string | null>(null);

    readonly players = computed(() => this.lobby()?.players ?? []);
    readonly lobbyCode = computed(() => this.lobby()?.code ?? '');
    readonly isHost = computed(() => {
        const player = this.currentPlayer();
        const lobby = this.lobby();
        return !!player && !!lobby && player.id === lobby.hostId;
    });
    readonly playerCount = computed(() => this.players().length);

    initListeners(): void {
        if (this.listenersInitialized) return;
        this.listenersInitialized = true;

        this.socket.on<{ lobby: Lobby }>('lobby:updated', (data) => {
            this.lobby.set(data.lobby);
            const current = this.currentPlayer();
            if (current && data.lobby) {
                const updated = data.lobby.players.find((p) => p.id === current.id);
                if (updated) {
                    this.currentPlayer.set(updated);
                }
            }
        });

        this.socket.on<{ playerId: string; players: Player[] }>('lobby:playerLeft', (data) => {
            const current = this.currentPlayer();
            if (current && data.playerId === current.id) {
                this.storage.clearSession();
                this.lobby.set(null);
                this.currentPlayer.set(null);
                this.router.navigate(['/']);
            }
        });
    }

    async createLobby(playerName: string, character: 'man' | 'woman'): Promise<void> {
        this.error.set(null);
        await this.socket.connect();
        this.initListeners();

        this.socket.emit('lobby:create', { playerName, character }, (response: unknown) => {
            const res = response as LobbyResponse;
            if (res.success && res.lobby && res.player) {
                this.lobby.set(res.lobby);
                this.currentPlayer.set(res.player);
                this.storage.saveSession({ lobbyCode: res.lobby.code, playerId: res.player.id });
                this.router.navigate(['/lobby', res.lobby.code]);
            } else {
                this.error.set(res.error ?? 'Failed to create lobby');
            }
        });
    }

    async joinLobby(code: string, playerName: string, character: 'man' | 'woman'): Promise<void> {
        this.error.set(null);
        await this.socket.connect();
        this.initListeners();

        this.socket.emit('lobby:join', { lobbyCode: code, playerName, character }, (response: unknown) => {
            const res = response as LobbyResponse;
            if (res.success && res.lobby && res.player) {
                this.lobby.set(res.lobby);
                this.currentPlayer.set(res.player);
                this.storage.saveSession({ lobbyCode: res.lobby.code, playerId: res.player.id });
                this.router.navigate(['/lobby', res.lobby.code]);
            } else {
                this.error.set(res.error ?? 'Failed to join lobby');
            }
        });
    }

    async rejoinSession(): Promise<boolean> {
        const session = this.storage.getSession();
        if (!session) return false;

        this.error.set(null);
        await this.socket.connect();
        this.initListeners();

        return new Promise<boolean>((resolve) => {
            this.socket.emit('lobby:rejoin', { lobbyCode: session.lobbyCode, playerId: session.playerId }, (response: unknown) => {
                const res = response as LobbyResponse;
                if (res.success && res.lobby && res.player) {
                    this.lobby.set(res.lobby);
                    this.currentPlayer.set(res.player);
                    resolve(true);
                } else {
                    this.storage.clearSession(); // Invalid session, clear it
                    resolve(false);
                }
            });
        });
    }

    leaveLobby(): void {
        this.socket.emit('lobby:leave', {});
        this.storage.clearSession();
        this.lobby.set(null);
        this.currentPlayer.set(null);
        this.listenersInitialized = false;
        this.router.navigate(['/']);
    }

    setGameLanguage(language: string): void {
        const lobby = this.lobby();
        if (!lobby) return;
        this.socket.emit('lobby:setGameLanguage', { lobbyCode: lobby.code, language });
    }
}

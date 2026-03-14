import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LobbyService } from '../../core/services/lobby.service';
import { GameService } from '../../core/services/game.service';
import { StorageService } from '../../core/services/storage.service';
import { PlayerList } from './player-list/player-list';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
    selector: 'app-lobby',
    standalone: true,
    imports: [PlayerList, IconComponent, TranslateModule],
    templateUrl: './lobby.html',
    styleUrl: './lobby.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lobby {
    private readonly lobbyService = inject(LobbyService);
    private readonly gameService = inject(GameService);
    private readonly storageService = inject(StorageService);

    readonly lobby = this.lobbyService.lobby;
    readonly players = this.lobbyService.players;
    readonly lobbyCode = this.lobbyService.lobbyCode;
    readonly isHost = this.lobbyService.isHost;
    readonly playerCount = this.lobbyService.playerCount;
    readonly canStart = computed(() => this.isHost() && this.playerCount() >= 3);

    readonly gameLanguage = computed(() => this.lobby()?.gameLanguage || 'en');

    constructor() {
        // If we're the host and we have a saved preference, restore it
        const savedLang = this.storageService.getPreferences().gameLanguage;
        if (savedLang) {
            // Need setTimeout to wait for signal to be ready
            setTimeout(() => {
                if (this.isHost() && this.gameLanguage() !== savedLang) {
                    this.setGameLanguage(savedLang);
                }
            });
        }
    }

    startGame(): void {
        this.gameService.startGame();
    }

    leaveLobby(): void {
        this.lobbyService.leaveLobby();
    }

    copyCode(): void {
        navigator.clipboard.writeText(this.lobbyCode());
    }

    setGameLanguage(lang: string): void {
        this.lobbyService.setGameLanguage(lang);
        this.storageService.savePreferences({
            ...this.storageService.getPreferences(),
            gameLanguage: lang as 'en' | 'de',
        } as any);
    }
}

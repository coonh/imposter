import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LobbyService } from '../../core/services/lobby.service';
import { GameService } from '../../core/services/game.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './home.html',
    styleUrl: './home.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
    private readonly lobbyService = inject(LobbyService);
    private readonly gameService = inject(GameService);

    readonly error = this.lobbyService.error;
    readonly activeTab = signal<'create' | 'join'>('create');

    readonly createName = signal('');
    readonly joinName = signal('');
    readonly joinCode = signal('');

    switchTab(tab: 'create' | 'join'): void {
        this.activeTab.set(tab);
    }

    async createLobby(): Promise<void> {
        const name = this.createName().trim();
        if (!name) return;
        this.gameService.initListeners();
        await this.lobbyService.createLobby(name);
    }

    async joinLobby(): Promise<void> {
        const name = this.joinName().trim();
        const code = this.joinCode().trim();
        if (!name || !code) return;
        this.gameService.initListeners();
        await this.lobbyService.joinLobby(code, name);
    }
}

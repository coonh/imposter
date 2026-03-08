import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LobbyService } from '../../core/services/lobby.service';
import { GameService } from '../../core/services/game.service';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [FormsModule, IconComponent],
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

    readonly createCharacter = signal<'man' | 'woman'>('man');
    readonly joinCharacter = signal<'man' | 'woman'>('man');

    selectCharacter(type: 'create' | 'join', character: 'man' | 'woman'): void {
        if (type === 'create') {
            this.createCharacter.set(character);
        } else {
            this.joinCharacter.set(character);
        }
    }

    switchTab(tab: 'create' | 'join'): void {
        this.activeTab.set(tab);
    }

    async createLobby(): Promise<void> {
        const name = this.createName().trim();
        if (!name) return;
        this.gameService.initListeners();
        await this.lobbyService.createLobby(name, this.createCharacter());
    }

    async joinLobby(): Promise<void> {
        const name = this.joinName().trim();
        const code = this.joinCode().trim();
        if (!name || !code) return;
        this.gameService.initListeners();
        await this.lobbyService.joinLobby(code, name, this.joinCharacter());
    }
}

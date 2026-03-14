import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LobbyService } from '../../core/services/lobby.service';
import { GameService } from '../../core/services/game.service';
import { StorageService } from '../../core/services/storage.service';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [FormsModule, IconComponent, TranslateModule],
    templateUrl: './home.html',
    styleUrl: './home.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
    private readonly lobbyService = inject(LobbyService);
    private readonly gameService = inject(GameService);
    private readonly storageService = inject(StorageService);
    private readonly translate = inject(TranslateService);

    readonly error = this.lobbyService.error;
    readonly activeTab = signal<'create' | 'join'>('create');

    readonly createName = signal('');
    readonly joinName = signal('');
    readonly joinCode = signal('');

    readonly createCharacter = signal<'man' | 'woman'>('man');
    readonly joinCharacter = signal<'man' | 'woman'>('man');

    readonly currentLang = signal(localStorage.getItem('uiLanguage') || 'en');

    constructor() {
        const prefs = this.storageService.getPreferences();
        if (prefs.name) {
            this.createName.set(prefs.name);
            this.joinName.set(prefs.name);
        }
        if (prefs.character) {
            this.createCharacter.set(prefs.character);
            this.joinCharacter.set(prefs.character);
        }
    }

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

    switchLanguage(lang: string): void {
        this.translate.use(lang);
        localStorage.setItem('uiLanguage', lang);
        this.currentLang.set(lang);
    }

    async createLobby(): Promise<void> {
        const name = this.createName().trim();
        const character = this.createCharacter();
        if (!name) return;
        this.storageService.savePreferences({
            ...this.storageService.getPreferences(),
            name,
            character,
        } as any);
        this.gameService.initListeners();
        await this.lobbyService.createLobby(name, character);
    }

    async joinLobby(): Promise<void> {
        const name = this.joinName().trim();
        const code = this.joinCode().trim();
        const character = this.joinCharacter();
        if (!name || !code) return;
        this.storageService.savePreferences({
            ...this.storageService.getPreferences(),
            name,
            character,
        } as any);
        this.gameService.initListeners();
        await this.lobbyService.joinLobby(code, name, character);
    }
}

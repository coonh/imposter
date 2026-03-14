import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LobbyService } from './core/services/lobby.service';
import { GameService } from './core/services/game.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private translate = inject(TranslateService);
  private lobbyService = inject(LobbyService);
  private gameService = inject(GameService);
  private router = inject(Router);

  async ngOnInit() {
    const savedLang = localStorage.getItem('uiLanguage') || 'en';
    this.translate.use(savedLang);

    // Initialize game listeners so we catch rejoin events!
    this.gameService.initListeners();

    // Attempt to rejoin active session
    const rejoined = await this.lobbyService.rejoinSession();
    if (rejoined) {
      const lobby = this.lobbyService.lobby();
      if (lobby && !lobby.gameState && this.router.url === '/') {
        this.router.navigate(['/lobby', lobby.code]);
      }
    }
  }
}

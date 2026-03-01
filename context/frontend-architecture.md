# Angular Frontend – Architecture & Conventions

## Angular Version
Angular 21 (latest stable as of March 2026)

## Strict Rules
- **Standalone components ONLY** – no NgModules
- **Signal-based architecture** – use `signal()`, `computed()`, `effect()` for all reactive state
- **ChangeDetection.OnPush** on every component
- **Strict TypeScript** – `strict: true` in `tsconfig.json`
- **Separate files** – each component has `.ts`, `.html`, `.scss` files (no inline templates)

## Folder Structure
```
src/app/
├── core/                   # Singleton services + models
│   ├── services/
│   │   ├── socket.service.ts      # Socket.IO wrapper
│   │   ├── lobby.service.ts       # Lobby state + actions
│   │   ├── game.service.ts        # Game state + actions
│   │   └── vote.service.ts        # Vote state + actions
│   └── models/
│       ├── lobby.model.ts
│       ├── player.model.ts
│       └── game.model.ts
├── features/               # Feature components (one per route)
│   ├── home/               # Landing page
│   ├── lobby/              # Lobby + player list
│   ├── game/               # Word reveal + clue phase
│   └── voting/             # Vote + results
├── shared/                 # Reusable UI components
│   ├── components/
│   │   ├── header/
│   │   └── button/
│   └── pipes/
├── app.component.ts
├── app.config.ts
└── app.routes.ts
```

## Routing
| Path | Component | Guard |
|------|-----------|-------|
| `/` | HomeComponent | – |
| `/lobby/:code` | LobbyComponent | lobby exists check |
| `/game/:code` | GameComponent | game active check |
| `/vote/:code` | VotingComponent | vote phase check |

## State Management Pattern
All state lives in injectable services using signals:
```typescript
@Injectable({ providedIn: 'root' })
export class LobbyService {
  readonly lobby = signal<Lobby | null>(null);
  readonly players = computed(() => this.lobby()?.players ?? []);
  readonly isHost = computed(() => ...);
}
```

## Component Pattern
```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './example.component.html',
  styleUrl: './example.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleComponent {
  private readonly lobbyService = inject(LobbyService);
  readonly lobby = this.lobbyService.lobby;
}
```

## Dependencies
- `socket.io-client` – WebSocket communication
- `@angular/router` – routing (built-in)
- `@angular/common` – common directives

# Node.js Backend – Architecture & API

## Tech Stack
- **Runtime**: Node.js (latest LTS)
- **Framework**: Express.js
- **WebSocket**: Socket.IO
- **Language**: TypeScript (strict)
- **State**: In-memory (Map-based, no database)

## Folder Structure
```
backend/src/
├── server.ts              # Express + Socket.IO bootstrap
├── routes/
│   └── lobby.routes.ts    # REST endpoints
├── handlers/
│   ├── lobby.handler.ts   # Socket.IO lobby events
│   └── game.handler.ts    # Socket.IO game/vote events
├── services/
│   ├── lobby.service.ts   # Lobby CRUD logic
│   └── game.service.ts    # Game logic (word assign, vote, guess)
├── models/
│   ├── lobby.model.ts     # Lobby interface
│   ├── player.model.ts    # Player interface
│   └── game.model.ts      # GameState, GamePhase enum
└── data/
    └── words.json         # Static word bank
```

## REST API

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/lobby` | `{ playerName }` | `{ lobbyCode, playerId }` |
| POST | `/api/lobby/join` | `{ lobbyCode, playerName }` | `{ playerId }` |

## Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `lobby:create` | `{ playerName }` | Create new lobby |
| `lobby:join` | `{ lobbyCode, playerName }` | Join existing lobby |
| `lobby:leave` | `{ lobbyCode, playerId }` | Leave lobby |
| `game:start` | `{ lobbyCode }` | Host starts game |
| `game:requestVote` | `{ lobbyCode }` | Host initiates vote |
| `game:vote` | `{ lobbyCode, voterId, targetId }` | Cast a vote |
| `game:imposterGuess` | `{ lobbyCode, guess }` | Imposter's final guess |
| `game:newRound` | `{ lobbyCode }` | Start a new round |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `lobby:created` | `{ lobby, player }` | Lobby created |
| `lobby:playerJoined` | `{ player, players[] }` | Someone joined |
| `lobby:playerLeft` | `{ playerId, players[] }` | Someone left |
| `game:wordAssigned` | `{ word?, category, isImposter }` | Word reveal (per-player) |
| `game:phaseChanged` | `{ phase }` | Game phase transition |
| `game:voteStarted` | `{}` | Vote phase begins |
| `game:voteResult` | `{ votes, caughtPlayerId, isMajorityCorrect }` | Vote tally |
| `game:finalResult` | `{ winner, imposterGuessCorrect? }` | Game over |

## Data Models

```typescript
interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isImposter: boolean;
  hasVoted: boolean;
  votedFor?: string;
}

interface Lobby {
  code: string;
  players: Player[];
  hostId: string;
  status: 'waiting' | 'playing';
  gameState?: GameState;
}

enum GamePhase {
  WORD_REVEAL = 'WORD_REVEAL',
  DISCUSSION = 'DISCUSSION',
  VOTING = 'VOTING',
  IMPOSTER_GUESS = 'IMPOSTER_GUESS',
  RESULT = 'RESULT',
}

interface GameState {
  word: string;
  category: string;
  imposterId: string;
  phase: GamePhase;
  votes: Map<string, string>;   // voterId → targetId
  round: number;
}
```

## Game Logic

### Start Game
1. Pick random `{ word, category }` from `words.json`
2. Pick random player as imposter
3. Send `game:wordAssigned` to each player individually:
   - Imposter: `{ category, isImposter: true }`
   - Others: `{ word, category, isImposter: false }`
4. Set phase to `WORD_REVEAL`

### Vote Tallying
1. Count votes per target player
2. Find player with most votes (majority = > 50% of voters)
3. If most-voted player IS the imposter → `isMajorityCorrect: true` → proceed to `IMPOSTER_GUESS`
4. If most-voted player is NOT the imposter (or tie) → `isMajorityCorrect: false` → imposter wins

### Imposter Guess
1. Imposter submits a word guess
2. Compare (case-insensitive) to the actual word
3. If match → imposter wins; else → players win

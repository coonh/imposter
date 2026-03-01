# Imposter Game – Project Overview

## What is this?
A mobile-optimized browser-based party game. Players receive a secret word (except the imposter who only gets the category). Players give clues in person, then vote via the app.

## Tech Stack
- **Frontend**: Angular 21 (standalone components only, signal-based state, ChangeDetection.OnPush, SCSS, strict TypeScript)
- **Backend**: Node.js + Express + Socket.IO (TypeScript, in-memory state, no database)
- **Communication**: REST (lobby create/join) + WebSocket via Socket.IO (real-time game events)

## Project Root
```
c:\Dev\imposter\
├── frontend/     # Angular 21 app
├── backend/      # Node.js API + WebSocket server
└── context/      # AI context files (this folder)
```

## Game Rules
1. All players receive the same word, except the imposter who only sees the category
2. Players give clues in person (not in the app)
3. Players vote in the app to identify the imposter
4. If majority vote is wrong → imposter wins
5. If majority vote is correct → imposter gets one chance to guess the word
6. If imposter guesses correctly → imposter wins; otherwise → players win

## Lobby System
- No login required, just a username
- Create lobby → get 4-digit code
- Join lobby → enter 4-digit code + username
- Host can start the game when ≥ 3 players are in the lobby

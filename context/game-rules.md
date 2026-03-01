# Game Rules & Flow

## Overview
Imposter is a party game played **in person** where the app supports word distribution and voting. Players give clues verbally – the app is NOT a chat platform.

## Setup
1. One player creates a lobby → receives a 4-digit code
2. Other players join using the code + a chosen username
3. Minimum 3 players required to start
4. No login, no accounts – just a username per session

## Round Flow

### Phase 1: Word Reveal
- Each player sees their assigned word on their phone (tap to reveal, tap to hide)
- One random player is the **imposter** – they see only the **category** (not the word)
- Example: Word = "Piano", Category = "Instruments"
- Imposter sees: "🕵️ You are the Imposter! Category: Instruments"
- Normal player sees: "Your word is: Piano"

### Phase 2: Discussion (In Person)
- Players take turns giving verbal clues about the word
- The imposter must bluff and give vague but believable clues
- This happens entirely in person – the app just shows "Discussion in progress"
- The host decides when to move to voting

### Phase 3: Voting
- The host taps "Start Voting" in the app
- Each player votes for who they think is the imposter
- Players cannot vote for themselves
- Once all votes are in, results are revealed

### Phase 4: Resolution
**Case A – Majority votes for the imposter:**
- The imposter is revealed
- The imposter gets ONE chance to guess the word
- If the imposter guesses correctly → **Imposter wins** 🕵️
- If the imposter guesses wrong → **Players win** 🎉

**Case B – Majority votes for a non-imposter (or tie):**
- The imposter wins immediately 🕵️
- The actual imposter is revealed

### Phase 5: Play Again
- Results screen with winner announcement
- Host can start a new round (new word, new imposter)
- Players stay in the lobby – no need to rejoin

## Edge Cases
- **Player disconnects**: Remove from lobby, notify others
- **Host disconnects**: Transfer host role to next player
- **Tie vote**: Imposter wins (count as "majority wrong")
- **Only imposter left**: Game cannot proceed, return to lobby
- **Duplicate username**: Reject with error message

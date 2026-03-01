# UI/UX Design Guidelines

## Design Philosophy
Mobile-first, dark-themed party game aesthetic. The app should feel like a sleek, premium card game UI.

## Target Devices
- Primary: Mobile phones (375px–428px width)
- Secondary: Tablets
- Also works on desktop but optimized for mobile portrait

## Color Palette
| Role | Color | Hex |
|------|-------|-----|
| Background | Deep charcoal | `#1a1a2e` |
| Surface/Card | Dark navy | `#16213e` |
| Primary | Electric purple | `#7c3aed` |
| Primary hover | Lighter purple | `#8b5cf6` |
| Accent/Warning | Amber | `#f59e0b` |
| Success | Emerald | `#10b981` |
| Danger/Imposter | Crimson | `#ef4444` |
| Text primary | White | `#ffffff` |
| Text secondary | Light gray | `#94a3b8` |
| Border | Subtle gray | `#334155` |

## Typography
- **Font**: `Inter` from Google Fonts (fallback: system sans-serif)
- **Headings**: Bold, slightly larger
- **Body**: Regular weight, legible on small screens
- **Lobby code**: Monospace, extra large, letter-spaced (for easy reading)

## Component Styles

### Cards
- Rounded corners: `16px`
- Background: surface color with subtle gradient
- Box shadow: soft glow
- Glassmorphism effect on key cards (word reveal)

### Buttons
- Full-width on mobile
- Rounded: `12px`
- Primary: gradient purple background
- Disabled: muted opacity
- Tap feedback: scale animation

### Animations
- Page transitions: slide in/out
- Word reveal: card flip animation (3D CSS transform)
- Vote cast: bounce/pulse confirmation
- Result reveal: dramatic fade-in with delay

### Layout
- Single column on mobile
- Generous padding (16–24px)
- Sticky header with game info
- Content centered vertically when appropriate

## Key Screens

### Home Screen
- App logo/title with subtle animation
- Two cards: "Create Lobby" and "Join Lobby"
- Input fields with rounded style
- Clean, focused layout

### Lobby Screen
- Large lobby code display (copyable)
- Player list with avatars (generated initials)
- Host badge indicator
- "Start Game" button (host only, pulsing when ready)

### Game Screen (Word Reveal)
- Full-screen card with tap-to-reveal mechanic
- Imposter gets a dramatic red-themed reveal
- Normal players get a calm blue/purple reveal
- "Peek" functionality – tap and hold to view

### Voting Screen
- Grid of player cards
- Selected card gets highlighted border
- "Confirm Vote" button after selection
- Live vote count indicator (X of Y voted)

### Results Screen
- Dramatic reveal animation
- Winner announcement with emoji and animation
- Imposter identity revealed
- "Play Again" and "Back to Lobby" buttons

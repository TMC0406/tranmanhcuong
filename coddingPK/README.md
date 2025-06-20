# Mini PK Multiplayer Game

A multiplayer browser-based PvP game with character classes, weapons, and skills.

## Project Structure

The project has been modularized into the following structure:

```
coddingPK/
├── index.html          # Main HTML file
├── run_game.sh         # Script to run the game locally
├── INSTALLATION.md     # Installation and setup guide
├── README.md           # Project documentation
├── static/             # Static assets directory
│   ├── css/            # Modularized CSS files
│   │   ├── style.css   # Original CSS (for backwards compatibility)
│   │   ├── base.css    # Base styles
│   │   ├── main.css    # CSS imports and organization
│   │   └── animations.css # Animation definitions
│   └── js/             # JavaScript modules
│       ├── main.js     # Central import and initialization
│       ├── debug.js    # Debugging utilities
│       ├── auth/       # Authentication
│       │   └── auth.js # Authentication functionality
│       ├── config/     # Game configuration
│       │   └── game-config.js # Game constants and configuration
│       ├── firebase/   # Firebase integration
│       │   ├── firebase-config.js # Firebase configuration
│       │   └── database.js # Database operations
│       ├── ui/         # User interface
│       │   ├── panels.js # Panel management
│       │   └── rooms-ui.js # Room UI functionality
│       └── game/       # Game mechanics
│           ├── game.js # Game logic coordinator
│           ├── bullets.js # Bullet mechanics
│           ├── game-loop.js # Main game loop
│           ├── items.js # Item mechanics
│           ├── player.js # Player functionality
│           ├── renderer.js # Game rendering
│           └── rooms.js # Room management
```

## Running the Game

You can run the game in several ways:

1. **Using the run script:** Execute the `run_game.sh` script:
   ```
   ./run_game.sh
   ```
   This will start a local server and open the game in your default browser.

2. **Manual start:** Open `index.html` directly in a web browser or use a local server.

For more detailed installation and setup instructions, see the `INSTALLATION.md` file.

## Features

- Character selection (Warrior, Scout, Mage)
- Weapon selection (Pistol, Shotgun, Rifle, etc.)
- Multiplayer rooms with Firebase
- Multiple maps
- Health, energy, and shield mechanics
- Item pickups
- Different weapons with unique properties

## How to Play

1. Login or enter your name
2. Select a character and weapon
3. Create or join a room
4. Use WASD or arrow keys to move
5. J to shoot, K to use skills, L to create shields
6. Collect items to gain advantages

## Technical Implementation

The game uses:

- Firebase Realtime Database for multiplayer
- Firebase Authentication for Google login
- Modular JavaScript architecture
- CSS animations
- Game loop with requestAnimationFrame

## Development

The codebase has been refactored to be modular and maintainable:
- Separated UI, authentication, game logic, and Firebase operations
- Organized code by functionality
- Proper initialization and cleanup
- Consistent naming conventions
- Global functions exported to window for compatibility

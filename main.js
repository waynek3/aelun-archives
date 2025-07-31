// --- 1. SETUP ---
// Get a reference to the player element from our HTML
const player = document.getElementById('player');
// Get a reference to the game container to check for boundaries
const gameContainer = document.getElementById('game-container');

// Define how many pixels the player moves each time
const speed = 10;

// Store the player's current position. We start at 0, 0 (top-left corner).
let playerX = 0;
let playerY = 0;


// --- 2. THE MOVEMENT LOGIC ---
// This function will be called every time a key is pressed
function handleKeyPress(event) {
    // Check which key was pressed
    switch(event.key) {
        case 'ArrowUp':
            // Move up, but don't go outside the top boundary
            playerY = Math.max(0, playerY - speed);
            break;
        case 'ArrowDown':
            // Move down, but don't go outside the bottom boundary
            // The boundary is the container height minus the player height
            playerY = Math.min(gameContainer.offsetHeight - player.offsetHeight, playerY + speed);
            break;
        case 'ArrowLeft':
            // Move left, but don't go outside the left boundary
            playerX = Math.max(0, playerX - speed);
            break;
        case 'ArrowRight':
            // Move right, but don't go outside the right boundary
            // The boundary is the container width minus the player width
            playerX = Math.min(gameContainer.offsetWidth - player.offsetWidth, playerX + speed);
            break;
    }

    // After calculating the new position, update the player's style on the screen
    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';
}


// --- 3. THE EVENT LISTENER ---
// Tell the browser to listen for 'keydown' events.
// When a keydown event happens, it will call our handleKeyPress function.
document.addEventListener('keydown', handleKeyPress);
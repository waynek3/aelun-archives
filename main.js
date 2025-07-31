// This is the configuration for our game
const config = {
    type: Phaser.AUTO, // Automatically choose between WebGL or Canvas
    width: 800,        // Game width in pixels
    height: 600,       // Game height in pixels
    physics: {         // We're enabling the built-in Arcade Physics engine
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// --- GLOBAL VARIABLES ---
// It's often useful to have some variables accessible by all functions
let player;
let cursors;
const playerSpeed = 200; // Pixels per second

// Create a new Phaser Game instance
const game = new Phaser.Game(config);

// The preload function is where you load assets like images and sounds
function preload() {
    // Phaser has a built-in loader for images.
    // We'll use a simple block from the official Phaser examples.
    // The first argument is the 'key' we'll use to refer to this image.
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/block.png');
}

// The create function is where you set up your game scene (sprites, text, etc.)
function create() {
    // Add the player sprite to the game.
    // this.physics.add.sprite() creates a sprite with physics enabled.
    // We're placing it in the center of the screen to start.
    player = this.physics.add.sprite(config.width / 2, config.height / 2, 'player');

    // Make sure the player can't move outside the game world's boundaries.
    player.setCollideWorldBounds(true);

    // Set up the keyboard controls.
    // createCursorKeys() creates an object with properties for up, down, left, right.
    cursors = this.input.keyboard.createCursorKeys();
}

// The update function runs every frame (about 60 times per second)
function update() {
    // --- PLAYER MOVEMENT ---

    // First, we reset the player's velocity to 0 each frame.
    // This makes the movement feel snappy and stops the player when no key is pressed.
    player.setVelocity(0);

    // Now, we check which keys are currently held down and set the velocity accordingly.
    // This allows for diagonal movement.
    if (cursors.left.isDown) {
        player.setVelocityX(-playerSpeed);
    } else if (cursors.right.isDown) {
        player.setVelocityX(playerSpeed);
    }

    if (cursors.up.isDown) {
        player.setVelocityY(-playerSpeed);
    } else if (cursors.down.isDown) {
        player.setVelocityY(playerSpeed);
    }
}
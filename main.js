// This is the configuration for our game
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
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
let player;
let cursors;
const playerSpeed = 200;

const dpadState = {
    up: false,
    down: false,
    left: false,
    right: false,
};

// Create a new Phaser Game instance
const game = new Phaser.Game(config);

function preload() {
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/block.png');
}

function create() {
    player = this.physics.add.sprite(config.width / 2, config.height / 2, 'player');
    player.setCollideWorldBounds(true);

    cursors = this.input.keyboard.createCursorKeys();

    createDpad.call(this);
}

function update() {
    player.setVelocity(0);

    const keyLeft = cursors.left.isDown;
    const keyRight = cursors.right.isDown;
    const keyUp = cursors.up.isDown;
    const keyDown = cursors.down.isDown;

    const dpadLeft = dpadState.left;
    const dpadRight = dpadState.right;
    const dpadUp = dpadState.up;
    const dpadDown = dpadState.down;

    if (keyLeft || dpadLeft) {
        player.setVelocityX(-playerSpeed);
    } else if (keyRight || dpadRight) {
        player.setVelocityX(playerSpeed);
    }

    if (keyUp || dpadUp) {
        player.setVelocityY(-playerSpeed);
    } else if (keyDown || dpadDown) {
        player.setVelocityY(playerSpeed);
    }
}

function createDpad() {
    const buttonSize = 50;
    const alpha = 0.5;
    const dpadX = 100;
    const dpadY = this.cameras.main.height - 100;

    const upButton = this.add.rectangle(dpadX, dpadY - buttonSize / 2, buttonSize, buttonSize, 0xcccccc, alpha).setInteractive();
    const downButton = this.add.rectangle(dpadX, dpadY + buttonSize / 2, buttonSize, buttonSize, 0xcccccc, alpha).setInteractive();
    const leftButton = this.add.rectangle(dpadX - buttonSize / 2, dpadY, buttonSize, buttonSize, 0xcccccc, alpha).setInteractive();
    const rightButton = this.add.rectangle(dpadX + buttonSize / 2, dpadY, buttonSize, buttonSize, 0xcccccc, alpha).setInteractive();
    
    upButton.setScrollFactor(0);
    downButton.setScrollFactor(0);
    leftButton.setScrollFactor(0);
    rightButton.setScrollFactor(0);

    // --- Add Pointer Event Listeners ---
    upButton.on('pointerdown', () => dpadState.up = true);
    downButton.on('pointerdown', () => dpadState.down = true);
    leftButton.on('pointerdown', () => dpadState.left = true);
    rightButton.on('pointerdown', () => dpadState.right = true);

    // ✨ THE FIX: Add 'pointerout' listeners to each button ✨
    upButton.on('pointerout', () => dpadState.up = false);
    downButton.on('pointerout', () => dpadState.down = false);
    leftButton.on('pointerout', () => dpadState.left = false);
    rightButton.on('pointerout', () => dpadState.right = false);

    this.input.on('pointerup', () => {
        dpadState.up = false;
        dpadState.down = false;
        dpadState.left = false;
        dpadState.right = false;
    });
}
import Phaser from 'phaser';
import { Game } from './Game.ts';  // Assuming Game is exported from the correct file
import { InternalDSL } from '../InternalDSL.ts'; // Import the internal DSL
import externalDSL from '../externalDSL.json' with { type: 'json' }; // Import external DSL JSON

export const plantTypes = InternalDSL.fromJSON(JSON.stringify(externalDSL)).plants;

export interface Plant {
    name: string;
    requiredWater: number;
    requiredSunEnergy: number;
    growthTime: number;
    sprite: string;
    growthStage: number;  // 0 = seed, 1 = half-grown, 2 = fully grown
    daysPlanted: number;
    hasReachedMaxGrowth: boolean;
}

// Creates buttons for each plant type for the player to select
export function createPlantButtons(scene: Game) {
    const buttonWidth = 120;
    const buttonHeight = 40;
    const spacing = 10;

    const startX = 20;
    const startY = scene.scale.height - (plantTypes.length * (buttonHeight + spacing)) - 20;

    scene.plantButtons = scene.add.container();

    plantTypes.forEach((plant, index) => {
        const y = startY + index * (buttonHeight + spacing);

        // Button background
        const buttonBg = scene.add.rectangle(startX, y, buttonWidth, buttonHeight, 0x222222)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true }); // Makes it clickable

        // Button text
        const buttonText = scene.add.text(startX + 10, y + 10, plant.name, {
            font: '18px Arial',
            color: '#ffffff',
        });

        // Add click listener
        buttonBg.on('pointerdown', () => {
            scene.selectedPlantType = index; // Set the selected plant type
            console.log(`Selected plant: ${plant.name}`);
            updateButtonHighlights(scene); // Highlight the selected button
        });

        scene.plantButtons.add(buttonBg);
        scene.plantButtons.add(buttonText);
    });
}

export function updateButtonHighlights(scene: Game) {
    scene.plantButtons.each((child: Phaser.GameObjects.GameObject) => {
        if (child instanceof Phaser.GameObjects.Rectangle) {
            // Reset all button colors
            child.setFillStyle(0x222222);
        }
    });

    // Highlight the selected button
    const selectedButtonIndex = scene.selectedPlantType;
    if (selectedButtonIndex !== null) {
        const buttonBg = scene.plantButtons.getAt(selectedButtonIndex * 2) as Phaser.GameObjects.Rectangle;
        if (buttonBg) {
            buttonBg.setFillStyle(0x5555ff); // Highlight the selected button
        }
    }
}

// Create an animation for walking
export function createWalkAnimation(scene: Game) {
    scene.anims.create({
        key: 'walk',
        frames: scene.anims.generateFrameNumbers('player', { start: 1, end: 2 }),
        frameRate: 10,
        repeat: -1,
    });
}

export function createPlayer(scene: Game) {
    const player = scene.physics.add.sprite(scene.scale.width / 2, scene.scale.height / 2, 'player');
    player.setCollideWorldBounds(true);
    player.setScale(.4);
    return player;
}

export function createMovementKeys(scene: Game) {
    return scene.cursors = scene.input.keyboard?.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }) as Phaser.Types.Input.Keyboard.CursorKeys;
}

// Displays information about the tile under the cursor when hovering
export function handlePointerHover(scene: Game, pointer: Phaser.Input.Pointer) {
    const tileX = Math.floor((pointer.x - scene.offsetX) / scene.tileWidth);
    const tileY = Math.floor((pointer.y - scene.offsetY) / scene.tileHeight);

    if (
        tileX >= 0 &&
        tileY >= 0 &&
        tileY < scene.tileAttributes.length &&
        tileX < scene.tileAttributes[tileY].length
    ) {
        const tile = scene.tileAttributes[tileY][tileX];
        scene.hover_text.setText(
            `Sun: ${tile.sunEnergy.toFixed(2)}\nWater: ${tile.water.toFixed(2)}${
                tile.plant ? `\nPlant: ${tile.plant.name} (Stage: ${tile.plant.growthStage})` : ''
            }`
        );
        scene.hover_text.setPosition(pointer.x + 10, pointer.y + 10);
        scene.hover_text.setVisible(true);
    } else {
        scene.hover_text.setVisible(false);
    }
}
// doin autosave
import { Scene } from 'phaser';
import { createPlantButtons, plantTypes , updateButtonHighlights } from './helpers';
import { createWalkAnimation, createPlayer , createMovementKeys } from './helpers';
import { handlePointerHover } from './helpers.js';

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.TileSprite;
    msg_text: Phaser.GameObjects.Text;
    hover_text: Phaser.GameObjects.Text;
    player: Phaser.Physics.Arcade.Sprite;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    days: number;
    tileWidth: number;
    tileHeight: number;
    offsetX: number;
    offsetY: number;
    
    victoryScenario: boolean = false; // Track if the scenario is completed
    fullyGrownPlants: number = 0; // Track the number of fully grown plants

    plantTypes = plantTypes;  // Store plant types here
    plantButtons: Phaser.GameObjects.Container;
    selectedPlantType: number | null;
    tileAttributes: { water: number; sunEnergy: number; plant: any }[][];
    plantSprites: Phaser.GameObjects.Group;

    constructor() {
        super('Game');
        this.tileAttributes = [];
        this.tileWidth = 75;
        this.tileHeight = 75;
        this.days = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.selectedPlantType = null;
    }

     // -------------------- Game State Management --------------------
    // Function to serialize the important states of each tilemap grid and day into a byte array (SoA format)
    serializeStateToByteArray() {
        const waterArray = new Float32Array(this.tileAttributes.flatMap(row => row.map(tile => tile.water)));
        const sunlightArray = new Float32Array(this.tileAttributes.flatMap(row => row.map(tile => tile.sunEnergy)));
        const plantArray = new Int32Array(this.tileAttributes.flatMap(row =>
            row.map(tile => tile.plant ? this.plantTypes.findIndex(p => p.name === tile.plant.name) : -1)
        ));
        const growthStageArray = new Int32Array(this.tileAttributes.flatMap(row => row.map(tile => tile.plant ? tile.plant.growthStage : 0)));
        const daysPlantedArray = new Int32Array(this.tileAttributes.flatMap(row => row.map(tile => tile.plant ? tile.plant.daysPlanted : 0)));
    
        // Add days and fullyGrownPlants to the state
        const daysArray = new Int32Array([this.days]);
        const fullyGrownPlantsArray = new Int32Array([this.fullyGrownPlants]);
    
        const totalSize = waterArray.byteLength + sunlightArray.byteLength + plantArray.byteLength +
            growthStageArray.byteLength + daysPlantedArray.byteLength + daysArray.byteLength + fullyGrownPlantsArray.byteLength;
    
        const byteArray = new Uint8Array(totalSize);
        let offset = 0;
    
        byteArray.set(new Uint8Array(waterArray.buffer), offset);
        offset += waterArray.byteLength;
    
        byteArray.set(new Uint8Array(sunlightArray.buffer), offset);
        offset += sunlightArray.byteLength;
    
        byteArray.set(new Uint8Array(plantArray.buffer), offset);
        offset += plantArray.byteLength;
    
        byteArray.set(new Uint8Array(growthStageArray.buffer), offset);
        offset += growthStageArray.byteLength;
    
        byteArray.set(new Uint8Array(daysPlantedArray.buffer), offset);
        offset += daysPlantedArray.byteLength;
    
        byteArray.set(new Uint8Array(daysArray.buffer), offset);
        offset += daysArray.byteLength;
    
        byteArray.set(new Uint8Array(fullyGrownPlantsArray.buffer), offset);
    
        return byteArray;
    }
    
    // Update deserializeStateFromByteArray to correctly restore daysPlanted
    deserializeStateFromByteArray(byteArray: Uint8Array) {
        if (!this.tileAttributes || !Array.isArray(this.tileAttributes) || !this.tileAttributes[0]) {
            console.error('tileAttributes is not properly initialized or has no rows');
            return;
        }

        // Ensure tileAttributes is properly initialized before attempting deserialization
        if (this.tileAttributes.length === 0 || this.tileAttributes[0].length === 0) {
            console.error('tileAttributes grid is not initialized correctly');
            return;
        }

        const tileCount = this.tileAttributes.length * this.tileAttributes[0].length;

        const waterArray = new Float32Array(byteArray.buffer.slice(0, tileCount * 4));
        const sunlightArray = new Float32Array(byteArray.buffer.slice(tileCount * 4, tileCount * 8));
        const plantArray = new Int32Array(byteArray.buffer.slice(tileCount * 8, tileCount * 12));
        const growthStageArray = new Int32Array(byteArray.buffer.slice(tileCount * 12, tileCount * 16));
        const daysPlantedArray = new Int32Array(byteArray.buffer.slice(tileCount * 16, tileCount * 20));

        // Extract days and fullyGrownPlants from the saved state
        const daysArray = new Int32Array(byteArray.buffer.slice(tileCount * 20, tileCount * 24));
        this.days = daysArray[0];

        const fullyGrownPlantsArray = new Int32Array(byteArray.buffer.slice(tileCount * 24, tileCount * 28));
        this.fullyGrownPlants = fullyGrownPlantsArray[0]; // Restore the fullyGrownPlants count

        let idx = 0;
        for (let y = 0; y < this.tileAttributes.length; y++) {
            for (let x = 0; x < this.tileAttributes[y].length; x++) {
                const tile = this.tileAttributes[y][x];
                tile.water = waterArray[idx];
                tile.sunEnergy = sunlightArray[idx];

                const plantIndex = plantArray[idx];
                if (plantIndex >= 0 && plantIndex < this.plantTypes.length) {
                    tile.plant = {
                        ...this.plantTypes[plantIndex],
                        growthStage: growthStageArray[idx],
                        daysPlanted: daysPlantedArray[idx],
                        hasReachedMaxGrowth: growthStageArray[idx] === 2,
                    };
                } else {
                    tile.plant = null;
                }
                idx++;
            }
        }

        this.refreshPlantGrowth();

        // Update the day text on the UI
        this.msg_text.setText(`Day: ${this.days}`);
    }


    
    
    saveGameState(slot: number, isAutoSave = false) {
        // Ensure the game state is serialized correctly
        const byteArray = this.serializeStateToByteArray();
        
        // Convert byte array to base64 string
        const base64String = btoa(String.fromCharCode(...byteArray));
        
        // Store the base64 string in localStorage with a slot-specific key
        const saveKey = isAutoSave ? 'autoSave' : `gameState_slot_${slot}`;
        localStorage.setItem(saveKey, base64String);
        
        console.log(`${isAutoSave ? 'Auto' : 'Manual'} save completed!`);
    }
    
    loadGameState(slot: number) {
        const saveKey = `gameState_slot_${slot}`;
        const base64String = localStorage.getItem(saveKey);
        
        if (base64String) {
            const byteArray = new Uint8Array(atob(base64String).split('').map(char => char.charCodeAt(0)));
            this.deserializeStateFromByteArray(byteArray);
            console.log(`Game loaded from slot ${slot}`);
        } else {
            console.log(`No saved game state found in slot ${slot}. Initializing empty state.`);
            this.initializeTileAttributes(); // Ensure the tiles are initialized when loading from an empty state
            this.days = 0; // Reset the day counter
        }
    }
    
    loadAutoSave() {
        const base64String = localStorage.getItem('autoSave');
        
        if (base64String) {
            const byteArray = new Uint8Array(atob(base64String).split('').map(char => char.charCodeAt(0)));
            this.deserializeStateFromByteArray(byteArray);
            console.log('Auto-save loaded.');
            this.askContinue();
        } else {
            console.log('No auto-save found.');
            this.startNewGame(); // Start a new game if there's no auto-save
        }
    }
    
    askContinue() {
        // Prompt the player to continue from the auto-save
        if (confirm("Do you want to continue where you left off?")) {
            console.log('Continuing from auto-save...');
        } else {
            console.log('Starting new game...');
            this.startNewGame();
        }
    }
    
    startNewGame() {
        // Logic for starting a new game (reset state, etc.)
        this.days = 0;
        this.tileAttributes = [];
        console.log('New game started.');
    }
    
    // Ensure tiles are initialized before saving or loading
    initializeTileAttributes(level: number[][] = []) {
        if (level.length === 0) {
            level = [
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
            ]; // Default level if none provided
        }
    
        for (let y = 0; y < level.length; y++) {
            this.tileAttributes[y] = [];
            for (let x = 0; x < level[y].length; x++) {
                this.tileAttributes[y][x] = {
                    water: Math.random() * 5,
                    sunEnergy: Math.random() * 10,
                    plant: null,
                };
            }
        }
    }

    create() {
        this.camera = this.cameras.main;
        this.background = this.add.tileSprite(0, 0, 1024, 768, 'background').setOrigin(0, 0);
        this.loadAutoSave();

        // Define the initial level layout as a 5x5 grid of tiles
        const level = [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
        ];

        const map = this.make.tilemap({ data: level, tileWidth: this.tileWidth, tileHeight: this.tileHeight });
        const tiles = map.addTilesetImage('dirt');
        if (!tiles) {
            console.error("Tileset 'dirt' not found. Check the preload key and file path.");
            return;
        }

        // Compute offsets to center the tilemap on the screen
        const tilemapWidth = level[0].length * this.tileWidth;
        const tilemapHeight = level.length * this.tileHeight;
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        // Center the tilemap
        this.offsetX = (gameWidth - tilemapWidth) / 2;
        this.offsetY = (gameHeight - tilemapHeight) / 2;
        map.createLayer(0, tiles, this.offsetX, this.offsetY)?.setOrigin(0, 0);

        // Initialize tile attributes
        this.initializeTileAttributes(level);
        
        if (this.tileAttributes.length === 0 || this.tileAttributes[0].length === 0) {
            const rows = 10;  // Set the number of rows (adjust as needed)
            const cols = 10;  // Set the number of columns (adjust as needed)

            this.tileAttributes = Array.from({ length: rows }, () =>
                Array.from({ length: cols }, () => ({
                    water: 0,
                    sunEnergy: 0,
                    plant: null
                }))
            );
        }

        // Create buttons for save/load slots
        const saveButtons: Phaser.GameObjects.Text[] = [];
        const loadButtons: Phaser.GameObjects.Text[] = [];
        const slots = 3; // Number of save slots

        for (let i = 0; i < slots; i++) {
            const saveButton = this.add.text(800, 50 + i * 40, `Save Slot ${i + 1}`, {
                fontSize: '20px',
                color: '#ffffff',
                backgroundColor: '#00ff00',
                padding: { x: 10, y: 5 }
            })
            .setInteractive()
            .on('pointerdown', () => this.saveGameState(i + 1)); // Call saveGameState with slot number
            saveButtons.push(saveButton);

            const loadButton = this.add.text(600, 50 + i * 40, `Load Slot ${i + 1}`, {
                fontSize: '20px',
                color: '#ffffff',
                backgroundColor: '#ff0000',
                padding: { x: 10, y: 5 }
            })
            .setInteractive()
            .on('pointerdown', () => this.loadGameState(i + 1)); // Call loadGameState with slot number
            loadButtons.push(loadButton);
        }

        // Optionally add hover effects for buttons
        [...saveButtons, ...loadButtons].forEach(button => {
            button.on('pointerover', () => button.setStyle({ fill: '#ffff00' }));
            button.on('pointerout', () => button.setStyle({ fill: '#ffffff' }));
        });

        createWalkAnimation(this);
        this.player = createPlayer(this);

        // Add a text element to display current day
        this.msg_text = this.add.text(10, 10, `Day: ${this.days}`, {
            font: '18px Arial',
            color: '#ffffff',
        });

        // Add a tooltip text element for hovering over tiles
        this.hover_text = this.add.text(0, 0, '', {
            font: '16px Arial',
            color: '#ffcc00',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 },
        }).setVisible(false);

        this.cursors = createMovementKeys(this);
        this.plantSprites = this.add.group();

        // Display tile information when hovering
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            handlePointerHover(this, pointer);
        });

        createPlantButtons(this);
        updateButtonHighlights(this);

        // Add a "pointerdown" event to plant on clicked tiles
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const tileX = Math.floor((pointer.x - this.offsetX) / this.tileWidth);
            const tileY = Math.floor((pointer.y - this.offsetY) / this.tileHeight);

            // Check if the clicked tile is within bounds and if a plant is selected
            if (
                tileX >= 0 &&
                tileY >= 0 &&
                tileY < this.tileAttributes.length &&
                tileX < this.tileAttributes[tileY].length &&
                this.selectedPlantType !== null
            ) {
                if (this.selectedPlantType !== null) {
                    this.plant(tileX, tileY, this.selectedPlantType);
                } else {
                    this.reap(tileX, tileY);
                }
            }
        });
    }

    // -------------------- Tile Management --------------------

    // Checks if the player is near a specified tile based on distance calculation
    isNearTile(tileX: number, tileY: number): boolean {
        // Calculate the center coordinates of the tile
        const tileCenterX = this.offsetX + tileX * this.tileWidth + this.tileWidth / 2;
        const tileCenterY = this.offsetY + tileY * this.tileHeight + this.tileHeight / 2;
        
        // Compute the distance between the player and the tile center
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, tileCenterX, tileCenterY);
        return distance <= this.tileWidth;
    }

    // Handles planting functionality for a tile
    plant(tileX: number, tileY: number, plantType: number) {
        const tile = this.tileAttributes[tileY][tileX];
        const plant = this.plantTypes[plantType];

        // Check if the player is near the tile
        if (!this.isNearTile(tileX, tileY)) {
            console.log('You need to be near the tile to plant!')
            return;
        }

        // Prevent planting if the tile already has a crop
        if (tile.plant) {
            console.log('Tile already has a plant!');
            return;
        }

        // Check if the tile has enough resources to support the plant
        if (tile.water >= plant.requiredWater && tile.sunEnergy >= plant.requiredSunEnergy) {
            tile.plant = { ...plant, growthStage: 0, daysPlanted: this.days };
            console.log(`Planted ${plant.name} at (${tileX}, ${tileY})`);
        } else {
            console.log('Insufficient resources to plant here!');
        }
    }

    // Handles reaping (harvesting) crops from a tile
    reap(tileX: number, tileY: number) {
        const tile = this.tileAttributes[tileY][tileX];
        
        // Check if the player is near the tile
        if (!this.isNearTile(tileX, tileY)) {
            console.log('You need to be near the tile to reap!');
            return;
        }

        // If there's a plant, reap it and clear the tile
        if (tile.plant) {
            console.log(`Reaped ${tile.plant.name} from (${tileX}, ${tileY})`);
            tile.plant = null; // Remove the plant
        } else {
            console.log('No plant to reap here!');
        }
    }


    // -------------------- Day Management --------------------
    advanceDay() {
        this.days++;
        this.msg_text.setText(`Day: ${this.days}`);
    
        for (let y = 0; y < this.tileAttributes.length; y++) {
            for (let x = 0; x < this.tileAttributes[y].length; x++) {
                const tile = this.tileAttributes[y][x];
                tile.sunEnergy = Math.random() * 10; // Random sun energy
                tile.water = Math.min(10, tile.water + Math.random() * 2); // Increment water level
    
                if (tile.plant) {
                    const plant = tile.plant;
                    const daysSincePlanted = this.days - plant.daysPlanted;
    
                    // Skip growth calculations if plant is fully grown
                    if (plant.growthStage === 2) {
                        if (!plant.hasReachedMaxGrowth) {
                            this.fullyGrownPlants++;
                            plant.hasReachedMaxGrowth = true;
                        }
                        continue;
                    }
    
                    // Calculate adjacent bonus and growth multiplier
                    const adjacentBonus = this.getAdjacentSameTypePlants(x, y, plant);
                    const growthMultiplier = 1 - 0.05 * adjacentBonus; // 5% boost per adjacent plant
                    const boostedGrowthTime = Math.max(plant.growthTime * growthMultiplier, 1);
    
                    // Update growth stage based on conditions
                    if (daysSincePlanted >= boostedGrowthTime && plant.growthStage < 2) {
                        plant.growthStage = 2; // Fully grown
                        if (!plant.hasReachedMaxGrowth) {
                            this.fullyGrownPlants++;
                            plant.hasReachedMaxGrowth = true;
                        }
                    } else if (daysSincePlanted >= boostedGrowthTime / 2) {
                        plant.growthStage = 1; // Half-grown
                    } else {
                        plant.growthStage = 0; // Initial stage
                    }
                }
            }
        }

        // Debugging: Output the number of fully grown plants
        console.log(`Fully grown plants count: ${this.fullyGrownPlants}`);

        // Check if the scenario is completed
        this.checkvictoryCompletion();
        this.saveGameState(0, true);  // Slot 0 for auto-save
    }

    // Check if the play scenario is completed
    checkvictoryCompletion() {
        if (this.fullyGrownPlants >= 5 && !this.victoryScenario) {
            this.victoryScenario = true;
            console.log('Victory! At least 5 plants are fully grown.');
            this.msg_text.setText(`Day: ${this.days} - Scenario Completed!`);
        }
    }

    // method to check how many adjacent plants are of the same type
    getAdjacentSameTypePlants(tileX: number, tileY: number, plant: any): number {
        const neighbors = this.getNeighbors(tileX, tileY);
        let adjacentBonus = 0;
    
        for (const neighbor of neighbors) {
            const neighborTile = this.tileAttributes[neighbor.y][neighbor.x];
            if (neighborTile.plant && neighborTile.plant.name === plant.name) {
                adjacentBonus++; // Add to the bonus if the adjacent plant is of the same type
            }
        }
    
        return adjacentBonus; // Return the number of adjacent plants of the same type
    }

    // Determines if a plant can grow based on spatial rules
    canGrow(tileX: number, tileY: number): boolean {
        const neighbors = this.getNeighbors(tileX, tileY);
        let supportingPlants = 0;

        for (const neighbor of neighbors) {
            const neighborTile = this.tileAttributes[neighbor.y][neighbor.x];
            if (neighborTile.plant) {
                supportingPlants++;
            }
        }

        return supportingPlants >= 1; // Example rule: needs at least 1 neighboring plant
    }

    // Returns the coordinates of neighboring tiles
    getNeighbors(tileX: number, tileY: number): { x: number; y: number }[] {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // Up
            { x: 1, y: 0 },  // Right
            { x: 0, y: 1 },  // Down
            { x: -1, y: 0 }, // Left
        ];

        for (const dir of directions) {
            const nx = tileX + dir.x;
            const ny = tileY + dir.y;
            if (nx >= 0 && ny >= 0 && ny < this.tileAttributes.length && nx < this.tileAttributes[ny].length) {
                neighbors.push({ x: nx, y: ny });
            }
        }

        return neighbors;
    }
    
    refreshPlantGrowth() {
        for (let y = 0; y < this.tileAttributes.length; y++) {
            for (let x = 0; x < this.tileAttributes[y].length; x++) {
                const tile = this.tileAttributes[y][x];
                if (tile.plant) {
                    const plant = tile.plant;
                    const daysSincePlanted = this.days - plant.daysPlanted;
    
                    if (daysSincePlanted >= plant.growthTime) {
                        plant.growthStage = 2; // Fully grown
                        plant.hasReachedMaxGrowth = true;
                    } else if (daysSincePlanted >= plant.growthTime / 2) {
                        plant.growthStage = 1; // Half-grown
                    } else {
                        plant.growthStage = 0; // Seed/initial stage
                    }
                }
            }
        }
    }
    

    update() {
        this.player.setVelocity(0);

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-150);
            this.player.flipX = true;
            this.player.play('walk', true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(150);
            this.player.flipX = false;
            this.player.play('walk', true);
        } else if (this.cursors.up.isDown) {
            this.player.setVelocityY(-150);
            this.player.play('walk', true);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(150);
            this.player.play('walk', true);
        } else {
            this.player.anims.stop();
            this.player.setFrame(0);
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            this.advanceDay();
        }
        this.plantSprites.clear(true, true);

        for (let y = 0; y < this.tileAttributes.length; y++) {
            for (let x = 0; x < this.tileAttributes[y].length; x++) {
                const tile = this.tileAttributes[y][x];
                if (tile.plant) {
                    const plant = tile.plant;
                    const sprite = this.add.sprite(
                        this.offsetX + x * this.tileWidth + this.tileWidth / 2,
                        this.offsetY + y * this.tileHeight + this.tileHeight / 2,
                        plant.sprite
                    );

                    // Adjust scale based on growth stage
                    if (plant.growthStage === 0) {
                        sprite.setScale(0.25); // Smallest size
                    } else if (plant.growthStage === 1) {
                        sprite.setScale(0.35); // Mid size
                    } else if (plant.growthStage === 2) {
                        sprite.setScale(0.45); // Fully grown size
                    }

                    this.plantSprites.add(sprite);
                }
            }
        }
    }
}
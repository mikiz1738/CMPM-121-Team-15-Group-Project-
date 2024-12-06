import { Scene } from 'phaser';

export class Game extends Scene {
    // Declaring key variables for game elements
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.TileSprite;
    msg_text: Phaser.GameObjects.Text;
    hover_text: Phaser.GameObjects.Text;
    player: Phaser.Physics.Arcade.Sprite;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    selectedPlantType: number | null; // Keep track of the selected plant type
    plantButtons: Phaser.GameObjects.Container; // Container for plant buttons

    days: number;
    tileAttributes: { water: number; sunEnergy: number; plant: any }[][];
    tileWidth: number;
    tileHeight: number;
    offsetX: number;
    offsetY: number;
    plantSprites: Phaser.GameObjects.Group;
    
    victoryScenario: boolean = false; // Track if the scenario is completed
    fullyGrownPlants: number = 0; // Track the number of fully grown plants

    plantTypes = [
        { 
            name: 'Cactus', 
            requiredWater: 2, 
            requiredSunEnergy: 6, 
            growthTime: 12, 
            sprite: 'cactus' 
        },
        { 
            name: 'Sunflower', 
            requiredWater: 4, 
            requiredSunEnergy: 8, 
            growthTime: 10, 
            sprite: 'sunflower' 
        },
        { 
            name: 'Corn', 
            requiredWater: 8, 
            requiredSunEnergy: 4, 
            growthTime: 8, 
            sprite: 'corn' },
    ];

    constructor() {
        super('Game');
        this.days = 0;
        this.tileAttributes = [];
        this.tileWidth = 75;
        this.tileHeight = 75;
        this.offsetX = 0;
        this.offsetY = 0;
        this.selectedPlantType = null;
    }

    // Function to serialize the important states of each tilemap grid and day into a byte array (SoA format)
    serializeStateToByteArray(): Uint8Array {
        const waterArray: Float32Array = new Float32Array(this.tileAttributes.length * this.tileAttributes[0].length);
        const sunlightArray: Float32Array = new Float32Array(this.tileAttributes.length * this.tileAttributes[0].length);
        const plantArray: Int32Array = new Int32Array(this.tileAttributes.length * this.tileAttributes[0].length);
        
        let idx = 0;
        for (let y = 0; y < this.tileAttributes.length; y++) {
            for (let x = 0; x < this.tileAttributes[y].length; x++) {
                const tile = this.tileAttributes[y][x];
                waterArray[idx] = tile.water;
                sunlightArray[idx] = tile.sunEnergy;

                // Assuming plant is either null (0) or an object with a type number.
                if (tile.plant) {
                    plantArray[idx] = tile.plant.type;  // Or store a unique identifier if there are more attributes
                } else {
                    plantArray[idx] = -1;  // No plant in this tile
                }

                idx++;
            }
        }

        // Convert to byte array
        const byteArrays: Uint8Array[] = [];
        
        // Serialize the water array (Float32Array)
        byteArrays.push(new Uint8Array(waterArray.buffer));
        
        // Serialize the sunlight array (Float32Array)
        byteArrays.push(new Uint8Array(sunlightArray.buffer));
        
        // Serialize the plant array (Int32Array)
        byteArrays.push(new Uint8Array(plantArray.buffer));
        
        // Serialize the current day (Int32)
        const dayArray = new Int32Array(1);
        dayArray[0] = this.days;
        byteArrays.push(new Uint8Array(dayArray.buffer));

        // Combine all byte arrays into a single Uint8Array
        const totalLength = byteArrays.reduce((sum, arr) => sum + arr.length, 0);
        const result = new Uint8Array(totalLength);
        
        let offset = 0;
        for (const byteArray of byteArrays) {
            result.set(byteArray, offset);
            offset += byteArray.length;
        }

        return result;  // Return the final byte array
    }

    // Function to deserialize the byte array back into the game state
    deserializeStateFromByteArray(byteArray: Uint8Array) {
        const waterArray = new Float32Array(byteArray.buffer.slice(0, this.tileAttributes.length * this.tileAttributes[0].length * 4));
        const sunlightArray = new Float32Array(byteArray.buffer.slice(this.tileAttributes.length * this.tileAttributes[0].length * 4, this.tileAttributes.length * this.tileAttributes[0].length * 8));
        const plantArray = new Int32Array(byteArray.buffer.slice(this.tileAttributes.length * this.tileAttributes[0].length * 8, this.tileAttributes.length * this.tileAttributes[0].length * 12));
        const dayArray = new Int32Array(byteArray.buffer.slice(this.tileAttributes.length * this.tileAttributes[0].length * 12));

        let idx = 0;
        for (let y = 0; y < this.tileAttributes.length; y++) {
            for (let x = 0; x < this.tileAttributes[y].length; x++) {
                const tile = this.tileAttributes[y][x];
                tile.water = waterArray[idx];
                tile.sunEnergy = sunlightArray[idx];
                
                if (plantArray[idx] !== -1) {
                    tile.plant = { type: plantArray[idx], growthStage: 0, daysPlanted: this.days };  // You may want to initialize more plant attributes here.
                } else {
                    tile.plant = null;
                }

                idx++;
            }
        }

        // Restore the day
        this.days = dayArray[0];
    }

    saveGameState() {
        // Serialize the current game state into a byte array
        const byteArray = this.serializeStateToByteArray();
    
        // Convert the byte array into a base64 string for storage (localStorage can't store raw byte arrays directly)
        const base64String = btoa(String.fromCharCode(...byteArray));
    
        // Store the base64 string in localStorage (or any other storage method you prefer)
        localStorage.setItem('gameState', base64String);
    
        console.log('Game state saved!');
    }

    // Function to load the game state when a button is pressed
    loadGameState() {
        // Retrieve the base64 string from localStorage
        const base64String = localStorage.getItem('gameState');

        // If there's no saved state, return early
        if (!base64String) {
            console.log('No saved game state found.');
            return;
        }

        // Convert the base64 string back into a byte array
        const byteArray = new Uint8Array(atob(base64String).split('').map(char => char.charCodeAt(0)));

        // Deserialize the byte array to restore the game state
        this.deserializeStateFromByteArray(byteArray);

        console.log('Game state loaded!');
    }



    create() {

        this.camera = this.cameras.main;

        this.background = this.add.tileSprite(0, 0, 1024, 768, 'background').setOrigin(0, 0);
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

        const saveButton = this.add.text(800, 10, 'Save Game', {
            fontSize: '32px',
            color: '#000000',
            backgroundColor: '#00ff00',
            padding: { x: 20, y: 10 }
        })
        .setInteractive()
        .setOrigin(0,0)
        .on('pointerdown', () => this.saveGameState());

        // Create load button
        const loadButton = this.add.text(500, 10, 'Load Game', {
            fontSize: '32px',
            color: '#000000',
            backgroundColor: '#ff0000',
            padding: { x: 20, y: 10 }
        })
        .setInteractive()
        .setOrigin(0,0)
        .on('pointerdown', () => this.loadGameState());

        // Optionally, add a hover effect
        saveButton.on('pointerover', () => saveButton.setStyle({ fill: '#ff0' }));
        saveButton.on('pointerout', () => saveButton.setStyle({ fill: '#fff' }));

        loadButton.on('pointerover', () => loadButton.setStyle({ fill: '#ff0' }));
        loadButton.on('pointerout', () => loadButton.setStyle({ fill: '#fff' }));

        // Create an animation for walking
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('player', { start: 1, end: 5 }),
            frameRate: 10,
            repeat: -1,
        });

        // Add the player's sprite to the scene
        this.player = this.physics.add.sprite(this.scale.width / 2, this.scale.height / 2, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(2);

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

        // Define the player's movement keys (WASD + space for advancing day)
        this.cursors = this.input.keyboard?.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
        }) as Phaser.Types.Input.Keyboard.CursorKeys;

        this.plantSprites = this.add.group();

        // Display tile information when hovering
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            this.handlePointerHover(pointer);
        });

        this.createPlantButtons();

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

    // Creates buttons for each plant type for the player to select
    createPlantButtons() {
        const buttonWidth = 120;
        const buttonHeight = 40;
        const spacing = 10;
        const startX = 20;
        const startY = this.scale.height - (this.plantTypes.length * (buttonHeight + spacing)) - 20;

        this.plantButtons = this.add.container();

        this.plantTypes.forEach((plant, index) => {
            const y = startY + index * (buttonHeight + spacing);

            // Button background
            const buttonBg = this.add.rectangle(startX, y, buttonWidth, buttonHeight, 0x222222)
                .setOrigin(0, 0)
                .setInteractive({ useHandCursor: true }); // Makes it clickable

            // Button text
            const buttonText = this.add.text(startX + 10, y + 10, plant.name, {
                font: '18px Arial',
                color: '#ffffff',
            });

            // Add click listener
            buttonBg.on('pointerdown', () => {
                this.selectedPlantType = index; // Set the selected plant type
                console.log(`Selected plant: ${plant.name}`);
                this.updateButtonHighlights(); // Highlight the selected button
            });

            this.plantButtons.add(buttonBg);
            this.plantButtons.add(buttonText);
        });
    }

    // Updates the appearance of the plant buttons to highlight the currently selected one
    updateButtonHighlights() {
        this.plantButtons.each((child: Phaser.GameObjects.GameObject) => {
            if (child instanceof Phaser.GameObjects.Rectangle) {
                // Reset all button colors
                child.setFillStyle(0x222222);
            }
        });
    
        // Highlight the selected button
        const selectedButtonIndex = this.selectedPlantType;
        if (selectedButtonIndex !== null) {
            const buttonBg = this.plantButtons.getAt(selectedButtonIndex * 2) as Phaser.GameObjects.Rectangle;
            buttonBg.setFillStyle(0x5555ff); // Highlight color
        }
    }

    // Initializes tile attributes like water and sunlight levels, and sets plants to null
    initializeTileAttributes(level: number[][]) {
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

    advanceDay() {
        this.days++;
        this.msg_text.setText(`Day: ${this.days}`);

        for (let y = 0; y < this.tileAttributes.length; y++) {
            for (let x = 0; x < this.tileAttributes[y].length; x++) {
                const tile = this.tileAttributes[y][x];

                // Update sunlight and water
                tile.sunEnergy = Math.random() * 10;
                tile.water = Math.min(10, tile.water + Math.random() * 2);

                if (tile.plant) {
                    const plant = tile.plant;
                    const daysSincePlanted = this.days - plant.daysPlanted;

                    // Check if plant has already fully grown
                    if (plant.growthStage === 2) {
                        // If the plant is fully grown, ensure it is only counted once
                        if (!plant.hasReachedMaxGrowth) {
                            this.fullyGrownPlants++; // Increment fully grown plant count
                            plant.hasReachedMaxGrowth = true; // Mark as fully grown
                        }
                        continue; // Skip the growth stage calculation for fully grown plants
                    }

                    // Check for the adjacent buddy boost
                    const adjacentBonus = this.getAdjacentSameTypePlants(x, y, plant);
                    const growthMultiplier = 1 - 0.5 * adjacentBonus; // Reduce growth time by 5% per adjacent plant

                    // Apply the growth multiplier to the original growth time
                    const boostedGrowthTime = plant.growthTime * growthMultiplier;

                    // Ensure plant's growth time is not negative
                    const effectiveGrowthTime = Math.max(boostedGrowthTime, 1);

                    // Check if growth conditions are met
                    if (daysSincePlanted >= effectiveGrowthTime && plant.growthStage < 2) {
                        plant.growthStage = 2; // Fully grown
                        if (!plant.hasReachedMaxGrowth) {
                            this.fullyGrownPlants++; // Increment fully grown plant count if it hasn't already been counted
                            plant.hasReachedMaxGrowth = true; // Mark as fully grown
                        }
                    } else if (daysSincePlanted >= effectiveGrowthTime / 2) {
                        plant.growthStage = 1; // Half-grown
                    } else {
                        plant.growthStage = 0; // Seed/initial stage
                    }
                }
            }
        }

        // Debugging: Output the number of fully grown plants
        console.log(`Fully grown plants count: ${this.fullyGrownPlants}`);

        // Check if the scenario is completed
        this.checkvictoryCompletion();
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

    // Displays information about the tile under the cursor when hovering
    handlePointerHover(pointer: Phaser.Input.Pointer) {
        const tileX = Math.floor((pointer.x - this.offsetX) / this.tileWidth);
        const tileY = Math.floor((pointer.y - this.offsetY) / this.tileHeight);

        if (
            tileX >= 0 &&
            tileY >= 0 &&
            tileY < this.tileAttributes.length &&
            tileX < this.tileAttributes[tileY].length
        ) {
            const tile = this.tileAttributes[tileY][tileX];
            this.hover_text.setText(
                `Sun: ${tile.sunEnergy.toFixed(2)}\nWater: ${tile.water.toFixed(2)}${
                    tile.plant ? `\nPlant: ${tile.plant.name} (Stage: ${tile.plant.growthStage})` : ''
                }`
            );
            this.hover_text.setPosition(pointer.x + 10, pointer.y + 10);
            this.hover_text.setVisible(true);
        } else {
            this.hover_text.setVisible(false);
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

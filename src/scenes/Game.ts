import { Scene } from 'phaser';

export class Game extends Scene {
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

    plantTypes = [
        { name: 'Cactus', requiredWater: 2, requiredSunEnergy: 6, growthTime: 3, sprite: 'cactus' },
        { name: 'Sunflower', requiredWater: 4, requiredSunEnergy: 8, growthTime: 5, sprite: 'sunflower' },
        { name: 'Corn', requiredWater: 8, requiredSunEnergy: 4, growthTime: 7, sprite: 'corn' },
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

    create() {
        this.camera = this.cameras.main;

        this.background = this.add.tileSprite(0, 0, 1024, 768, 'background').setOrigin(0, 0);
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

        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('player', { start: 1, end: 5 }),
            frameRate: 10,
            repeat: -1,
        });

        this.player = this.physics.add.sprite(this.scale.width / 2, this.scale.height / 2, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(2);

        this.msg_text = this.add.text(10, 10, `Day: ${this.days}`, {
            font: '18px Arial',
            color: '#ffffff',
        });

        this.hover_text = this.add.text(0, 0, '', {
            font: '16px Arial',
            color: '#ffcc00',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 },
        }).setVisible(false);

        this.cursors = this.input.keyboard?.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
        }) as Phaser.Types.Input.Keyboard.CursorKeys;

        this.plantSprites = this.add.group();

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            this.handlePointerHover(pointer);
        });

        this.createPlantButtons();

        // Pointer down listener for planting
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const tileX = Math.floor((pointer.x - this.offsetX) / this.tileWidth);
            const tileY = Math.floor((pointer.y - this.offsetY) / this.tileHeight);

            if (
                tileX >= 0 &&
                tileY >= 0 &&
                tileY < this.tileAttributes.length &&
                tileX < this.tileAttributes[tileY].length &&
                this.selectedPlantType !== null
            ) {
                this.plant(tileX, tileY, this.selectedPlantType);
            }
        });
    }

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

    plant(tileX: number, tileY: number, plantType: number) {
        const tile = this.tileAttributes[tileY][tileX];
        const plant = this.plantTypes[plantType];

        if (tile.plant) {
            console.log('Tile already has a plant!');
            return;
        }

        if (tile.water >= plant.requiredWater && tile.sunEnergy >= plant.requiredSunEnergy) {
            tile.plant = { ...plant, growthStage: 0, daysPlanted: this.days };
            console.log(`Planted ${plant.name} at (${tileX}, ${tileY})`);
        } else {
            console.log('Insufficient resources to plant here!');
        }
    }

    advanceDay() {
        this.days++;
        this.msg_text.setText(`Day: ${this.days}`);

        for (let y = 0; y < this.tileAttributes.length; y++) {
            for (let x = 0; x < this.tileAttributes[y].length; x++) {
                const tile = this.tileAttributes[y][x];

                tile.sunEnergy = Math.random() * 10;
                tile.water = Math.min(10, tile.water + Math.random() * 2);

                if (tile.plant) {
                    const plant = tile.plant;
                    if (this.days - plant.daysPlanted >= plant.growthTime) {
                        plant.growthStage = 2; // Fully grown
                    } else if (this.days - plant.daysPlanted >= plant.growthTime / 2) {
                        plant.growthStage = 1; // Half-grown
                    }
                }
            }
        }
    }

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
                    sprite.setScale(0.5);
                    this.plantSprites.add(sprite);
                }
            }
        }
    }
}

import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene
{
    background: GameObjects.TileSprite;
    logo: GameObjects.Image;
    title: GameObjects.Text;

    constructor ()
    {
        super('MainMenu');
    }

    // Start the game with the selected mode
    startGame(mode: string) {
    // Load the externalDSL for the selected mode
        this.loadexternalDSL(mode);
    }
        
    loadexternalDSL(mode: string) {
    // Load externalDSL.json (could be from a local file or server)
        fetch('src/externalDSL.json')
        .then(response => response.json())
        .then(externalDSL => {
            const selectedexternalDSL = mode === 'tutorial' ? externalDSL.tutorial : externalDSL.normal;
            this.scene.start('Game', { mode: mode, externalDSL: selectedexternalDSL });
            })
            .catch(error => {
                console.error('Error loading ExternalDSL:', error);
                });
    }

    create ()
    {
        this.background = this.add.tileSprite(0, 0, 1024, 768, 'background').setOrigin(0,0);

        this.title = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Harvest Festival!', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffb508',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // this.input.once('pointerdown', () => {

        //     this.scene.start('Game');

        // });

        // Create buttons for Normal Mode and Tutorial Mode
        const normalButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, 'Normal Mode', { 
            font: '32px Arial', 
            stroke: '#000000', strokeThickness: 8
        })
        .setOrigin(0.5) // Set origin to center
        .setInteractive();

        const tutorialButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 100, 'Tutorial Mode', { 
            font: '32px Arial', 
            color: '#08ffb1',
            stroke: '#000000', strokeThickness: 8
        })
        .setOrigin(0.5) // Set origin to center
        .setInteractive();
        
        normalButton.on('pointerdown', () => {
            this.startGame('normal');
        });
        
        tutorialButton.on('pointerdown', () => {
            this.startGame('tutorial');
        });
    }
}

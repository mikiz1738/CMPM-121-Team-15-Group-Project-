import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        this.load.image('background', 'assets/Grass_Tile.gif')
        this.load.image('dirt', 'assets/Dirt Tile.gif')
        this.load.spritesheet('player', 'assets/PigWalk.png', {
            frameWidth: 240, // Width of each frame in the spritesheet
            frameHeight: 330 // Height of each frame in the spritesheet
        });
        this.load.image('cactus', 'assets/Cactus.gif')
        this.load.image('sunflower', 'assets/Sunflower.gif')
        this.load.image('corn', 'assets/Corn.gif')
        this.load.json('externalDSL', '../src/externalDSL.json')
    }

    create ()
    {
        this.scene.start('Preloader');
    }
}

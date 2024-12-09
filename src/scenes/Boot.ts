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

        this.load.image('background', 'assets/tempgrassbg.png')
        this.load.image('dirt', 'assets/tempdirt.png')
        this.load.spritesheet('player', 'assets/Woman_Walk.png', {
            frameWidth: 22, // Width of each frame in the spritesheet
            frameHeight: 33 // Height of each frame in the spritesheet
        });
        this.load.image('cactus', 'assets/tempplant2.png')
        this.load.image('sunflower', 'assets/tempplant1.png')
        this.load.image('corn', 'assets/tempplant3.png')
        this.load.json('config', 'config.json')
    }

    create ()
    {
        this.scene.start('Preloader');
    }
}

import i18next from './Internalization';

export class HelpScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HelpScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#7702c4'); // Set background color to black

        const englishButton = this.add.text(100, 100, 'English', { fontSize: '20px'})
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.changeLanguage('en'));

        const chineseButton = this.add.text(100, 170, '中文', { fontSize: '20px' })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.changeLanguage('zh'));

        const arabicButton = this.add.text(100, 240, 'العربية', { fontSize: '20px'})
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.changeLanguage('ar'));

        const instructionsText = this.add.text(100, 400, i18next.t('instructions'), { fontSize: '20px' })
            .setName('instructions');  // Set name to 'instructions'

        const displayText = this.add.text(100, 500, i18next.t('display'), { fontSize: '20px' })
            .setName('display');  // Set name to 'display'

        // Create the "Return to Game" button and set a unique name
        const returnButton = this.add.text(this.scale.width / 2, this.scale.height - 50, i18next.t('ReturntoGame'), {
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#0077ff',
            padding: { x: 10, y: 5 },
        })
        .setOrigin(0.5)
        .setInteractive()
        .setName('returnButton')  // Set name to 'returnButton'
        .on('pointerdown', () => {
            this.scene.stop(); // Stop the Help Scene
            this.scene.resume('Game'); // Resume the game scene
        });

        // Optionally, you can style the buttons
        englishButton.setBackgroundColor('#0000FF');
        chineseButton.setBackgroundColor('#FF0000');
        arabicButton.setBackgroundColor('#00FF00');
    }

    // Function to change language
    changeLanguage(languageCode: string) {
        i18next.changeLanguage(languageCode, (err, t) => {
            if (err) {
                console.error('Error changing language:', err);
            } else {
                // Optionally, update UI texts based on the new language
                console.log('Language changed to:', languageCode);
                this.updateUI();
            }
        });
    }

    updateUI() {
        const instructionsText = this.children.getByName('instructions') as Phaser.GameObjects.Text | null;
        const displayText = this.children.getByName('display') as Phaser.GameObjects.Text | null;
        const returnButton = this.children.getByName('returnButton') as Phaser.GameObjects.Text | null;

        // Check if the text objects exist and update their texts
        if (instructionsText && displayText && returnButton) {
            instructionsText.setText(i18next.t('instructions'));
            displayText.setText(i18next.t('display'));
            returnButton.setText(i18next.t('ReturntoGame')); // Update the "Return to Game" button text
        } else {
            console.warn('Text objects not found!');
        }
    }
}

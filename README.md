# Devlog Entry - 11/21/24

### Tools Lead: Justin Xu
### Engine Lead: Michael Wong
### Design Lead: Vivian Kim

## Tools and Materials
 1. Our group has decided to use the phaser framework since we are most familiar with it through our experiences in CMPM 120 and CMPM 121. We believe that this framework is the most efficient way to create our game since it supports a diverse range of game genres and functionalities so that we don't have to develop those tools ourselves. Phaser also has a built in physics engine, which we believe will be useful as well. Furthermore, we also plan on using tween in order to support animation for sprites and other visual elements in our game.

 2. The programming languages which we will be using are typescript, javascript, css, and html. We choose javascript and typescript because these are the langauges which our game framework supports. Html and css are used along with javascript and typescript to define the formatting and contents which are displayed on the web browser. Javascript and typescript were also chosen because it makes it easier when we have to alternate our platform choice.

 3. For our project, we plan to use Adobe Photoshop for creating detailed visual assets and Aseprite for designing pixel art. Photoshop is ideal for creating high-quality textures, backgrounds, and other 2D elements due to its robust set of tools and layering tools, which make it versatile for different styles of digital art. Aseprite, on the other hand, is specifically tailored for pixel art and animations, making it perfect for crafting retro-style sprites and characters. These tools were chosen because they align with the artistic direction of our game, and we have various levels of familiarity with the tool. This combination ensures we can efficiently create assets while also developing our team's skills.

 4. For our alternate platform, we plan to develop the game using Phaser but replace TypeScript with JavaScript as the primary programming language, alongside HTML and CSS for user interfaces and styling. This shift allows us to compare the advantages and trade-offs between TypeScript JavaScript. While TypeScript provides enhanced code safety and tooling benefits, JavaScript enables faster prototyping and broader accessibility for web-based deployment. By leveraging HTML and CSS, we can further enhance the user experience, tailoring the game interface for browser compatibility. By maintaining the same game framework across platforms, we can focus on exploring the impacts of language choices and front-end technologies on workflow, game performance, and overall development efficiency.

## Outlook
 Our team hopes to explore an unique game mechanic that sets us apart from other teams, focusing on an innovative interaction with the game world that may not be as commonly attempted. While the specifics are still evolving, we aim to create a mechanic that offers both strategic depth and simplicity, where players make meaningful decisions that impact the progression of the game. This could involve elements like resource management, spatial relationships, or time-based actions, all designed to provide a fresh gameplay experience. By focusing on a mechanic that is both approachable and engaging, we hope to offer something different that enhances the overall game experience while aligning with our team's goals of simplicity and efficiency.
 We anticipate that the most difficult aspect of this project is the sheer scale of it. Our group has very limited experience implementing and creating a game with so many elements as we have mostly been constrained to prototyping.
 We are hoping to learn more about implementing our ideas through our chosen framework, phaser, by building upon the knowledge and skills developed throughout CMPM 120 and CMPM 121. In addition, we hope to challenge ourselves outside of our comfort zone to transition from one language to another in an attempt to diversify our toolkits and help us to become more adaptable and flexible programmers.

[F0.a] You control a character moving over a 2D grid: In our game, the player controls a character (or avatar) that can navigate a 2D grid. The grid is represented visually, and the character is able to move across this grid based on player input. Movement is restricted to adjacent grid cells, allowing the character to interact with nearby plants, water sources, and sunlight levels.

[F0.b] You advance time manually in the turn-based simulation: Time in the game advances in a turn-based manner. Each day is represented as a discrete turn, and the player manually advances time by pressing the space bar to "advance the day." This causes all the plants and other elements on the grid to update according to the time progression, such as growth and changes in sun and water levels.

[F0.c] You can reap or sow plants on grid cells only when you are near them: The player can only interact with plants by sowing or reaping them when their character is adjacent to the corresponding grid cell. This ensures that interactions with plants are spatially constrained, and the player must be near the plant to perform actions like planting or harvesting.

[F0.d] Grid cells have sun and water levels. The incoming sun and water for each cell is somehow randomly generated each turn. Sun energy cannot be stored in a cell (it is used immediately or lost) while water moisture can be slowly accumulated over several turns: Each grid cell has a sun energy and water moisture level that is randomly generated each turn. Sun energy is immediately consumed or lost as the day progresses, while water moisture accumulates over several turns. This dynamic affects plant growth, with plants requiring a certain amount of sun and water to grow. The system ensures that sun energy cannot be stored, while water can accumulate and be used over time, creating strategic gameplay.

[F0.e] Each plant on the grid has a distinct type (e.g. one of 3 species) and a growth level (e.g. “level 1”, “level 2”, “level 3”): Every plant on the grid is assigned a type (e.g., plant species) and a growth level. The plants are dynamically categorized into growth stages, ranging from sprout (level 0) to fully grown (level 2). Each plant’s growth progress is tracked, and the player can observe the changes as time progresses. The plant type and growth stage determine how a plant reacts to sun, water, and nearby plants.

[F0.f] Plants grow based on the amount of sunlight and water they receive, and the proximity of other plants can either help their growth. 
Ours is called an Adjacent Buddy Boost where if a plant is next to another plant of the same type, it grows faster. (Cuts half the time to grow)

[F0.g] The play scenario is completed when a specific condition is met, such as having a certain number of plants (e.g., 5) fully grown (growth stage 2). The system tracks the number of plants that have reached the required growth level, and once the condition is satisfied, the scenario is considered complete, and the player is notified of their success.

[F1.a] The important state of the game's grid is backed by a Structure-of-Arrays (SoA) format. Each piece of the grid, such as plant types, growth stages, and environmental factors (e.g., soil moisture), is stored as a separate array. This allows for efficient updates and access patterns. The primary grid is encoded in this SoA format, and when needed, auxiliary structures such as visual representations of the grid or metadata are decoded from it on the fly.

[F1.b] The player can manually save their progress through an in-game menu that allows them to name, save, and load their game. Multiple 3 save slots are available, each one representing a separate save file with unique state data, ensuring that players can load from their last progress point even after quitting the game. Each save file contains a snapshot of the entire game state, including the grid and player progress.

[F1.c] The game has an auto-save system that automatically saves the current game state at regular intervals or when certain milestones are reached. Upon restarting the game, if an auto-save file exists, the player is prompted with a message asking whether they want to continue from where they left off. The auto-save file can be managed alongside manual save files.

[F1.d] An undo/redo system is in place, allowing the player to undo every major choice, such as planting up to the start of the game. The player can also redo any actions that were undone, enabling them to experiment. The undo history is stored and persisted in a manner that supports both manual saves and auto-saves.

Reflection (F0):
Looking back on how we achieved the F0 requirements, our initial plan has evolved somewhat in response to challenges and new insights during development. At the start, we focused heavily on implementing basic movement and plant interactions, but we quickly realized that the requirements called for more complex systems like balancing the growth mechanics with sun and water resources.

As we worked on the game, we also reconsidered some of our tools and materials. For example, we initially thought we could handle all plant growth and grid cell updates in a simple loop, but we ended up using flags and more intricate condition-checking logic to ensure that growth stages were tracked accurately and the scenario completion was triggered correctly.

Reflection (F1):
In the beginning of our development process, we focused on implementing basic features like plant growth and grid management. The F1 requirements, which include manual saving, auto-saving, and undo/redo, have guided us to think more deeply about the core mechanics and data management in our game. We initially thought our grid state management would be simple, but as we incorporated more complex systems, we realized we needed a more efficient way to store and access state. This led to adopting a single contiguous byte array for our grid state in AoS format, which allows us to track and decode plant growth and other attributes efficiently.

While our choice of development tools (TypeScript with Phaser) has remained the same, we’ve adjusted our approach to handling game state and saving mechanics. Initially, we planned to implement a straightforward save/load system, but we’ve since incorporated a more robust auto-save feature to prevent players from losing progress unexpectedly. This means that instead of just saving on explicit player actions, we now automatically save at regular intervals and whenever major events occur, such as completing a day cycle. This change required us to implement a more sophisticated system for handling save files, allowing the player to load from multiple save slots and continue their game where they left off.

The most significant shift in our design came with giving the player control over their actions with undo/redo features. This has made us rethink how we present feedback to the player, ensuring that the interface is intuitive and that the player is clearly informed of the consequences of their actions.
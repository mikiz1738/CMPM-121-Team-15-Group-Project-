import externalDSL from '../src/externalDSL.json' with {type: "json"}; 

export interface Plant {
    name: string;
    requiredWater: number;
    requiredSunEnergy: number;
    growthTime: number;
    sprite: string;
    growthStage: number;
    daysPlanted: number;
    hasReachedMaxGrowth: boolean;
}

// Internal DSL class
export class InternalDSL {
  static fromJSON(json: string) {
      const data = JSON.parse(json);
      return new InternalDSL(data);
  }

  plants: Plant[];

  constructor(data: any) {
      this.plants = data.plants.map((plantData: any) => this.createPlant(plantData));
  }

  // Helper function to map the external data to our Plant structure
  private createPlant(data: any): Plant {
      return {
          name: data.name,
          requiredWater: data.requiredWater,
          requiredSunEnergy: data.requiredSunEnergy,
          growthTime: data.growthTime,
          sprite: data.sprite,
          growthStage: data.growthStage,
          daysPlanted: data.daysPlanted,
          hasReachedMaxGrowth: data.hasReachedMaxGrowth,
      };
  }
}

export const internalDSL = InternalDSL.fromJSON(JSON.stringify(externalDSL));
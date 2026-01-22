import { mapCellColors } from "../map-cell-colors.js";
import { MapAir, MapAirDepth } from "./map-air.js";

export class MapAirSky extends MapAir {
    constructor(light: number, id = 0) {
        super(light, id, MapAirDepth.Sky);
    }

    public getColorInternal() {
        return mapCellColors.skyColors[this.id];
    }

    public copyWithLight(light: number) {
        return new MapAirSky(light, this.id);
    }

    public toString() {
        if (this.id < mapCellColors.maxSkyGradients) {
            return `${super.toString()} - Surface Layer - shade ${this.id}`;
        } else {
            return `${super.toString()} - Underworld Layer`;
        }
    }
}
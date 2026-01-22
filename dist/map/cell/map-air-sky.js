import { mapCellColors } from "../map-cell-colors.js";
import { MapAir, MapAirDepth } from "./map-air.js";
export class MapAirSky extends MapAir {
    constructor(light, id = 0) {
        super(light, id, MapAirDepth.Sky);
    }
    getColorInternal() {
        return mapCellColors.skyColors[this.id];
    }
    copyWithLight(light) {
        return new MapAirSky(light, this.id);
    }
    toString() {
        if (this.id < mapCellColors.maxSkyGradients) {
            return `${super.toString()} - Surface Layer - shade ${this.id}`;
        }
        else {
            return `${super.toString()} - Underworld Layer`;
        }
    }
}

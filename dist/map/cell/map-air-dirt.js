import { mapCellColors } from "../map-cell-colors.js";
import { MapAir, MapAirDepth } from "./map-air.js";
export class MapAirDirt extends MapAir {
    constructor(light, id) {
        super(light, id, MapAirDepth.Dirt);
    }
    getColorInternal() {
        return mapCellColors.dirtColors[this.id];
    }
    copyWithLight(light) {
        return new MapAirDirt(light, this.id);
    }
    toString() {
        return `${super.toString()} - Underground Layer - shade ${this.id}`;
    }
}

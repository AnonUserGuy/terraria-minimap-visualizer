import { mapCellColors } from "../map-cell-colors.js";
import { MapAir, MapAirDepth } from "./map-air.js";
export class MapAirRock extends MapAir {
    constructor(light, id) {
        super(light, id, MapAirDepth.Rock);
    }
    getColorInternal() {
        return mapCellColors.rockColors[this.id];
    }
    copyWithLight(light) {
        return new MapAirRock(light, this.id);
    }
    toString() {
        return `${super.toString()} - Caverns Layer - shade ${this.id}`;
    }
}

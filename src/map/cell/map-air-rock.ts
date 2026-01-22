import { mapCellColors } from "../map-cell-colors.js";
import { MapAir, MapAirDepth } from "./map-air.js";

export class MapAirRock extends MapAir {
    constructor(light: number, id: number) {
        super(light, id, MapAirDepth.Rock);
    }

    public getColorInternal() {
        return mapCellColors.rockColors[this.id];
    }

    public copyWithLight(light: number) {
        return new MapAirRock(light, this.id);
    }

    public toString() {
        return `${super.toString()} - Caverns Layer - shade ${this.id}`;
    }
}
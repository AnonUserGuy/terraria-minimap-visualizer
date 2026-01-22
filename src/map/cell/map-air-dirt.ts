import { mapCellColors } from "../map-cell-colors.js";
import { MapAir, MapAirDepth } from "./map-air.js";

export class MapAirDirt extends MapAir {
    constructor(light: number, id: number) {
        super(light, id, MapAirDepth.Dirt);
    }

    public getColorInternal() {
        return mapCellColors.dirtColors[this.id];
    }

    public copyWithLight(light: number) {
        return new MapAirDirt(light, this.id);
    }

    public toString() {
        return `${super.toString()} - Underground Layer - shade ${this.id}`;
    }
}
import { LiquidID } from "../../id/liquid-ids.js";
import { mapCellColors } from "../map-cell-colors.js";
import { MapCell, MapCellGroup } from "./map-cell.js";

export class MapLiquid extends MapCell {
    public id: LiquidID

    constructor(light: number, id: LiquidID) {
        super(light, MapCellGroup.Liquid, id);
    }

    public getColorInternal() {
        return mapCellColors.liquidColors[this.id];
    }

    public copyWithLight(light: number) {
        return new MapLiquid(light, this.id);
    }

    public toString() {
        return `${super.toString()} - ${LiquidID[this.id]} (${this.id})`;
    }
}
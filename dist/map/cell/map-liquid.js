import { LiquidID } from "../../id/liquid-ids.js";
import { mapCellColors } from "../map-cell-colors.js";
import { MapCell, MapCellGroup } from "./map-cell.js";
export class MapLiquid extends MapCell {
    constructor(light, id) {
        super(light, MapCellGroup.Liquid, id);
    }
    getColorInternal() {
        return mapCellColors.liquidColors[this.id];
    }
    copyWithLight(light) {
        return new MapLiquid(light, this.id);
    }
    toString() {
        return `${super.toString()} - ${LiquidID[this.id]} (${this.id})`;
    }
}

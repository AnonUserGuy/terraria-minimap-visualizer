import { LiquidID } from "../../id/liquid-ids.js";
import { MapCell, MapCellGroup } from "./map-cell.js";

export class MapLiquid extends MapCell {
    public id: LiquidID

    constructor(light: number, id: LiquidID) {
        super(light, MapCellGroup.Liquid, id);
    }

    public copyWithLight(light: number) {
        return new MapLiquid(light, this.id);
    }
}
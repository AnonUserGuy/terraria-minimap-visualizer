import { LiquidID } from "../../id/liquid-ids.js";
import { MapCell } from "./map-cell.js";
export declare class MapLiquid extends MapCell {
    id: LiquidID;
    constructor(light: number, id: LiquidID);
    copyWithLight(light: number): MapLiquid;
}

import { LiquidID } from "../../id/liquid-ids.js";
import { MapCell } from "./map-cell.js";
export declare class MapLiquid extends MapCell {
    id: LiquidID;
    constructor(light: number, id: LiquidID);
    getColorInternal(): import("../../net/color.js").Color;
    copyWithLight(light: number): MapLiquid;
    toString(): string;
}

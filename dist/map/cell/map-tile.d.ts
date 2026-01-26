import { MapCellPaintable } from "./map-cell-paintable.js";
export declare class MapTile extends MapCellPaintable {
    constructor(light: number, id: number, option?: number, paint?: number);
    copyWithLight(light: number): MapTile;
}

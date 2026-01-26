import { MapCellPaintable } from "./map-cell-paintable.js";
export declare class MapWall extends MapCellPaintable {
    constructor(light: number, id: number, option?: number, paint?: number);
    copyWithLight(light: number): MapWall;
}

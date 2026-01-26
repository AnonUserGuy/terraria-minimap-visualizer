import { MapCell, MapCellGroup } from "./map-cell.js";
export declare class MapCellPaintable extends MapCell {
    option: number;
    paint: number;
    constructor(light: number, group: MapCellGroup, id: number, option?: number, paint?: number);
    copyWithLight(light: number): MapCellPaintable;
    equals(other: MapCellPaintable): boolean;
    equalsWithoutLight(other: MapCellPaintable): boolean;
}

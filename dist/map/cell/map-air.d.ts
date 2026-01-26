import { MapCell } from "./map-cell.js";
export declare class MapAir extends MapCell {
    constructor(light: number, id: number);
    copyWithLight(light: number): MapAir;
    equals(other: MapAir): boolean;
    equalsWithoutLight(other: MapAir): boolean;
    equalsAfterExport(other: MapAir): boolean;
}

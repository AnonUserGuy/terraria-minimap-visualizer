import { MapCell } from "./map-cell";
export declare enum MapAirDepth {
    Sky = 0,
    Dirt = 1,
    Rock = 2
}
export declare class MapAir extends MapCell {
    depth: MapAirDepth;
    constructor(light: number, id: number, depth: MapAirDepth);
    copyWithLight(light: number): MapAir;
    equals(other: MapAir): boolean;
    equalsWithoutLight(other: MapAir): boolean;
    equalsAfterExport(other: MapCell): boolean;
    toString(): string;
}

import { MapAir } from "./map-air.js";
export declare class MapAirSky extends MapAir {
    constructor(light: number, id?: number);
    getColorInternal(): import("../../net/color.js").Color;
    copyWithLight(light: number): MapAirSky;
    toString(): string;
}

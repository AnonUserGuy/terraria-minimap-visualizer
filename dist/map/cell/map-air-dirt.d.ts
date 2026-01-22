import { MapAir } from "./map-air.js";
export declare class MapAirDirt extends MapAir {
    constructor(light: number, id: number);
    getColorInternal(): import("../../net/color.js").Color;
    copyWithLight(light: number): MapAirDirt;
    toString(): string;
}

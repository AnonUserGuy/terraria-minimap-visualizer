import { MapAir } from "./map-air.js";
export declare class MapAirRock extends MapAir {
    constructor(light: number, id: number);
    getColorInternal(): import("../../net/color.js").Color;
    copyWithLight(light: number): MapAirRock;
    toString(): string;
}

import { PaintID } from "../../id/paint-ids";
import { WallID } from "../../id/wall-ids";
import { MapCellPaintable } from "./map-cell-paintable.js";
export declare class MapWall extends MapCellPaintable {
    id: WallID;
    static anyWall: MapWall;
    constructor(light: number, id: WallID, option?: number, paint?: PaintID);
    getColorInternal(): import("../../net/color").Color;
    copyWithLight(light: number): MapWall;
    toString(): string;
}

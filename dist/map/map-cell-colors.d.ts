import { Color } from "../net/color.js";
import { MapCellGroup } from "./cell/map-cell.js";
import { PaintID } from "../id/paint-ids.js";
export declare class mapCellColors {
    static maxSkyGradients: number;
    static maxDirtGradients: number;
    static maxRockGradients: number;
    static tileColors: Color[][];
    static wallColors: Color[][];
    static liquidColors: Color[];
    static skyColors: Color[];
    static dirtColors: Color[];
    static rockColors: Color[];
    static paintColors: Color[];
    private static initTileColors;
    private static initWallColors;
    private static initLiquidColors;
    private static initAirColors;
    private static initPaintColors;
    static applyPaint(group: MapCellGroup, color: Color, paintId: PaintID): Color;
    static getSkyId(y: number, worldSurface: number): number;
}

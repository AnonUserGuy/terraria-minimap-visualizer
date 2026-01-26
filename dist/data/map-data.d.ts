import { Color } from "../net/color.js";
import { MapCellGroup } from "../map/cell/map-cell.js";
import { MapTile } from "../map/cell/map-tile.js";
import { MapWall } from "../map/cell/map-wall.js";
export declare enum TileType {
    None = 0,
    Benches = 1,
    Platforms = 2,
    Chairs = 3,
    LilyPad = 4,
    Torches = 5,
    Trees = 6,
    SoulBottles = 7,
    Containers = 8,
    Containers2 = 9,
    GolfTrophies = 10,
    Pots = 11,
    ShadowOrbs = 12,
    DemonAltar = 13,
    Traps = 14,
    Herbs = 15,
    PotsSuspended = 16,
    Statues = 17,
    AdamantiteForge = 18,
    MythrilAnvil = 19,
    Stalactite = 20,
    ExposedGems = 21,
    LongMoss = 22,
    SmallPiles1x1 = 23,
    SmallPiles2x1 = 24,
    LargePiles = 25,
    LargePiles2 = 26,
    DyePlants = 27,
    PlantDetritus = 28,
    Crystals = 29,
    Painting3X3 = 30,
    Painting6X4 = 31,
    GemLocks = 32,
    PartyPresent = 33,
    LogicGateLamp = 34,
    WeightedPressurePlate = 35,
    GolfCupFlag = 36,
    PottedPlants2 = 37,
    TeleportationPylon = 38
}
export interface MapDataJSON {
    release: number;
    versions: VersionData[];
    tiles: TileData[];
    walls: WallData[];
    liquids: LiquidData[];
    sky: AirData;
    dirt: AirData;
    rock: AirData;
    hell: Color;
    paints: PaintData[];
    tree: TreeData;
    anyWall: MapCellPaintableJSON;
    unexploredTile: MapCellPaintableJSON;
}
interface VersionData {
    release: number;
    version: string;
}
interface TileData {
    name: string;
    colors: Color[];
    width?: number;
    height?: number;
    frameImportant?: boolean;
    needsWall?: boolean;
    solid?: boolean;
    type?: TileType | string | number;
}
interface WallData {
    name: string;
    colors: Color[];
}
interface LiquidData {
    name: string;
    color: Color;
}
interface AirData {
    count: number;
    min: Color;
    max: Color;
    colors?: Color[];
}
interface PaintData {
    name: string;
    color: Color;
    negative?: boolean;
    shadow?: boolean;
}
interface TreeData {
    base: UvData;
    baseTop: UvData;
    baseBranchLeft: UvData;
    branchLeft: UvData;
    branchLeftLeafy: UvData;
    baseBranchRight: UvData;
    branchRight: UvData;
    branchRightLeafy: UvData;
    baseBranchBoth: UvData;
    baseTrunkLeft: UvData;
    trunkLeft: UvData;
    baseTrunkRight: UvData;
    trunkRight: UvData;
    trunkBoth: UvData;
}
interface UvData {
    0: number;
    1: number;
}
interface MapCellPaintableJSON {
    name?: string;
    id?: number;
    paint?: string;
    paintId?: number;
}
export declare class MapData {
    private release;
    private versions;
    private tiles;
    private walls;
    private liquids;
    private sky;
    private dirt;
    private rock;
    private hell;
    private paints;
    tree: TreeData;
    frameImportant: boolean[];
    anyWall: MapWall;
    unexploredTile: MapTile;
    private static unknownTile;
    private static unknownWall;
    private static unknownLiquid;
    private static unknownPaint;
    constructor(json: MapDataJSON);
    private getMapCellPaintable;
    tile(id: number): TileData;
    tileColor(tile: MapTile): Color;
    tileString(tile: MapTile): string;
    wall(id: number): WallData;
    wallColor(wall: MapWall): Color;
    wallString(wall: MapWall): string;
    liquid(id: number): LiquidData;
    liquidColor(id: number): Color;
    liquidString(id: number): string;
    skyIndex(y: number, worldSurface: number): number;
    skyColor(y: number, worldSurface: number): Color;
    dirtIndex(id: number): number;
    dirtColor(id: number): Color;
    rockIndex(id: number): number;
    rockColor(id: number): Color;
    hellColor(): Color;
    paint(id: number): PaintData;
    applyPaint(group: MapCellGroup, color: Color, paintId: number): Color;
    latestRelease(): number;
    latestVersion(): string;
    getVersion(release: number): string;
    private static prepareAirColors;
}
export {};

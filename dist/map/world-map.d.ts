import { MapTile } from "./map-tile.js";
export declare class WorldMap {
    protected _width: number;
    protected _height: number;
    private airTilesDepths;
    private airTiles;
    tiles: MapTile[];
    worldName?: string;
    worldId?: number;
    release?: number;
    revision?: number;
    isChinese?: boolean;
    worldSurface?: number;
    worldSurfaceEstimated?: boolean;
    rockLayer?: number;
    constructor(width?: number, height?: number);
    get width(): number;
    set width(val: number);
    get height(): number;
    set height(val: number);
    setDimensions(w: number, h: number): void;
    updateDimensions(): void;
    setTile(x: number, y: number, tile: MapTile): void;
    tile(x: number, y: number): MapTile;
    private fixAirTiles;
    read(data: (Uint8Array | ArrayBuffer)): Promise<void>;
    writeSchematic(): ArrayBufferLike;
    static getLatestRelease(): number;
}

import { BinaryWriter } from "../net/binary-writer.js";
import { WorldMap } from "../map/world-map.js";
import { MapTile } from "../map/map-tile.js";
export declare class SchematicWriter {
    static writeSchematic(bw: BinaryWriter, worldMap: WorldMap): void;
    static writeTiles(bw: BinaryWriter, worldMap: WorldMap): void;
    static serializeTileData(tile: MapTile, u: number | undefined, v: number | undefined, needsWall: boolean, wall: MapTile): {
        tileData: Uint8Array<ArrayBuffer>;
        headerIndex: number;
        dataIndex: number;
    };
    static getTileUV(worldMap: WorldMap, tile: MapTile, x: number, y: number, u: number[], v: number[]): void;
    static getFrameFromBaseOption(tileType: number, baseOption: number): {
        frameX: number;
        frameY: number;
    };
    static resolveWidth(worldMap: WorldMap, x: number, y: number, u: number[]): void;
    static resolveHeight(worldMap: WorldMap, x: number, y: number, v: number[]): void;
    static resolveTree(worldMap: WorldMap, x: number, y: number, u: number[], v: number[]): void;
    static treeAt(worldMap: WorldMap, x: number, y: number): boolean;
    static resolveStalactite(worldMap: WorldMap, x: number, y: number, v: number[]): void;
    static stalactiteAt(worldMap: WorldMap, x: number, y: number): boolean;
    static resolvePlantDetritus(worldMap: WorldMap, x: number, y: number, u: number[], v: number[]): void;
    static plantDetritus3(worldMap: WorldMap, x: number, y: number, u: number[], v: number[]): void;
    static plantDetritus2(worldMap: WorldMap, x: number, y: number, u: number[], v: number[]): void;
    static plantDetritusAt(worldMap: WorldMap, x: number, y: number): boolean;
    static solidAt(worldMap: WorldMap, x: number, y: number): boolean;
    static needsWall(worldMap: WorldMap, x: number, y: number): boolean;
}

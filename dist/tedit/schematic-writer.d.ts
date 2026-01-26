import { BinaryWriter } from "../net/binary-writer.js";
import { TileType } from "../data/map-data.js";
import { MapCell } from "../map/cell/map-cell.js";
import { MapWall } from "../map/cell/map-wall.js";
import { MapTile } from "../map/cell/map-tile.js";
import { WorldMap } from "../map/world-map.js";
export declare class SchematicWriter {
    static writeSchematic(bw: BinaryWriter, worldMap: WorldMap): void;
    static writeCells(bw: BinaryWriter, worldMap: WorldMap): void;
    static serializeCellData(cell: MapCell, u: number, v: number, needsWall: boolean, wall: MapWall, frameImportant: boolean): {
        cellData: Uint8Array<ArrayBuffer>;
        headerIndex: number;
        dataIndex: number;
    };
    static getTileUVFromGeometry(worldMap: WorldMap, tile: MapTile, x: number, y: number, u: number[], v: number[]): void;
    static getTileUVFromOption(optionType: TileType, option: number): number[];
    static resolveWidth(worldMap: WorldMap, x: number, y: number, width: number, u: number[]): void;
    static resolveHeight(worldMap: WorldMap, x: number, y: number, height: number, v: number[]): void;
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

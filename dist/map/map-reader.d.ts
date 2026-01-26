import { BinaryReader } from "../net/binary-reader.js";
import { WorldMap } from "./world-map.js";
export declare class MapReader {
    static estimateWorldSurface(worldHeight: number): number;
    static estimateRockLayer(worldHeight: number): number;
    static read(fileIO: BinaryReader, worldMap: WorldMap): Promise<void>;
    static readMetadata(fileIO: BinaryReader, worldMap: WorldMap): void;
    static readMapV1(fileIO: BinaryReader, worldMap: WorldMap): void;
    static readMapV2(fileIO: BinaryReader, worldMap: WorldMap): Promise<void>;
}

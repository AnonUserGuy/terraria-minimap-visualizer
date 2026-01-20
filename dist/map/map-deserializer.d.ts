import { BinaryReader } from "../net/binary-reader.js";
import { WorldMap } from "./world-map.js";
interface FileMetadata {
    magicNumber?: string;
    fileType?: number;
    revision?: number;
    favorite?: boolean;
    isChinese?: boolean;
}
export declare class MapDeserializer {
    static estimateWorldSurface(worldHeight: number): number;
    static estimateRockLayer(worldHeight: number): number;
    static estimateUnderworldLayer(worldHeight: number): number;
    static load(fileIO: BinaryReader, worldMap: WorldMap): Promise<void>;
    static readFileMetadata(fileIO: BinaryReader): FileMetadata;
    static loadMapVersion1(fileIO: BinaryReader, release: number, worldMap: WorldMap): void;
    static loadMapVersion2(fileIO: BinaryReader, release: number, worldMap: WorldMap): Promise<void>;
}
export {};

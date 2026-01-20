import { BinaryReader } from "../net/binary-reader.js";
import { MapTile, TileGroup } from "./map-tile.js";
import { WorldMap } from "./world-map.js";
import { TileID } from "../id/tile-ids.js";
import { WallID } from "../id/wall-ids.js";
import { TileLookupUtil } from "./tile-lookup-util.js";


enum FileType {
    None,
    Map,
    World,
    Player
}

interface FileMetadata {
    magicNumber?: string;
    fileType?: number;
    revision?: number;
    favorite?: boolean;
    isChinese?: boolean;
}

class OldMapHelper {
    public misc: number;
    public misc2: number;

    constructor() {
        this.misc = 0;
        this.misc2 = 0;
    }

    public active() {
        if ((this.misc & 1) == 1) {
            return true;
        }
        return false;
    }

    public water() {
        if ((this.misc & 2) == 2) {
            return true;
        }
        return false;
    }

    public lava() {
        if ((this.misc & 4) == 4) {
            return true;
        }
        return false;
    }

    public honey() {
        if ((this.misc2 & 0x40) == 64) {
            return true;
        }
        return false;
    }

    public changed() {
        if ((this.misc & 8) == 8) {
            return true;
        }
        return false;
    }

    public wall() {
        if ((this.misc & 0x10) == 16) {
            return true;
        }
        return false;
    }

    public option() {
        let b = 0;
        if ((this.misc & 0x20) == 32) {
            b++;
        }
        if ((this.misc & 0x40) == 64) {
            b += 2;
        }
        if ((this.misc & 0x80) == 128) {
            b += 4;
        }
        if ((this.misc2 & 1) == 1) {
            b += 8;
        }
        return b;
    }

    public color() {
        return ((this.misc2 & 0x1E) >> 1);
    }
}

export class MapDeserializer {

    public static estimateWorldSurface(worldHeight: number) {
        return Math.round(0.2 * worldHeight + 75);
    }
    public static estimateRockLayer(worldHeight: number) {
        return Math.round(0.35 * worldHeight + 25);
    }
    public static estimateUnderworldLayer(worldHeight: number) {
        return Math.round(0.9 * worldHeight - 125);
    }

    public static async load(fileIO: BinaryReader, worldMap: WorldMap) {
        const release = fileIO.ReadInt32();
        if (release <= 91) {
            MapDeserializer.loadMapVersion1(fileIO, release, worldMap);
        } else {
            await MapDeserializer.loadMapVersion2(fileIO, release, worldMap);
        }
    }

    static readFileMetadata(fileIO: BinaryReader) {
        const metadata: FileMetadata = {};
        metadata.magicNumber = fileIO.readString(7);
        if (metadata.magicNumber !== "relogic") {
            if (metadata.magicNumber === "xindong") {
                metadata.isChinese = true;
            } else {
                throw new TypeError(`Bad file: missing relogic header, not terraria file`);
            }
        }
        metadata.fileType = fileIO.readByte();
        if (metadata.fileType !== FileType.Map) {
            throw new TypeError(`Bad file: is terraria file, but not .map file`);
        }
        metadata.revision = Number(fileIO.ReadUInt32());
        const someBitfield = fileIO.readUInt64();
        metadata.favorite = !!(someBitfield & 1n);
        return metadata;
    }

    static loadMapVersion1(fileIO: BinaryReader, release: number, worldMap: WorldMap) {
        const worldName = fileIO.readString();
        const worldId = fileIO.ReadInt32();
        const worldHeight = fileIO.ReadInt32();
        const worldWidth = fileIO.ReadInt32();

        const worldSurface = MapDeserializer.estimateWorldSurface(worldHeight);
        const rockLayer = MapDeserializer.estimateRockLayer(worldHeight);
        const underworldLayer = MapDeserializer.estimateUnderworldLayer(worldHeight);

        worldMap.setDimensions(worldWidth, worldHeight);
        worldMap.worldName = worldName;
        worldMap.worldId = worldId;
        worldMap.release = release;
        worldMap.revision = -1;
        worldMap.isChinese = false;
        worldMap.rockLayer = rockLayer;
        worldMap.worldSurface = worldSurface;
        worldMap.worldSurfaceEstimated = true;

        const oldMapHelper = new OldMapHelper();
        for (let x = 0; x < worldWidth; x++) {
            for (let y = 0; y < worldHeight; y++) {
                if (fileIO.readBoolean()) {
                    let tileGroupIndex = ((release <= 77) ? fileIO.readByte() : fileIO.readUInt16());
                    let light = fileIO.readByte();
                    oldMapHelper.misc = fileIO.readByte();
                    if (release >= 50) {
                        oldMapHelper.misc2 = fileIO.readByte();
                    }
                    else {
                        oldMapHelper.misc2 = 0;
                    }
                    let isGradientType = false;
                    const option = oldMapHelper.option();
                    let tileType: number;
                    let tileGroup: TileGroup;
                    if (oldMapHelper.active()) {
                        tileGroup = TileGroup.Tile;
                        tileType = option + TileLookupUtil.tileLookup[tileGroupIndex];
                    }
                    else if (oldMapHelper.water()) {
                        tileGroup = TileGroup.Water;
                        tileType = TileLookupUtil.liquidPosition;
                    }
                    else if (oldMapHelper.lava()) {
                        tileGroup = TileGroup.Lava;
                        tileType = TileLookupUtil.liquidPosition + 1;
                    }
                    else if (oldMapHelper.honey()) {
                        tileGroup = TileGroup.Honey;
                        tileType = TileLookupUtil.liquidPosition + 2;
                    }
                    else if (oldMapHelper.wall()) {
                        tileGroup = TileGroup.Wall;
                        tileType = option + TileLookupUtil.wallLookup[tileGroupIndex];
                    }
                    else if (y < worldSurface) {
                        tileGroup = TileGroup.Air;
                        isGradientType = true;
                        tileType = TileLookupUtil.skyPosition;
                    }
                    else if (y < rockLayer) {
                        tileGroup = TileGroup.DirtRock;
                        isGradientType = true;
                        if (tileGroupIndex > 255) {
                            tileGroupIndex = 255;
                        }
                        tileType = tileGroupIndex + TileLookupUtil.dirtPosition;
                    }
                    else if (y < underworldLayer) {
                        tileGroup = TileGroup.DirtRock;
                        isGradientType = true;
                        if (tileGroupIndex > 255) {
                            tileGroupIndex = 255;
                        }
                        tileType = tileGroupIndex + TileLookupUtil.rockPosition;
                    }
                    else {
                        tileGroup = TileGroup.Air;
                        tileType = TileLookupUtil.hellPosition;
                    }
                    let tile = MapTile.create(tileType, light, 0, tileGroup, TileLookupUtil.idLookup[tileType], TileLookupUtil.optionLookup[tileType]);
                    let repeated = fileIO.readInt16();

                    if (light === 255) {
                        while (repeated > 0) {
                            repeated--;
                            y++;
                            if (isGradientType) {
                                if (y < worldSurface) {
                                    tileGroup = TileGroup.Air;
                                    tileType = TileLookupUtil.skyPosition;
                                }
                                else if (y < rockLayer) {
                                    tileGroup = TileGroup.DirtRock;
                                    tileType = tileGroupIndex + TileLookupUtil.dirtPosition;
                                }
                                else if (y < underworldLayer) {
                                    tileGroup = TileGroup.DirtRock;
                                    tileType = tileGroupIndex + TileLookupUtil.rockPosition;
                                }
                                else {
                                    tileGroup = TileGroup.Air;
                                    tileType = TileLookupUtil.hellPosition;
                                }
                                tile = MapTile.create(tileType, light, 0, tileGroup, TileLookupUtil.idLookup[tileType], TileLookupUtil.optionLookup[tileType]);
                            }

                            worldMap.setTile(x, y, tile);
                        }
                    } else {
                        while (repeated > 0) {
                            y++;
                            repeated--;
                            light = fileIO.readByte();
                            if (light <= 18) {
                                continue;
                            }
                            if (isGradientType) {
                                if (y < worldSurface) {
                                    tileGroup = TileGroup.Air;
                                    tileType = TileLookupUtil.skyPosition;
                                }
                                else if (y < rockLayer) {
                                    tileGroup = TileGroup.DirtRock;
                                    tileType = tileGroupIndex + TileLookupUtil.dirtPosition;
                                }
                                else if (y < underworldLayer) {
                                    tileGroup = TileGroup.DirtRock;
                                    tileType = tileGroupIndex + TileLookupUtil.rockPosition;
                                }
                                else {
                                    tileGroup = TileGroup.Air;
                                    tileType = TileLookupUtil.hellPosition;
                                }
                                tile = MapTile.create(tileType, light, 0, tileGroup, TileLookupUtil.idLookup[tileType], TileLookupUtil.optionLookup[tileType]);
                            } else {
                                tile = tile.withLight(light);
                            }
                            worldMap.setTile(x, y, tile);
                        }
                    }
                }
                else {
                    const repeated = fileIO.readInt16();
                    y += repeated;
                }
            }
        }
    }



    static async loadMapVersion2(fileIO: BinaryReader, release: number, worldMap: WorldMap) {
        const metadata = release > 135 ? MapDeserializer.readFileMetadata(fileIO) : null;
        const worldName = fileIO.readString();
        const worldId = fileIO.ReadInt32();
        const worldHeight = fileIO.ReadInt32();
        const worldWidth = fileIO.ReadInt32();

        const rockLayer = MapDeserializer.estimateRockLayer(worldHeight);

        worldMap.setDimensions(worldWidth, worldHeight);
        worldMap.worldName = worldName;
        worldMap.worldId = worldId;
        worldMap.release = release;
        worldMap.revision = metadata ? metadata.revision! : -1;
        worldMap.isChinese = metadata ? metadata.isChinese! : false;
        worldMap.rockLayer = rockLayer;
        worldMap.worldSurface = -1;

        const tileCount = fileIO.readInt16();
        const wallCount = fileIO.readInt16();
        const liquidCount = fileIO.readInt16();
        const airCount = fileIO.readInt16();
        const dirtCount = fileIO.readInt16();
        const rockCount = fileIO.readInt16();
        const tileHasOptions = fileIO.readBitArray(tileCount);
        const wallHasOptions = fileIO.readBitArray(wallCount);
        const tileOptionCounts = new Uint8Array(tileCount);
        let tileTotal = 0;
        for (let i = 0; i < tileCount; ++i) {
            tileOptionCounts[i] = !tileHasOptions[i] ? 1 : fileIO.readByte();
            tileTotal += tileOptionCounts[i];
        }
        const wallOptionCounts = new Uint8Array(wallCount);
        let wallTotal = 0;
        for (let i = 0; i < wallCount; ++i) {
            wallOptionCounts[i] = !wallHasOptions[i] ? 1 : fileIO.readByte();
            wallTotal += wallOptionCounts[i];
        }
        const tileTypes = new Uint16Array(tileTotal + wallTotal + liquidCount + airCount + dirtCount + rockCount + 2);
        tileTypes[0] = 0;
        let indexLatest = 1;
        let index = 1;
        const tileOffset = index;
        for (let i = 0; i < TileID.Count; ++i) {
            if (i < tileCount) {
                const tileOptions = tileOptionCounts[i];
                const tileOptionsLatest = TileLookupUtil.tileOptionCounts[i];
                for (let j = 0; j < tileOptionsLatest; ++j) {
                    if (j < tileOptions) {
                        tileTypes[index] = indexLatest;
                        ++index;
                    }
                    ++indexLatest;
                }
            }
            else {
                indexLatest += TileLookupUtil.tileOptionCounts[i];
            }
        }
        const wallOffset = index;
        for (let i = 0; i < WallID.Count; ++i) {
            if (i < wallCount) {
                const wallOptions = wallOptionCounts[i];
                const wallOptionsLatest = TileLookupUtil.wallOptionCounts[i];
                for (let j = 0; j < wallOptionsLatest; ++j) {
                    if (j < wallOptions) {
                        tileTypes[index] = indexLatest;
                        ++index;
                    }
                    ++indexLatest;
                }
            }
            else
                indexLatest += TileLookupUtil.wallOptionCounts[i];
        }
        const liquidOffset = index;
        for (let i = 0; i < TileLookupUtil.maxLiquidTypes; ++i) {
            if (i < liquidCount) {
                tileTypes[index] = indexLatest;
                ++index;
            }
            ++indexLatest;
        }
        const airOffset = index;
        for (let i = 0; i < TileLookupUtil.maxSkyGradients; ++i) {
            if (i < airCount) {
                tileTypes[index] = indexLatest;
                ++index;
            }
            ++indexLatest;
        }
        const dirtOffset = index;
        for (let i = 0; i < TileLookupUtil.maxDirtGradients; ++i) {
            if (i < dirtCount) {
                tileTypes[index] = indexLatest;
                ++index;
            }
            ++indexLatest;
        }
        const rockOffset = index;
        for (let i = 0; i < TileLookupUtil.maxRockGradients; ++i) {
            if (i < rockCount) {
                tileTypes[index] = indexLatest;
                ++index;
            }
            ++indexLatest;
        }
        //const hellOffset = mapTileIndex;
        tileTypes[index] = indexLatest;
        const deflatedFileIO = release < 93 ? fileIO : new BinaryReader(await BinaryReader.decompressBuffer(fileIO.data.buffer.slice(fileIO.pos) as ArrayBuffer, "deflate-raw"));
        for (let y = 0; y < worldHeight; ++y) {
            for (let x = 0; x < worldWidth; ++x) {
                const tileFlags = deflatedFileIO.readByte(); // VVWZYYYX
                // X - has color
                // YYY - tile group
                // Z - tile type index width
                // W - has light level
                // V - has repeated and repeated width
                const tileColor = (tileFlags & 0b0000_0001) != 1 ? 0 : deflatedFileIO.readByte();
                const tileGroup = (tileFlags & 0b0000_1110) >> 1;
                let hasTileType: boolean;
                switch (tileGroup) {
                    case TileGroup.Empty:
                        hasTileType = false;
                        break;
                    case TileGroup.Tile:
                    case TileGroup.Wall:
                    case TileGroup.DirtRock:
                        hasTileType = true;
                        break;
                    case TileGroup.Water:
                    case TileGroup.Lava:
                    case TileGroup.Honey:
                        hasTileType = false;
                        break;
                    case TileGroup.Air:
                        hasTileType = false;
                        break;
                    default:
                        hasTileType = false;
                        break;
                }
                let tileType = !hasTileType ? 0 : ((tileFlags & 0b0001_0000) !== 0b0001_0000 ? deflatedFileIO.readByte() : deflatedFileIO.readUInt16());
                const light = (tileFlags & 0b0010_0000) !== 0b0010_0000 ? 255 : deflatedFileIO.readByte();
                let repeated;
                switch (((tileFlags & 0b1100_0000) >> 6)) {
                    case 0:
                        repeated = 0;
                        break;
                    case 1:
                        repeated = deflatedFileIO.readByte();
                        break;
                    case 2:
                        repeated = deflatedFileIO.readInt16();
                        break;
                    default:
                        repeated = 0;
                        break;
                }
                switch (tileGroup) {
                    case TileGroup.Empty:
                        x += repeated;
                        continue;
                    case TileGroup.Tile:
                        tileType += tileOffset;
                        break;
                    case TileGroup.Wall:
                        tileType += wallOffset;
                        break;
                    case TileGroup.Water:
                    case TileGroup.Lava:
                    case TileGroup.Honey:
                        let whichLiquid = tileGroup - 3;
                        if ((tileColor & 0x40) == 0x40) { // shimmer
                            whichLiquid = 3;
                        }
                        tileType += liquidOffset + whichLiquid;
                        break;
                    case TileGroup.Air:
                        tileType = airOffset;
                        break;
                    case TileGroup.DirtRock:
                        if (worldMap.worldSurface === -1) {
                            worldMap.worldSurface = y;
                        }
                        if (y < rockLayer) {
                            tileType += dirtOffset;
                            break;
                        }
                        else {
                            tileType += rockOffset;
                            break;
                        }
                }

                const tileTypeLatest = tileTypes[tileType];
                let tile: MapTile = MapTile.create(tileTypeLatest, light, tileColor >> 1 & 31, tileGroup, TileLookupUtil.idLookup[tileTypeLatest], TileLookupUtil.optionLookup[tileTypeLatest]);
                worldMap.setTile(x, y, tile);

                if (light === 255) {
                    while (repeated > 0) {
                        x++;
                        worldMap.setTile(x, y, tile);
                        repeated--;
                    }
                } else {
                    while (repeated > 0) {
                        x++;
                        tile = tile.withLight(deflatedFileIO.readByte());
                        worldMap.setTile(x, y, tile);
                        repeated--;
                    }
                }
            }
        }
        if (worldMap.worldSurface === -1) {
            worldMap.worldSurface = MapDeserializer.estimateWorldSurface(worldHeight);
            worldMap.worldSurfaceEstimated = true;
        } else {
            worldMap.worldSurfaceEstimated = false;
        }
    }
}

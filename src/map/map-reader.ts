import { BinaryReader } from "../net/binary-reader.js";
import { MapCell } from "./cell/map-cell.js";
import { WorldMap } from "./world-map.js";
import { MapTile } from "./cell/map-tile.js";
import { MapLiquid } from "./cell/map-liquid.js";
import { LiquidID } from "../id/liquid-ids.js";
import { MapWall } from "./cell/map-wall.js";
import { MapAirSky } from "./cell/map-air-sky.js";
import { MapAirDirt } from "./cell/map-air-dirt.js";
import { MapAirRock } from "./cell/map-air-rock.js";
import { mapCellColors } from "./map-cell-colors.js";

enum FileType {
    None,
    Map,
    World,
    Player
}

enum MapCellGroupSerialized {
    Empty,
    Tile,
    Wall,
    Water,
    Lava,
    Honey,
    Sky,
    DirtRock
}

class OldMapReader {
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

export class MapReader {
    
    public static estimateWorldSurface(worldHeight: number) {
        return Math.round(0.2 * worldHeight + 75);
    }
    public static estimateRockLayer(worldHeight: number) {
        return Math.round(0.35 * worldHeight + 25);
    }
    public static estimateUnderworldLayer(worldHeight: number) {
        return Math.round(0.9 * worldHeight - 125);
    }

    public static async read(fileIO: BinaryReader, worldMap: WorldMap) {
        worldMap.release = fileIO.ReadInt32();
        if (worldMap.release > 135) {
            MapReader.readMetadata(fileIO, worldMap);
        } else {
            worldMap.revision = -1;
            worldMap.isChinese = false;
        }

        worldMap.worldName = fileIO.readString();
        worldMap.worldId = fileIO.ReadInt32();

        const worldHeight = fileIO.ReadInt32();
        const worldWidth = fileIO.ReadInt32();
        worldMap.setDimensions(worldWidth, worldHeight);

        worldMap.rockLayer = MapReader.estimateRockLayer(worldHeight);

        if (worldMap.release <= 91) {
            MapReader.readMapV1(fileIO, worldMap);
        } else {
            await MapReader.readMapV2(fileIO, worldMap);
        }
    }

    static readMetadata(fileIO: BinaryReader, worldMap: WorldMap) {
        const magicNumber = fileIO.readString(7);
        if (magicNumber === "relogic") {
            worldMap.isChinese = false;
        } else if (magicNumber === "xindong") {
            worldMap.isChinese = true;
        } else {
            throw new TypeError(`Bad file: missing relogic header, not terraria file`);
        }
        const fileType = fileIO.readByte();
        if (fileType !== FileType.Map) {
            throw new TypeError(`Bad file: is terraria file, but not .map file`);
        }
        worldMap.revision = Number(fileIO.ReadUInt32());
        fileIO.readUInt64(); // pass unused bitfield
    }

    static readMapV1(fileIO: BinaryReader, worldMap: WorldMap) {
        worldMap.worldSurfaceEstimated = true;
        worldMap.worldSurface = MapReader.estimateWorldSurface(worldMap.height);
        const underworldLayer = MapReader.estimateUnderworldLayer(worldMap.height);

        const oldMapHelper = new OldMapReader();
        for (let x = 0; x < worldMap.width; x++) {
            for (let y = 0; y < worldMap.height; y++) {
                if (fileIO.readBoolean()) {
                    let id = ((worldMap.release <= 77) ? fileIO.readByte() : fileIO.readUInt16());
                    let light = fileIO.readByte();
                    oldMapHelper.misc = fileIO.readByte();
                    if (worldMap.release >= 50) {
                        oldMapHelper.misc2 = fileIO.readByte();
                    }
                    else {
                        oldMapHelper.misc2 = 0;
                    }
                    let isGradientType = false;
                    const option = oldMapHelper.option();
                    
                    const color = oldMapHelper.color();
                    if (color !== 0) {
                        console.log(color);
                    }

                    let cell: MapCell;
                    if (oldMapHelper.active()) {
                        cell = new MapTile(light, id, option);
                    }
                    else if (oldMapHelper.water()) {
                        cell = new MapLiquid(light, LiquidID.Water);
                    }
                    else if (oldMapHelper.lava()) {
                        cell = new MapLiquid(light, LiquidID.Lava);
                    }
                    else if (oldMapHelper.honey()) {
                        cell = new MapLiquid(light, LiquidID.Honey);
                    }
                    else if (oldMapHelper.wall()) {
                        cell = new MapWall(light, id + option, 0);
                    }
                    else if (y < worldMap.worldSurface) {
                        isGradientType = true;
                        cell = new MapAirSky(light);
                    }
                    else if (y < worldMap.rockLayer) {
                        isGradientType = true;
                        if (id >= mapCellColors.maxDirtGradients) {
                            id = 255;
                        }
                        cell = new MapAirDirt(light, id);
                    }
                    else if (y < underworldLayer) {
                        isGradientType = true;
                        if (id >= mapCellColors.maxRockGradients) {
                            id = 255;
                        }
                        cell = new MapAirRock(light, id);
                    }
                    else {
                        cell = new MapAirSky(light);
                    }
                    worldMap.setCell(x, y, cell);

                    let repeated = fileIO.readInt16();
                    if (light === 255) {
                        while (repeated > 0) {
                            y++;
                            repeated--;
                            if (isGradientType) {
                                if (y < worldMap.worldSurface) {
                                    cell = new MapAirSky(light);
                                }
                                else if (y < worldMap.rockLayer) {
                                    cell = new MapAirDirt(light, id);
                                }
                                else if (y < underworldLayer) {
                                    cell = new MapAirRock(light, id);
                                }
                                else {
                                    cell = new MapAirSky(light);
                                }
                            }
                            worldMap.setCell(x, y, cell);
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
                                if (y < worldMap.worldSurface) {
                                    cell = new MapAirSky(light);
                                }
                                else if (y < worldMap.rockLayer) {
                                    cell = new MapAirDirt(light, id);
                                }
                                else if (y < underworldLayer) {
                                    cell = new MapAirRock(light, id);
                                }
                                else {
                                    cell = new MapAirSky(light);
                                }
                            } else {
                                cell = cell.copyWithLight(light);
                            }
                            worldMap.setCell(x, y, cell);
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

    static async readMapV2(fileIO: BinaryReader, worldMap: WorldMap) {
        worldMap.worldSurface = -1;

        const tileCount = fileIO.readInt16();
        const wallCount = fileIO.readInt16();
        fileIO.readInt16(); // liquid count
        fileIO.readInt16(); // sky count
        fileIO.readInt16(); // dirt count
        fileIO.readInt16(); // rock count
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

        const tileIdFromType = [];
        const tileOptionFromType = [];
        const wallIdFromType = [];
        const wallOptionFromType = [];
        let tileType = 0;
        for (let i = 0; i < tileCount; i++) {
            for (let j = 0; j < tileOptionCounts[i]; j++) {
                tileIdFromType[tileType] = i;
                tileOptionFromType[tileType] = j;
                tileType++;
            }
        }
        let wallType = 0;
        for (let i = 0; i < wallCount; i++) {
            for (let j = 0; j < wallOptionCounts[i]; j++) {
                wallIdFromType[wallType] = i;
                wallOptionFromType[wallType] = j;
                wallType++;
            }
        }

        const deflatedFileIO = worldMap.release < 93 ? fileIO : await fileIO.decompress("deflate-raw");
        for (let y = 0; y < worldMap.height; ++y) {
            for (let x = 0; x < worldMap.width; ++x) {
                const tileFlags = deflatedFileIO.readByte(); // VVWZYYYX
                // X - has color
                // YYY - tile group
                // Z - tile type index width
                // W - has light level
                // V - has repeated and repeated width
                const tilePaint = (tileFlags & 0b0000_0001) != 1 ? 0 : deflatedFileIO.readByte();
                const cellGroup = (tileFlags & 0b0000_1110) >> 1;
                const hasType = cellGroup === MapCellGroupSerialized.Tile || cellGroup === MapCellGroupSerialized.Wall || cellGroup === MapCellGroupSerialized.DirtRock;
                const type = !hasType ? 0 : ((tileFlags & 0b0001_0000) !== 0b0001_0000 ? deflatedFileIO.readByte() : deflatedFileIO.readUInt16());
                const light = (tileFlags & 0b0010_0000) !== 0b0010_0000 ? 255 : deflatedFileIO.readByte();
                let repeated: number;
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
                let cell: MapCell;
                switch (cellGroup) {
                    case MapCellGroupSerialized.Empty:
                        x += repeated;
                        continue;
                    case MapCellGroupSerialized.Tile:
                        cell = new MapTile(light, tileIdFromType[type], tileOptionFromType[type], tilePaint >> 1 & 31)
                        break;
                    case MapCellGroupSerialized.Wall:
                        cell = new MapWall(light, wallIdFromType[type], wallOptionFromType[type], tilePaint >> 1 & 31)
                        break;
                    case MapCellGroupSerialized.Water:
                    case MapCellGroupSerialized.Lava:
                    case MapCellGroupSerialized.Honey:
                        let liquidId = cellGroup - 3;
                        if ((tilePaint & 0x40) == 0x40) { // shimmer
                            liquidId = 3;
                        }
                        cell = new MapLiquid(light, liquidId)
                        break;
                    case MapCellGroupSerialized.Sky:
                        cell = new MapAirSky(light);
                        break;
                    case MapCellGroupSerialized.DirtRock:
                        if (worldMap.worldSurface === -1) {
                            worldMap.worldSurface = y;
                        }
                        if (y < worldMap.rockLayer) {
                            cell = new MapAirDirt(light, type);
                            break;
                        }
                        else {
                            cell = new MapAirRock(light, type);
                            break;
                        }
                }
                worldMap.setCell(x, y, cell);

                if (light === 255) {
                    while (repeated > 0) {
                        x++;
                        worldMap.setCell(x, y, cell);
                        repeated--;
                    }
                } else {
                    while (repeated > 0) {
                        x++;
                        cell = cell.copyWithLight(deflatedFileIO.readByte());
                        worldMap.setCell(x, y, cell);
                        repeated--;
                    }
                }
            }
        }
        if (worldMap.worldSurface === -1) {
            worldMap.worldSurface = MapReader.estimateWorldSurface(worldMap.height);
            worldMap.worldSurfaceEstimated = true;
        } else {
            worldMap.worldSurfaceEstimated = false;
        }
    }
}

import { BinaryReader } from "../net/binary-reader.js";
import { LiquidID } from "../id/liquid-ids.js";
import { MapCell, MapCellGroup } from "./cell/map-cell.js";
import { MapCellPaintable } from "./cell/map-cell-paintable.js";
import { MapAir } from "./cell/map-air.js";
import { WorldMap } from "./world-map.js";

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

class MapFlagsV1 {
    public flags: number;
    constructor(flags: number) {
        this.flags = flags;
    }
    public get tile() {
        return !!(this.flags & 1);
    }
    public get water() {
        return !!(this.flags & 0b0000_0010);
    }
    public get lava() {
        return !!(this.flags & 0b0000_0100);
    }
    public get modified() {
        return !!(this.flags & 0b0000_1000);
    }
    public get wall() {
        return !!(this.flags & 0b0001_0000);
    }
    public get option() {
        return (this.flags & 0b0000_0001_1110_0000) >> 5;
    }
    public get paint() {
        return (this.flags & 0b0001_1110_0000_0000) >> 9;
    }
    public get honey() {
        return !!(this.flags & 0b0100_0000_0000_0000);
    }
}

class MapFlagsV2 {
    public flags: number;
    constructor(flags: number) {
        this.flags = flags;
    }
    public get hasPaint() {
        return !!(this.flags & 1);
    }
    public get group() {
        return (this.flags & 0b0000_1110) >> 1;
    }
    public get hasWideType() {
        return !!(this.flags & 0b0001_0000);
    }
    public get hasLight() {
        return !!(this.flags & 0b0010_0000);
    }
    public get repeatedWidth() {
        return this.flags >> 6;
    }
}

export class MapReader {
    
    public static estimateWorldSurface(worldHeight: number) {
        return Math.round(0.2 * worldHeight + 75);
    }
    public static estimateRockLayer(worldHeight: number) {
        return Math.round(0.35 * worldHeight + 25);
    }

    public static async read(fileIO: BinaryReader, worldMap: WorldMap) {
        const release = fileIO.ReadInt32();
        if (release & 0x8000) {
            throw new Error("This file was written in a format not currently supported. " +
                "We believe this format to only be used by files made in a private, development version of Terraria. " +
                "If you're encountering this error from a file made in a publicly available version of Terraria, " +
                "please submit a bug report at https://github.com/AnonUserGuy/terraria-minimap-visualizer.");
        }
        worldMap.release = release & ~0x8000;
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

        worldMap.rockLayerEstimated = true;
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
            throw new TypeError("Bad file: missing relogic header, not terraria file");
        }
        const fileType = fileIO.readByte();
        if (fileType !== FileType.Map) {
            throw new TypeError("Bad file: is terraria file, but not .map file");
        }
        worldMap.revision = Number(fileIO.ReadUInt32());
        fileIO.readUInt64(); // pass unused bitfield
    }

    static readMapV1(fileIO: BinaryReader, worldMap: WorldMap) {
        worldMap.worldSurfaceEstimated = true;
        worldMap.worldSurface = MapReader.estimateWorldSurface(worldMap.height);

        for (let x = 0; x < worldMap.width; x++) {
            for (let y = 0; y < worldMap.height; y++) {
                if (fileIO.readBoolean()) {
                    const id = ((worldMap.release <= 77) ? fileIO.readByte() : fileIO.readUInt16());
                    let light = fileIO.readByte();
                    const flags = new MapFlagsV1(worldMap.release >= 50 ? fileIO.readUInt16() : fileIO.readByte());
                    let cell: MapCell;
                    if (flags.tile) {
                        cell = new MapCellPaintable(light, MapCellGroup.Tile, id, flags.option, flags.paint);
                    }
                    else if (flags.water) {
                        cell = new MapCell(light, MapCellGroup.Liquid, LiquidID.Water);
                    }
                    else if (flags.lava) {
                        cell = new MapCell(light, MapCellGroup.Liquid, LiquidID.Lava);
                    }
                    else if (flags.honey) {
                        cell = new MapCell(light, MapCellGroup.Liquid, LiquidID.Honey);
                    }
                    else if (flags.wall) {
                        cell = new MapCellPaintable(light, MapCellGroup.Wall, id + flags.option, 0, flags.paint);
                    }
                    else {
                        cell = new MapAir(light, id);
                    }
                    worldMap.setCell(x, y, cell);

                    let repeated = fileIO.readInt16();
                    if (light === 255) {
                        while (repeated > 0) {
                            y++;
                            repeated--;
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
                            cell = cell.copyWithLight(light);
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
        const tileOptionsCount = new Uint8Array(tileCount);
        for (let i = 0; i < tileCount; ++i) {
            tileOptionsCount[i] = tileHasOptions[i] ? fileIO.readByte() : 1;
        }
        const wallOptionsCount = new Uint8Array(wallCount);
        for (let i = 0; i < wallCount; ++i) {
            wallOptionsCount[i] = wallHasOptions[i] ? fileIO.readByte() : 1;
        }

        const tileIdFromIndex = [];
        const tileOptionFromIndex = [];
        const wallIdFromIndex = [];
        const wallOptionFromIndex = [];
        let tileType = 0;
        for (let i = 0; i < tileCount; i++) {
            for (let j = 0; j < tileOptionsCount[i]; j++) {
                tileIdFromIndex[tileType] = i;
                tileOptionFromIndex[tileType] = j;
                tileType++;
            }
        }
        let wallType = 0;
        for (let i = 0; i < wallCount; i++) {
            for (let j = 0; j < wallOptionsCount[i]; j++) {
                wallIdFromIndex[wallType] = i;
                wallOptionFromIndex[wallType] = j;
                wallType++;
            }
        }

        const deflatedFileIO = worldMap.release < 93 ? fileIO : await fileIO.decompress("deflate-raw");
        for (let y = 0; y < worldMap.height; ++y) {
            for (let x = 0; x < worldMap.width; ++x) {
                const flags = new MapFlagsV2(deflatedFileIO.readByte()); 

                const paint = flags.hasPaint ? deflatedFileIO.readByte() : 0;
                const cellGroup = flags.group;
                const hasIndex = cellGroup === MapCellGroupSerialized.Tile || cellGroup === MapCellGroupSerialized.Wall || cellGroup === MapCellGroupSerialized.DirtRock;
                const index = !hasIndex ? 0 : flags.hasWideType ? deflatedFileIO.readUInt16() : deflatedFileIO.readByte();
                const light = flags.hasLight ? deflatedFileIO.readByte() : 255;
                const repeatedWidth = flags.repeatedWidth;
                let repeated = repeatedWidth === 2 ? deflatedFileIO.readInt16() : repeatedWidth === 1 ? deflatedFileIO.readByte() : 0;

                let cell: MapCell;
                switch (cellGroup) {
                    case MapCellGroupSerialized.Empty:
                        x += repeated;
                        continue;
                    case MapCellGroupSerialized.Tile:
                        cell = new MapCellPaintable(light, MapCellGroup.Tile, tileIdFromIndex[index], tileOptionFromIndex[index], paint >> 1 & 31)
                        break;
                    case MapCellGroupSerialized.Wall:
                        cell = new MapCellPaintable(light, MapCellGroup.Wall, wallIdFromIndex[index], wallOptionFromIndex[index], paint >> 1 & 31)
                        break;
                    case MapCellGroupSerialized.Water:
                    case MapCellGroupSerialized.Lava:
                    case MapCellGroupSerialized.Honey:
                        let liquidId = cellGroup - 3;
                        if ((paint & 0x40) == 0x40) { // shimmer
                            liquidId = LiquidID.Shimmer;
                        }
                        cell = new MapCell(light, MapCellGroup.Liquid, liquidId)
                        break;
                    case MapCellGroupSerialized.Sky:
                        cell = new MapAir(light, index);
                        break;
                    case MapCellGroupSerialized.DirtRock:
                        if (worldMap.worldSurface === -1) {
                            worldMap.worldSurface = y;
                        }
                        cell = new MapAir(light, index);
                        break;
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

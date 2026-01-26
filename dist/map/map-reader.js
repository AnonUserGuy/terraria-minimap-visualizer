import { LiquidID } from "../id/liquid-ids.js";
import { MapTile } from "./cell/map-tile.js";
import { MapWall } from "./cell/map-wall.js";
import { MapLiquid } from "./cell/map-liquid.js";
import { MapAir } from "./cell/map-air.js";
var FileType;
(function (FileType) {
    FileType[FileType["None"] = 0] = "None";
    FileType[FileType["Map"] = 1] = "Map";
    FileType[FileType["World"] = 2] = "World";
    FileType[FileType["Player"] = 3] = "Player";
})(FileType || (FileType = {}));
var MapCellGroupSerialized;
(function (MapCellGroupSerialized) {
    MapCellGroupSerialized[MapCellGroupSerialized["Empty"] = 0] = "Empty";
    MapCellGroupSerialized[MapCellGroupSerialized["Tile"] = 1] = "Tile";
    MapCellGroupSerialized[MapCellGroupSerialized["Wall"] = 2] = "Wall";
    MapCellGroupSerialized[MapCellGroupSerialized["Water"] = 3] = "Water";
    MapCellGroupSerialized[MapCellGroupSerialized["Lava"] = 4] = "Lava";
    MapCellGroupSerialized[MapCellGroupSerialized["Honey"] = 5] = "Honey";
    MapCellGroupSerialized[MapCellGroupSerialized["Sky"] = 6] = "Sky";
    MapCellGroupSerialized[MapCellGroupSerialized["DirtRock"] = 7] = "DirtRock";
})(MapCellGroupSerialized || (MapCellGroupSerialized = {}));
class MapFlagsV1 {
    constructor(flags) {
        this.flags = flags;
    }
    get tile() {
        return !!(this.flags & 1);
    }
    get water() {
        return !!(this.flags & 2);
    }
    get lava() {
        return !!(this.flags & 4);
    }
    get modified() {
        return !!(this.flags & 8);
    }
    get wall() {
        return !!(this.flags & 16);
    }
    get option() {
        return (this.flags & 480) >> 5;
    }
    get paint() {
        return (this.flags & 7680) >> 9;
    }
    get honey() {
        return !!(this.flags & 16384);
    }
}
class MapFlagsV2 {
    constructor(flags) {
        this.flags = flags;
    }
    get hasPaint() {
        return !!(this.flags & 1);
    }
    get group() {
        return (this.flags & 14) >> 1;
    }
    get hasWideType() {
        return !!(this.flags & 16);
    }
    get hasLight() {
        return !!(this.flags & 32);
    }
    get repeatedWidth() {
        return this.flags >> 6;
    }
}
export class MapReader {
    static estimateWorldSurface(worldHeight) {
        return Math.round(0.2 * worldHeight + 75);
    }
    static estimateRockLayer(worldHeight) {
        return Math.round(0.35 * worldHeight + 25);
    }
    static async read(fileIO, worldMap) {
        worldMap.release = fileIO.ReadInt32();
        if (worldMap.release > 135) {
            MapReader.readMetadata(fileIO, worldMap);
        }
        else {
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
        }
        else {
            await MapReader.readMapV2(fileIO, worldMap);
        }
    }
    static readMetadata(fileIO, worldMap) {
        const magicNumber = fileIO.readString(7);
        if (magicNumber === "relogic") {
            worldMap.isChinese = false;
        }
        else if (magicNumber === "xindong") {
            worldMap.isChinese = true;
        }
        else {
            throw new TypeError(`Bad file: missing relogic header, not terraria file`);
        }
        const fileType = fileIO.readByte();
        if (fileType !== FileType.Map) {
            throw new TypeError(`Bad file: is terraria file, but not .map file`);
        }
        worldMap.revision = Number(fileIO.ReadUInt32());
        fileIO.readUInt64(); // pass unused bitfield
    }
    static readMapV1(fileIO, worldMap) {
        worldMap.worldSurfaceEstimated = true;
        worldMap.worldSurface = MapReader.estimateWorldSurface(worldMap.height);
        for (let x = 0; x < worldMap.width; x++) {
            for (let y = 0; y < worldMap.height; y++) {
                if (fileIO.readBoolean()) {
                    const id = ((worldMap.release <= 77) ? fileIO.readByte() : fileIO.readUInt16());
                    let light = fileIO.readByte();
                    const flags = new MapFlagsV1(worldMap.release >= 50 ? fileIO.readUInt16() : fileIO.readByte());
                    let cell;
                    if (flags.tile) {
                        cell = new MapTile(light, id, flags.option);
                    }
                    else if (flags.water) {
                        cell = new MapLiquid(light, LiquidID.Water);
                    }
                    else if (flags.lava) {
                        cell = new MapLiquid(light, LiquidID.Lava);
                    }
                    else if (flags.honey) {
                        cell = new MapLiquid(light, LiquidID.Honey);
                    }
                    else if (flags.wall) {
                        cell = new MapWall(light, id + flags.option, 0);
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
                    }
                    else {
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
    static async readMapV2(fileIO, worldMap) {
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
                let cell;
                switch (cellGroup) {
                    case MapCellGroupSerialized.Empty:
                        x += repeated;
                        continue;
                    case MapCellGroupSerialized.Tile:
                        cell = new MapTile(light, tileIdFromIndex[index], tileOptionFromIndex[index], paint >> 1 & 31);
                        break;
                    case MapCellGroupSerialized.Wall:
                        cell = new MapWall(light, wallIdFromIndex[index], wallOptionFromIndex[index], paint >> 1 & 31);
                        break;
                    case MapCellGroupSerialized.Water:
                    case MapCellGroupSerialized.Lava:
                    case MapCellGroupSerialized.Honey:
                        let liquidId = cellGroup - 3;
                        if ((paint & 0x40) == 0x40) { // shimmer
                            liquidId = 3;
                        }
                        cell = new MapLiquid(light, liquidId);
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
                }
                else {
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
        }
        else {
            worldMap.worldSurfaceEstimated = false;
        }
    }
}

import { Colors } from "../net/color.js";
import { MapCellGroup } from "../map/cell/map-cell.js";
import { MapTile } from "../map/cell/map-tile.js";
import { MapWall } from "../map/cell/map-wall.js";
export var TileType;
(function (TileType) {
    TileType[TileType["None"] = 0] = "None";
    TileType[TileType["Benches"] = 1] = "Benches";
    TileType[TileType["Platforms"] = 2] = "Platforms";
    TileType[TileType["Chairs"] = 3] = "Chairs";
    TileType[TileType["LilyPad"] = 4] = "LilyPad";
    TileType[TileType["Torches"] = 5] = "Torches";
    TileType[TileType["Trees"] = 6] = "Trees";
    TileType[TileType["SoulBottles"] = 7] = "SoulBottles";
    TileType[TileType["Containers"] = 8] = "Containers";
    TileType[TileType["Containers2"] = 9] = "Containers2";
    TileType[TileType["GolfTrophies"] = 10] = "GolfTrophies";
    TileType[TileType["Pots"] = 11] = "Pots";
    TileType[TileType["ShadowOrbs"] = 12] = "ShadowOrbs";
    TileType[TileType["DemonAltar"] = 13] = "DemonAltar";
    TileType[TileType["Traps"] = 14] = "Traps";
    TileType[TileType["Herbs"] = 15] = "Herbs";
    TileType[TileType["PotsSuspended"] = 16] = "PotsSuspended";
    TileType[TileType["Statues"] = 17] = "Statues";
    TileType[TileType["AdamantiteForge"] = 18] = "AdamantiteForge";
    TileType[TileType["MythrilAnvil"] = 19] = "MythrilAnvil";
    TileType[TileType["Stalactite"] = 20] = "Stalactite";
    TileType[TileType["ExposedGems"] = 21] = "ExposedGems";
    TileType[TileType["LongMoss"] = 22] = "LongMoss";
    TileType[TileType["SmallPiles1x1"] = 23] = "SmallPiles1x1";
    TileType[TileType["SmallPiles2x1"] = 24] = "SmallPiles2x1";
    TileType[TileType["LargePiles"] = 25] = "LargePiles";
    TileType[TileType["LargePiles2"] = 26] = "LargePiles2";
    TileType[TileType["DyePlants"] = 27] = "DyePlants";
    TileType[TileType["PlantDetritus"] = 28] = "PlantDetritus";
    TileType[TileType["Crystals"] = 29] = "Crystals";
    TileType[TileType["Painting3X3"] = 30] = "Painting3X3";
    TileType[TileType["Painting6X4"] = 31] = "Painting6X4";
    TileType[TileType["GemLocks"] = 32] = "GemLocks";
    TileType[TileType["PartyPresent"] = 33] = "PartyPresent";
    TileType[TileType["LogicGateLamp"] = 34] = "LogicGateLamp";
    TileType[TileType["WeightedPressurePlate"] = 35] = "WeightedPressurePlate";
    TileType[TileType["GolfCupFlag"] = 36] = "GolfCupFlag";
    TileType[TileType["PottedPlants2"] = 37] = "PottedPlants2";
    TileType[TileType["TeleportationPylon"] = 38] = "TeleportationPylon";
})(TileType || (TileType = {}));
export class MapData {
    constructor(json) {
        this.release = json.release;
        this.versions = json.versions.sort((a, b) => a.release - b.release);
        this.tiles = json.tiles;
        this.walls = json.walls;
        this.liquids = json.liquids;
        this.sky = json.sky;
        this.dirt = json.dirt;
        this.rock = json.rock;
        this.hell = json.hell;
        this.paints = json.paints;
        this.tree = json.tree;
        this.frameImportant = [];
        for (let i = 0; i < this.tiles.length; i++) {
            const tile = this.tiles[i];
            if (tile.width || tile.height || tile.type) {
                tile.frameImportant = true;
            }
            if (tile.frameImportant) {
                this.frameImportant[i] = true;
            }
            if (tile.type) {
                if (typeof tile.type === "number") {
                    tile.type = tile.type;
                }
                else {
                    tile.type = TileType[tile.type];
                    if (tile.type === undefined) {
                        throw new TypeError(`Unknown tile option handling type: "${tile.type}"`);
                    }
                }
            }
        }
        this.anyWall = this.getMapCellPaintable(json.anyWall, true);
        this.unexploredTile = this.getMapCellPaintable(json.unexploredTile, false);
        MapData.prepareAirColors(this.sky, this.sky.count);
        MapData.prepareAirColors(this.rock, this.rock.count - 1);
        MapData.prepareAirColors(this.dirt, this.dirt.count - 1);
    }
    getMapCellPaintable(json, isWall) {
        if (json.id === undefined) {
            if (json.name) {
                json.id = (isWall ? this.walls : this.tiles).findIndex(data => data.name === json.name);
                if (json.id === -1) {
                    throw new TypeError(`Unknown ${isWall ? "wall" : "tile"} name: "${json.name}"`);
                }
            }
            else {
                throw new TypeError(`Missing ${isWall ? "wall" : "tile"} id`);
            }
        }
        if (json.paintId === undefined) {
            if (json.paint) {
                json.paintId = this.paints.findIndex(data => data.name === json.paint);
                if (json.paintId === -1) {
                    throw new TypeError(`Unknown paint name: "${json.paint}"`);
                }
            }
            else {
                json.paintId = 0;
            }
        }
        if (isWall) {
            return new MapWall(0, json.id, 0, json.paintId);
        }
        else {
            return new MapTile(0, json.id, 0, json.paintId);
        }
    }
    tile(id) {
        return this.tiles[id] || MapData.unknownTile;
    }
    tileColor(tile) {
        return this.tile(tile.id).colors[tile.option] || Colors.black;
    }
    tileString(tile) {
        const tileData = this.tile(tile.id);
        const paintData = this.paint(tile.paint);
        return `Tile - ${tileData.name} (${tile.id}) - Option ${tile.option + 1}/${tileData.colors.length} - Paint ${paintData.name} (${tile.paint})`;
    }
    wall(id) {
        return this.walls[id] || MapData.unknownWall;
    }
    wallColor(wall) {
        return this.wall(wall.id).colors[wall.option] || Colors.black;
    }
    wallString(wall) {
        const wallData = this.wall(wall.id);
        const paintData = this.paint(wall.paint);
        return `Tile - ${wallData.name} (${wall.id}) - Option ${wall.option + 1}/${wallData.colors.length} - Paint ${paintData.name} (${wall.paint})`;
    }
    liquid(id) {
        return this.liquids[id] || MapData.unknownLiquid;
    }
    liquidColor(id) {
        return this.liquid(id).color || Colors.black;
    }
    liquidString(id) {
        return `Liquid - ${this.liquid(id).name} (${id})`;
    }
    skyIndex(y, worldSurface) {
        return Math.floor(this.sky.count * (y / worldSurface));
    }
    skyColor(y, worldSurface) {
        return this.sky.colors[this.skyIndex(y, worldSurface)] || this.hell;
    }
    dirtIndex(id) {
        return Math.min(this.dirt.count - 1, id);
    }
    dirtColor(id) {
        return this.dirt.colors[this.dirtIndex(id)];
    }
    rockIndex(id) {
        return Math.min(this.rock.count - 1, id);
    }
    rockColor(id) {
        return this.rock.colors[this.rockIndex(id)];
    }
    hellColor() {
        return this.hell;
    }
    paint(id) {
        return this.paints[id] || MapData.unknownPaint;
    }
    applyPaint(group, color, paintId) {
        const paint = this.paints[paintId];
        if (!paint) {
            return color;
        }
        if (paint.negative) {
            if (group === MapCellGroup.Wall) {
                return [(255 - color[0]) * 0.5, (255 - color[1]) * 0.5, (255 - color[2]) * 0.5];
            }
            else {
                return [255 - color[0], 255 - color[1], 255 - color[2]];
            }
        }
        const r = color[0] / 255;
        const g = color[1] / 255;
        const b = color[2] / 255;
        const factor = paint.shadow ? Math.min(r, g, b) * 0.3 : Math.max(r, g, b);
        return [paint.color[0] * factor, paint.color[1] * factor, paint.color[2] * factor];
    }
    latestRelease() {
        return this.release;
    }
    latestVersion() {
        return this.getVersion(this.release);
    }
    getVersion(release) {
        for (let i = this.versions.length - 1; i >= 0; i--) {
            const versionRelease = this.versions[i].release;
            if (release === versionRelease) {
                return this.versions[i].version;
            }
            else if (release > versionRelease) {
                return `> ${this.versions[i].version}`;
            }
        }
        return "< 1.0";
    }
    static prepareAirColors(air, divide) {
        air.colors = [];
        for (let i = 0; i < air.count; i++) {
            const fac = i / divide;
            const inv = 1 - fac;
            air.colors[i] = [air.min[0] * inv + air.max[0] * fac, air.min[1] * inv + air.max[1] * fac, air.min[2] * inv + air.max[2] * fac];
        }
    }
}
MapData.unknownTile = {
    name: "Unknown",
    colors: [Colors.black]
};
MapData.unknownWall = {
    name: "Unknown",
    colors: [Colors.black]
};
MapData.unknownLiquid = {
    name: "Unknown",
    color: Colors.black
};
MapData.unknownPaint = {
    name: "Unknown",
    color: Colors.black
};

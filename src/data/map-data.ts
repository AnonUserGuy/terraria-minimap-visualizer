import { Color, Colors } from "../net/color.js"
import { MapCellGroup } from "../map/cell/map-cell.js"
import { MapTile } from "../map/cell/map-tile.js"
import { MapWall } from "../map/cell/map-wall.js"

export enum TileType {
    None,
    Benches,
    Platforms,
    Chairs,
    LilyPad,
    Torches,
    Trees,
    SoulBottles,
    Containers,
    Containers2,
    GolfTrophies,
    Pots,
    ShadowOrbs,
    DemonAltar,
    Traps,
    Herbs,
    PotsSuspended,
    Statues,
    AdamantiteForge,
    MythrilAnvil,
    Stalactite,
    ExposedGems,
    LongMoss,
    SmallPiles1x1,
    SmallPiles2x1,
    LargePiles,
    LargePiles2,
    DyePlants,
    PlantDetritus,
    Crystals,
    Painting3X3,
    Painting6X4,
    GemLocks,
    PartyPresent,
    LogicGateLamp,
    WeightedPressurePlate,
    GolfCupFlag,
    PottedPlants2,
    TeleportationPylon
}

export interface MapDataJSON {
    release: number,
    versions: VersionData[],
    tiles: TileData[],
    walls: WallData[],
    liquids: LiquidData[],
    sky: AirData,
    dirt: AirData,
    rock: AirData,
    hell: Color,
    paints: PaintData[],
    tree: TreeData,
    anyWall: MapCellPaintableJSON,
    unexploredTile: MapCellPaintableJSON
}
interface VersionData {
    release: number,
    version: string
}
interface TileData {
    name: string,
    colors: Color[]
    width?: number,
    height?: number,
    frameImportant?: boolean,
    needsWall?: boolean,
    solid?: boolean,
    type?: TileType | string | number;
}
interface WallData {
    name: string,
    colors: Color[]
}
interface LiquidData {
    name: string,
    color: Color
}
interface AirData {
    count: number,
    min: Color,
    max: Color
    colors?: Color[]
}
interface PaintData {
    name: string,
    color: Color,
    negative?: boolean,
    shadow?: boolean
}
interface TreeData {
    base:             UvData,
    baseTop:          UvData,
    baseBranchLeft:   UvData,
    branchLeft:       UvData,
    branchLeftLeafy:  UvData,
    baseBranchRight:  UvData,
    branchRight:      UvData,
    branchRightLeafy: UvData,
    baseBranchBoth:   UvData,
    baseTrunkLeft:    UvData,
    trunkLeft:        UvData,
    baseTrunkRight:   UvData,
    trunkRight:       UvData,
    trunkBoth:        UvData
}
interface UvData {
    0: number,
    1: number
}
interface MapCellPaintableJSON {
    name?: string,
    id?: number,
    paint?: string,
    paintId?: number
}

export class MapData {
    private release: number;
    private versions: VersionData[];
    private tiles: TileData[];
    private walls: WallData[];
    private liquids: LiquidData[];
    private sky: AirData;
    private dirt: AirData;
    private rock: AirData;
    private hell: Color;
    private paints: PaintData[];
    public tree: TreeData;

    public frameImportant: boolean[];
    public anyWall: MapWall;
    public unexploredTile: MapTile;

    private static unknownTile: TileData = {
        name: "Unknown",
        colors: [ Colors.black ]
    }
    private static unknownWall: WallData = {
        name: "Unknown",
        colors: [ Colors.black ]
    }
    private static unknownLiquid: LiquidData = {
        name: "Unknown",
        color: Colors.black 
    }
    private static unknownPaint: PaintData = {
        name: "Unknown",
        color: Colors.black 
    }

    constructor(json: MapDataJSON) {
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
                    tile.type = tile.type as TileType;
                } else {
                    tile.type = TileType[tile.type];
                    if (tile.type === undefined) {
                        throw new TypeError(`Unknown tile option handling type: "${tile.type}"`);
                    }
                }
            }
        }
        this.anyWall = this.getMapCellPaintable(json.anyWall, true) as MapWall;
        this.unexploredTile = this.getMapCellPaintable(json.unexploredTile, false) as MapTile;

        MapData.prepareAirColors(this.sky, this.sky.count);
        MapData.prepareAirColors(this.rock, this.rock.count - 1);
        MapData.prepareAirColors(this.dirt, this.dirt.count - 1);
    }

    private getMapCellPaintable(json: MapCellPaintableJSON, isWall) {
        if (json.id === undefined) {
            if (json.name) {
                json.id = (isWall ? this.walls : this.tiles).findIndex(data => data.name === json.name);
                if (json.id === -1) {
                    throw new TypeError(`Unknown ${isWall ? "wall" : "tile"} name: "${json.name}"`);
                }
            } else {
                throw new TypeError(`Missing ${isWall ? "wall" : "tile"} id`);
            }
        }
        if (json.paintId === undefined) {
            if (json.paint) {
                json.paintId = this.paints.findIndex(data => data.name === json.paint);
                if (json.paintId === -1) {
                    throw new TypeError(`Unknown paint name: "${json.paint}"`);
                }
            } else {
                json.paintId = 0;
            }
        }
        if (isWall) {
            return new MapWall(0, json.id, 0, json.paintId);
        } else {
            return new MapTile(0, json.id, 0, json.paintId);
        }
    }

    public tile(id: number) {
        return this.tiles[id] || MapData.unknownTile;
    }
    public tileColor(tile: MapTile) {
        return this.tile(tile.id).colors[tile.option] || Colors.black;
    }
    public tileString(tile: MapTile) {
        const tileData = this.tile(tile.id);
        const paintData = this.paint(tile.paint);
        return `Tile - ${tileData.name} (${tile.id}) - Option ${tile.option + 1}/${tileData.colors.length} - Paint ${paintData.name} (${tile.paint})`; 
    }

    public wall(id: number) {
        return this.walls[id] || MapData.unknownWall;
    }
    public wallColor(wall: MapWall) {
        return this.wall(wall.id).colors[wall.option] || Colors.black;
    }
    public wallString(wall: MapWall) {
        const wallData = this.wall(wall.id);
        const paintData = this.paint(wall.paint);
        return `Tile - ${wallData.name} (${wall.id}) - Option ${wall.option + 1}/${wallData.colors.length} - Paint ${paintData.name} (${wall.paint})`; 
    }

    public liquid(id: number) {
        return this.liquids[id] || MapData.unknownLiquid;
    }
    public liquidColor(id: number) {
        return this.liquid(id).color || Colors.black;
    }
    public liquidString(id: number) {
        return `Liquid - ${this.liquid(id).name} (${id})`;
    }

    public skyIndex(y: number, worldSurface: number) {
        return Math.floor(this.sky.count * (y / worldSurface));
    }
    public skyColor(y: number, worldSurface: number) {
        return this.sky.colors[this.skyIndex(y, worldSurface)] || this.hell;
    }

    public dirtIndex(id: number) {
        return Math.min(this.dirt.count - 1, id);
    }
    public dirtColor(id: number) {
        return this.dirt.colors[this.dirtIndex(id)];
    }

    public rockIndex(id: number) {
        return Math.min(this.rock.count - 1, id);
    }
    public rockColor(id: number) {
        return this.rock.colors[this.rockIndex(id)];
    }

    public hellColor() {
        return this.hell;
    }

    public paint(id: number) {
        return this.paints[id] || MapData.unknownPaint;
    }
    public applyPaint(group: MapCellGroup, color: Color, paintId: number): Color {
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

    public latestRelease() {
        return this.release;
    }

    public latestVersion() {
        return this.getVersion(this.release);
    }

    public getVersion(release: number) {
        for (let i = this.versions.length - 1; i >= 0; i--) {
            const versionRelease = this.versions[i].release;
            if (release === versionRelease) {
                return this.versions[i].version;
            } else if (release > versionRelease) {
                return `> ${this.versions[i].version}`;
            }
        }
        return "< 1.0";
    }

    private static prepareAirColors(air: AirData, divide: number) {
        air.colors = [];
        for (let i = 0; i < air.count; i++) {
            const fac = i / divide;
            const inv = 1 - fac;
            air.colors[i] = [air.min[0] * inv + air.max[0] * fac, air.min[1] * inv + air.max[1] * fac, air.min[2] * inv + air.max[2] * fac];
        }
    }
}

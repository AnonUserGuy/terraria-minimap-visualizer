import PaintID from "./id/paint-ids.js";
import TileID from "./id/tile-ids.js";
import WallID from "./id/wall-ids.js";
import TileLookupUtil from "./terraria-tile-lookup-util.js";

export enum TileGroup {
    Empty,
    Tile,
    Wall,
    Water,
    Lava,
    Honey,
    Air,
    DirtRock
}

export default class MapTile {
    public type: number;
    public light: number;
    private _extraData: number;
    public group: number;
    public id: number | undefined;
    public option: number | undefined;

    public static air = MapTile.create(0, 255, 0, TileGroup.Air);
    public static shadowDirt = MapTile.create(1, 0, PaintID.ShadowPaint, TileGroup.Tile, TileID.Dirt, 0);
    public static anyWall = MapTile.create(1, 0, 0, TileGroup.Wall, WallID.DirtUnsafe, 0);

    constructor(type: number, light: number, extraData: number, group: number, id: number | undefined, option: number | undefined) {
        this.type = type;
        this.light = light;
        this._extraData = extraData;

        this.group = group;
        this.id = id;
        this.option = option;
    }

    public get Color() {
        return this._extraData & 127;
    }
    public set Color(value: number) {
        this._extraData = (this._extraData & 128) | (value & 127);
    }

    public getXnaColor() {
        return TileLookupUtil.getMapTileXnaColor(this);
    }

    public withLight(light: number) {
        return new MapTile(this.type, light, this._extraData | 128, this.group, this.id, this.option);
    }

    public static create(type: number, light: number, color: number, group: number, id?: number | undefined, option?: number | undefined) {
        return new MapTile(type, light, color | 128, group, id, option);
    }

    public equals(other: MapTile) {
        return !!other && this.type === other.type && this.light === other.light && this.Color === other.Color;
    }

    public equalsAfterExport(other: MapTile) {
        return !!other && (this.type === other.type
            || ((this.group === TileGroup.Air || this.group === TileGroup.DirtRock)
            && (other.group === TileGroup.Air || other.group === TileGroup.DirtRock)))
            && this.Color === other.Color;
    }

    public equalsWithoutLight(other: MapTile) {
        return !!other && this.type === other.type && this.Color === other.Color;
    }

    public toString() {
        let str;
        if (this.group === TileGroup.DirtRock) {
            str = "Underground Air";
        } else if (this.group === TileGroup.Water && this.id === 3) {
            str = "Shimmer";
        } else {
            str = TileGroup[this.group];
        }
        str += `, light: ${this.light}`;
        if (this.group === TileGroup.Tile || this.group === TileGroup.Wall) {
            str += `, paint: ${PaintID[this.Color]} (${this.Color}), type: ${this.group === TileGroup.Tile ? TileID[this.id!] : WallID[this.id!]} (${this.id!}), option: ${this.option!}`;
        }
        return str;
    }
}

import { PaintID } from "../id/paint-ids.js";
import { TileID } from "../id/tile-ids.js";
import { WallID } from "../id/wall-ids.js";
import { TileLookupUtil } from "./tile-lookup-util.js";

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

export class MapTile {
    public type: number;
    public light: number;
    public paint: PaintID;
    public group: number;
    public id: TileID | WallID | undefined;
    public option: number | undefined;

    public static air = new MapTile(0, 255, 0, TileGroup.Air);
    public static shadowDirt = new MapTile(1, 0, PaintID.ShadowPaint, TileGroup.Tile, TileID.Dirt, 0);
    public static anyWall = new MapTile(1, 0, 0, TileGroup.Wall, WallID.DirtUnsafe, 0);

    constructor(type: number, light: number, paint: number, group: number, id?: number | undefined, option?: number | undefined) {
        this.type = type;
        this.light = light;
        this.paint = paint;

        this.group = group;
        this.id = id;
        this.option = option;
    }

    public getColor() {
        return TileLookupUtil.getTileColor(this);
    }

    public getColorPainted() {
        return TileLookupUtil.applyPaint(this.type, this.getColor(), this.paint);
    }

    public copyWithLight(light: number) {
        return new MapTile(this.type, light, this.paint, this.group, this.id, this.option);
    }

    public equals(other: MapTile) {
        return !!other && this.type === other.type && this.light === other.light && this.paint === other.paint;
    }

    public equalsAfterExport(other: MapTile) {
        return !!other && (this.type === other.type
            || ((this.group === TileGroup.Air || this.group === TileGroup.DirtRock)
            && (other.group === TileGroup.Air || other.group === TileGroup.DirtRock)))
            && this.paint === other.paint;
    }

    public equalsWithoutLight(other: MapTile) {
        return !!other && this.type === other.type && this.paint === other.paint;
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
            str += `, paint: ${PaintID[this.paint]} (${this.paint}), type: ${this.group === TileGroup.Tile ? TileID[this.id!] : WallID[this.id!]} (${this.id!}), option: ${this.option!}`;
        }
        return str;
    }
}

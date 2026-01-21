import { PaintID } from "../id/paint-ids.js";
import { TileID } from "../id/tile-ids.js";
import { WallID } from "../id/wall-ids.js";
import { TileLookupUtil } from "./tile-lookup-util.js";
export var TileGroup;
(function (TileGroup) {
    TileGroup[TileGroup["Empty"] = 0] = "Empty";
    TileGroup[TileGroup["Tile"] = 1] = "Tile";
    TileGroup[TileGroup["Wall"] = 2] = "Wall";
    TileGroup[TileGroup["Water"] = 3] = "Water";
    TileGroup[TileGroup["Lava"] = 4] = "Lava";
    TileGroup[TileGroup["Honey"] = 5] = "Honey";
    TileGroup[TileGroup["Air"] = 6] = "Air";
    TileGroup[TileGroup["DirtRock"] = 7] = "DirtRock";
})(TileGroup || (TileGroup = {}));
export class MapTile {
    constructor(type, light, paint, group, id, option) {
        this.type = type;
        this.light = light;
        this.paint = paint;
        this.group = group;
        this.id = id;
        this.option = option;
    }
    getColor() {
        return TileLookupUtil.getTileColor(this);
    }
    getColorPainted() {
        return TileLookupUtil.applyPaint(this.type, this.getColor(), this.paint);
    }
    copyWithLight(light) {
        return new MapTile(this.type, light, this.paint, this.group, this.id, this.option);
    }
    equals(other) {
        return !!other && this.type === other.type && this.light === other.light && this.paint === other.paint;
    }
    equalsAfterExport(other) {
        return !!other && (this.type === other.type
            || ((this.group === TileGroup.Air || this.group === TileGroup.DirtRock)
                && (other.group === TileGroup.Air || other.group === TileGroup.DirtRock)))
            && this.paint === other.paint;
    }
    equalsWithoutLight(other) {
        return !!other && this.type === other.type && this.paint === other.paint;
    }
    toString() {
        let str;
        if (this.group === TileGroup.DirtRock) {
            str = "Underground Air";
        }
        else if (this.group === TileGroup.Water && this.id === 3) {
            str = "Shimmer";
        }
        else {
            str = TileGroup[this.group];
        }
        str += `, light: ${this.light}`;
        if (this.group === TileGroup.Tile || this.group === TileGroup.Wall) {
            str += `, paint: ${PaintID[this.paint]} (${this.paint}), type: ${this.group === TileGroup.Tile ? TileID[this.id] : WallID[this.id]} (${this.id}), option: ${this.option}`;
        }
        return str;
    }
}
MapTile.air = new MapTile(0, 255, 0, TileGroup.Air);
MapTile.shadowDirt = new MapTile(1, 0, PaintID.ShadowPaint, TileGroup.Tile, TileID.Dirt, 0);
MapTile.anyWall = new MapTile(1, 0, 0, TileGroup.Wall, WallID.DirtUnsafe, 0);

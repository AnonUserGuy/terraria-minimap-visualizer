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
    constructor(type, light, extraData, group, id, option) {
        this.type = type;
        this.light = light;
        this._extraData = extraData;
        this.group = group;
        this.id = id;
        this.option = option;
    }
    get Color() {
        return this._extraData & 127;
    }
    set Color(value) {
        this._extraData = (this._extraData & 128) | (value & 127);
    }
    getXnaColor() {
        return TileLookupUtil.getMapTileXnaColor(this);
    }
    withLight(light) {
        return new MapTile(this.type, light, this._extraData | 128, this.group, this.id, this.option);
    }
    static create(type, light, color, group, id, option) {
        return new MapTile(type, light, color | 128, group, id, option);
    }
    equals(other) {
        return !!other && this.type === other.type && this.light === other.light && this.Color === other.Color;
    }
    equalsAfterExport(other) {
        return !!other && (this.type === other.type
            || ((this.group === TileGroup.Air || this.group === TileGroup.DirtRock)
                && (other.group === TileGroup.Air || other.group === TileGroup.DirtRock)))
            && this.Color === other.Color;
    }
    equalsWithoutLight(other) {
        return !!other && this.type === other.type && this.Color === other.Color;
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
            str += `, paint: ${PaintID[this.Color]} (${this.Color}), type: ${this.group === TileGroup.Tile ? TileID[this.id] : WallID[this.id]} (${this.id}), option: ${this.option}`;
        }
        return str;
    }
}
MapTile.air = MapTile.create(0, 255, 0, TileGroup.Air);
MapTile.shadowDirt = MapTile.create(1, 0, PaintID.ShadowPaint, TileGroup.Tile, TileID.Dirt, 0);
MapTile.anyWall = MapTile.create(1, 0, 0, TileGroup.Wall, WallID.DirtUnsafe, 0);

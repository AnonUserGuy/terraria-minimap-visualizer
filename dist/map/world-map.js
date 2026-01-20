import { TileGroup } from "./map-tile.js";
import { MapDeserializer } from "./map-deserializer.js";
import { SchematicSerializer } from "../tedit/schematic-serializer.js";
import { BinaryReader } from "../net/binary-reader.js";
import { BinaryWriter } from "../net/binary-writer.js";
import { TileLookupUtil } from "./tile-lookup-util.js";
export class WorldMap {
    constructor(width = 0, height = 0) {
        this._width = width;
        this._height = height;
        this.airTilesDepths = [];
        this.airTiles = [];
        this.tiles = [];
    }
    get width() {
        return this._width;
    }
    set width(val) {
        this._width = val;
        this.updateDimensions();
    }
    get height() {
        return this._height;
    }
    set height(val) {
        this._height = val;
        this.updateDimensions();
    }
    setDimensions(w, h) {
        this._width = w;
        this._height = h;
        this.updateDimensions();
    }
    updateDimensions() {
        this.tiles = Array(this._height * this._width);
    }
    setTile(x, y, tile) {
        if (tile.group === TileGroup.Air && tile !== this.airTiles[this.airTiles.length - 1]) {
            this.airTiles.push(tile);
            this.airTilesDepths.push(y);
        }
        this.tiles[y * this._width + x] = tile;
    }
    tile(x, y) {
        return this.tiles[y * this._width + x];
    }
    fixAirTiles() {
        for (let i = 0; i < this.airTiles.length; i++) {
            const tile = this.airTiles[i];
            const y = this.airTilesDepths[i];
            tile.type = TileLookupUtil.getMapAirTile(y, this.worldSurface);
        }
        this.airTiles = [];
        this.airTilesDepths = [];
    }
    async read(data) {
        const reader = new BinaryReader(data);
        await MapDeserializer.load(reader, this);
        this.fixAirTiles();
    }
    writeSchematic() {
        const writer = new BinaryWriter();
        SchematicSerializer.writeSchematic(writer, this);
        writer.trim();
        return writer.data.buffer;
    }
    getLatestRelease() {
        return TileLookupUtil.lastestRelease;
    }
}

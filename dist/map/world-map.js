import { MapCellGroup } from "./cell/map-cell.js";
import { MapReader } from "./map-reader.js";
import { SchematicWriter } from "../tedit/schematic-writer.js";
import { BinaryReader } from "../net/binary-reader.js";
import { BinaryWriter } from "../net/binary-writer.js";
import { mapCellColors } from "./map-cell-colors.js";
import { MapAirDepth } from "./cell/map-air.js";
import { VersionData } from "../data/version-data.js";
export class WorldMap {
    constructor(width = 0, height = 0) {
        this._width = width;
        this._height = height;
        this.skyDepths = [];
        this.sky = [];
        this.cells = [];
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
        this.cells = Array(this._height * this._width);
    }
    setCell(x, y, tile) {
        if (tile.group === MapCellGroup.Air && tile.depth === MapAirDepth.Sky && tile !== this.sky[this.sky.length - 1]) {
            this.sky.push(tile);
            this.skyDepths.push(y);
        }
        this.cells[y * this._width + x] = tile;
    }
    cell(x, y) {
        return this.cells[y * this._width + x];
    }
    fixSky() {
        for (let i = 0; i < this.sky.length; i++) {
            const tile = this.sky[i];
            const y = this.skyDepths[i];
            tile.id = mapCellColors.getSkyId(y, this.worldSurface);
        }
        this.sky = [];
        this.skyDepths = [];
    }
    async read(data) {
        const reader = new BinaryReader(data);
        await MapReader.read(reader, this);
        this.fixSky();
        this.version = VersionData.getVersionString(this.release);
    }
    isReleaseSafe() {
        return this.release <= VersionData.latestRelease;
    }
    writeSchematic() {
        const writer = new BinaryWriter();
        SchematicWriter.writeSchematic(writer, this);
        writer.trim();
        return writer.data.buffer;
    }
}

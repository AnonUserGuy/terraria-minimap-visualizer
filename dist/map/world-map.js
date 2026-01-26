import { Colors } from "../net/color.js";
import { BinaryReader } from "../net/binary-reader.js";
import { BinaryWriter } from "../net/binary-writer.js";
import { MapReader } from "./map-reader.js";
import { SchematicWriter } from "../tedit/schematic-writer.js";
import { MapData } from "../data/map-data.js";
import { MapCellGroup } from "./cell/map-cell.js";
export class WorldMap {
    constructor(mapData, width = 0, height = 0) {
        this.mapData = mapData instanceof MapData ? mapData : new MapData(mapData);
        this._width = width;
        this._height = height;
        this.cells = Array(this._height * this._width);
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
    get underworldLayer() {
        return this._height - 200;
    }
    setDimensions(w, h) {
        this._width = w;
        this._height = h;
        this.updateDimensions();
    }
    updateDimensions() {
        this.cells = Array(this._height * this._width);
    }
    setCell(x, y, cell) {
        this.cells[y * this._width + x] = cell;
    }
    cell(x, y) {
        return this.cells[y * this._width + x];
    }
    color(x, y) {
        const cell = this.cell(x, y);
        if (!cell) {
            return Colors.black;
        }
        switch (cell.group) {
            case MapCellGroup.Air:
                if (y < this.worldSurface) {
                    return this.mapData.skyColor(y, this.worldSurface);
                }
                else if (y < this.rockLayer) {
                    return this.mapData.dirtColor(cell.id);
                }
                else if (y < this.underworldLayer) {
                    return this.mapData.rockColor(cell.id);
                }
                else {
                    return this.mapData.hellColor();
                }
            case MapCellGroup.Tile:
                return this.mapData.tileColor(cell);
            case MapCellGroup.Wall:
                return this.mapData.wallColor(cell);
            case MapCellGroup.Liquid:
                return this.mapData.liquidColor(cell.id);
        }
        return Colors.black;
    }
    colorPainted(x, y) {
        const cell = this.cell(x, y);
        if (!cell) {
            return Colors.black;
        }
        if (cell.group === MapCellGroup.Tile || cell.group === MapCellGroup.Wall) {
            return this.mapData.applyPaint(cell.group, this.color(x, y), cell.paint);
        }
        else {
            return this.color(x, y);
        }
    }
    getString(x, y) {
        let res = `(${x}, ${y}): `;
        const cell = this.cell(x, y);
        if (!cell) {
            return res + "Empty";
        }
        res += `Light ${cell.light}/255 - `;
        switch (cell.group) {
            case MapCellGroup.Air:
                res += "Air - ";
                if (y < this.worldSurface) {
                    return res + `Surface Layer - Shade ${this.mapData.skyIndex(y, this.worldSurface)}`;
                }
                else if (y < this.rockLayer) {
                    return res + `Underground Layer - Shade ${this.mapData.dirtIndex(cell.id)}`;
                }
                else if (y < this.underworldLayer) {
                    return res + `Caverns Layer - Shade ${this.mapData.rockIndex(cell.id)}`;
                }
                else {
                    return res + "Underworld Layer";
                }
            case MapCellGroup.Tile:
                return res + this.mapData.tileString(cell);
            case MapCellGroup.Wall:
                return res + this.mapData.wallString(cell);
            case MapCellGroup.Liquid:
                return res + this.mapData.liquidString(cell.id);
        }
        return res + "Unknown";
    }
    async read(data) {
        const reader = new BinaryReader(data);
        await MapReader.read(reader, this);
        this.version = this.mapData.getVersion(this.release);
    }
    isReleaseSafe() {
        return this.release <= this.mapData.latestRelease();
    }
    writeSchematic() {
        const writer = new BinaryWriter();
        SchematicWriter.writeSchematic(writer, this);
        writer.trim();
        return writer.data.buffer;
    }
}

import { BinaryWriter } from "../net/binary-writer.js";
import { TileType } from "../data/map-data.js";
import { LiquidID } from "../id/liquid-ids.js";
import { MapCell, MapCellGroup } from "../map/cell/map-cell.js";
import { MapWall } from "../map/cell/map-wall.js";
import { MapTile } from "../map/cell/map-tile.js";
import { WorldMap } from "../map/world-map.js";

export class SchematicWriter {

    // largely adapted from Terraria-Map-Editor/src/TEdit.Editor/Clipboard/ClipboardBuffer.File.cs -> ClipboardBuffer.SaveV4
    static writeSchematic(bw: BinaryWriter, worldMap: WorldMap) {
        bw.writeString(worldMap.worldName!);
        bw.writeInt32(worldMap.mapData.latestRelease() + 10000);
        bw.writeBitArray(worldMap.mapData.frameImportant);
        bw.writeInt32(worldMap.width);
        bw.writeInt32(worldMap.height);

        this.writeCells(bw, worldMap);

        // chests
        bw.writeInt16(0); // count 
        bw.writeInt16(0); // max chest contents

        // signs
        bw.writeInt16(0); // count

        // entities
        bw.writeInt32(0); // count

        bw.writeString(worldMap.worldName!);
        bw.writeInt32(worldMap.mapData.latestRelease());
        bw.writeInt32(worldMap.width);
        bw.writeInt32(worldMap.height);
    }

    // largely adapted from Terraria-Map-Editor/src/TEdit.Terraria/World.FileV2.cs -> World.SaveTiles
    static writeCells(bw: BinaryWriter, worldMap: WorldMap) {
        const u: number[] = [];
        const v: number[] = [];
        let lastWall = worldMap.mapData.anyWall;

        for (let x = 0; x < worldMap.width; x++) {
            for (let y = 0; y < worldMap.height; y++) {
                const i = y * worldMap.width + x;
                const cell = worldMap.cells[i] || worldMap.mapData.unexploredTile;
                const frameImportant = cell.group === MapCellGroup.Tile && worldMap.mapData.frameImportant[cell.id];
                let needsWall = false;
                let u2 = 0;
                let v2 = 0;
                if (cell !== worldMap.mapData.unexploredTile) {
                    if (frameImportant) {
                        this.getTileUVFromGeometry(worldMap, cell as MapTile, x, y, u, v);
                        const tileData = worldMap.mapData.tile(cell.id);
                        if (tileData.type) {
                            [u2, v2] = this.getTileUVFromOption(tileData.type as TileType, (cell as MapTile).option);
                            if (tileData.type === TileType.Torches) {
                                needsWall = this.needsWall(worldMap, x, y);
                            }
                        }
                    } else if (cell.group === MapCellGroup.Wall) {
                        lastWall = cell as MapWall;
                    }
                }

                const res = this.serializeCellData(cell, u[i] + u2, v[i] + v2, needsWall, lastWall, frameImportant);
                const { cellData, headerIndex } = res;
                let { dataIndex } = res;

                let header1 = cellData[headerIndex];

                let rle = 0;
                let y2 = y + 1;
                let i2 = y2 * worldMap.width + x;
                while (y2 < worldMap.height && cell.equalsAfterExport(worldMap.cell(x, y2) || worldMap.mapData.unexploredTile) && (cell.group !== MapCellGroup.Tile || !frameImportant || (u[i] === u[y2 * worldMap.width + x] && v[i] === v[y2 * worldMap.width + x]))) {
                    rle++;
                    y2++;
                    i2 = y2 * worldMap.width + x;
                }
                y += rle;

                if (rle > 0) {
                    cellData[dataIndex++] = rle & 0xFF;
                    if (rle <= 255) {
                        header1 |= 0b0100_0000;
                    } else {
                        cellData[dataIndex++] = rle >> 8;
                        header1 |= 0b1000_0000;
                    }
                    cellData[headerIndex] = header1;
                }

                bw.writeUInt8Array(cellData, headerIndex, dataIndex - headerIndex);
            }
        }
    }

    // largely adapted from Terraria-Map-Editor/src/TEdit.Terraria/World.FileV2.cs -> World.SerializeTileData
    static serializeCellData(cell: MapCell, u: number, v: number, needsWall: boolean, wall: MapWall, frameImportant: boolean) {
        const cellData = new Uint8Array(16);
        let dataIndex = 4;

        let header3 = 0;
        let header2 = 0;
        let header1 = 0;
        if (cell.group === MapCellGroup.Tile) {
            header1 |= 0b0000_0010;
            cellData[dataIndex++] = cell.id & 0xFF;
            if (cell.id > 255) {
                header1 |= 0b0010_0000;
                cellData[dataIndex++] = cell.id >> 8;
            }

            if (frameImportant) {
                u ||= 0;
                v ||= 0;
                cellData[dataIndex++] = (u & 0xFF); // low byte
                cellData[dataIndex++] = ((u & 0xFF00) >> 8); // high byte
                cellData[dataIndex++] = (v & 0xFF); // low byte
                cellData[dataIndex++] = ((v & 0xFF00) >> 8); // high byte
            }

            if ((cell as MapTile).paint) {
                header3 |= 0b0000_1000;
                cellData[dataIndex++] = (cell as MapTile).paint;
            }

            if (needsWall) {
                header1 |= 0b0000_0100;
                cellData[dataIndex++] = wall.id & 0xFF;

                if (wall.paint) {
                    header3 |= 0b0001_0000;
                    cellData[dataIndex++] = wall.paint;
                }
            }
        } else if (cell.group === MapCellGroup.Wall) {
            header1 |= 0b0000_0100;
            cellData[dataIndex++] = cell.id & 0xFF;

            if ((cell as MapWall).paint) {
                header3 |= 0b0001_0000;
                cellData[dataIndex++] = (cell as MapWall).paint;
            }
        } else if (cell.group === MapCellGroup.Liquid) {
            if (cell.id === LiquidID.Water) {
                header1 |= 0b0000_1000;
            } else if (cell.id === LiquidID.Lava) {
                header1 |= 0b0001_0000;
            } else if (cell.id === LiquidID.Honey) {
                header1 |= 0b0001_1000;
            } else { // shimmer
                header3 |= 0b1000_0000;
            }
            cellData[dataIndex++] = 255;
        }

        let headerIndex = 3;
        if (header3 !== 0) {
            header2 |= 0b0000_0001;
            cellData[headerIndex--] = header3;
        }
        if (header2 !== 0) {
            header1 |= 0b0000_0001;
            cellData[headerIndex--] = header2;
        }
        cellData[headerIndex] = header1;
        return { cellData, headerIndex, dataIndex };
    }

    static getTileUVFromGeometry(worldMap: WorldMap, tile: MapTile, x: number, y: number, u: number[], v: number[]) {
        const tileData = worldMap.mapData.tile(tile.id);
        if (tileData.type === TileType.Trees) {
            this.resolveTree(worldMap, x, y, u, v);
        } else if (tileData.type === TileType.Stalactite) {
            this.resolveStalactite(worldMap, x, y, v);
        } else if (tileData.type === TileType.PlantDetritus) {
            this.resolvePlantDetritus(worldMap, x, y, u, v);
        } else {
            if (tileData.width) {
                this.resolveWidth(worldMap, x, y, tileData.width, u);
            }
            if (tileData.height) {
                this.resolveHeight(worldMap, x, y, tileData.height, v);
            }
        }
    }

    static getTileUVFromOption(optionType: TileType, option: number) {
        const result = [0, 0];
        switch (optionType) {
            case TileType.Benches:
                {
                    let n: number;
                    switch (option) {
                        case 0:
                            n = 0; // 21, 23
                            break;
                        case 2:
                            n = 43;
                            break;
                        case 1:
                        default:
                            n = 1; // ?
                            break;
                    }
                    result[0] = n * 54;
                    break;
                }
            case TileType.Platforms:
                if (option === 1) {
                    result[1] = 48 * 18;
                }
                break;
            case TileType.Chairs:
                if (option === 1) {
                    result[1] = 1 * 40; // 20
                }
                break;
            case TileType.LilyPad:
                result[1] = option * 18;
                break;
            case TileType.Torches:
                if (option === 1) {
                    result[0] = 66;
                }
                break;
            case TileType.SoulBottles:
                result[1] = option * 36;
                break;
            case TileType.Containers:
                {
                    let n: number;
                    switch (option) {
                        case 1:
                            n = 1; // 2, 10, 13, 15
                            break;
                        case 2:
                            n = 3; // 4
                            break;
                        case 3:
                            n = 6;
                            break;
                        case 4:
                            n = 11; // 17
                            break;
                        default:
                            n = 0;
                            break;
                    }
                    result[0] = n * 36;
                    break;
                }
            case TileType.Containers2:
                result[0] = option * 36;
                break;
            case TileType.GolfTrophies:
                result[0] = option * 36;
                break;
            case TileType.Pots:
                result[1] = option * 108;
                break;
            case TileType.ShadowOrbs:
                if (option === 1) {
                    result[0] = 36;
                }
                break;
            case TileType.DemonAltar:
                if (option === 1) {
                    result[0] = 54;
                }
                break;
            case TileType.Traps:
                {
                    let n: number;
                    switch (option) {
                        case 1:
                            n = 1; // 2, 3, 4
                        case 2:
                            n = 5;
                        default:
                            n = 0;
                    }
                    result[1] = n * 18;
                    break;
                }
            case TileType.Herbs:
                result[0] = option * 18;
                break;
            case TileType.PotsSuspended:
                result[0] = option * 36;
                break;
            case TileType.Statues:
                switch (option) {
                    case 1:
                        result[0] = 1548;
                        break;
                    case 2:
                        result[0] = 1656;
                        break;
                    default:
                        result[0] = 0;
                        break;
                }
                break;
            case TileType.AdamantiteForge:
                if (option === 1) {
                    result[0] = 52;
                }
                break;
            case TileType.MythrilAnvil:
                if (option === 1) {
                    result[0] = 28;
                }
                break;
            case TileType.Stalactite:
                result[0] = option * 52;
                break;
            case TileType.ExposedGems:
                result[0] = option * 18;
                break;
            case TileType.LongMoss:
                result[0] = option * 22;
                break;
            case TileType.SmallPiles1x1:
                {
                    let n: number;
                    switch (option) {
                        case 0:
                            n = 0; // 0~5, 19, 20, 21, 22, 23, 24, 33, 38, 39, 40, 41~58
                            break;
                        case 2:
                            n = 6; // 6~15, 59~61
                            break;
                        case 1:
                            n = 16; // 16~18, 31, 32
                            break;
                        case 3:
                            n = 25; // 25~30
                            break;
                        case 4:
                            n = 34; // 34~37
                            break;
                        case 11:
                            n = 62; // 62~64
                        default:
                            n = 0;
                            break;
                    }
                    result[0] = (n % 18) * 36;
                    result[1] = Math.floor(n / 18) + 1 * 18;
                    break;
                }
            case TileType.SmallPiles2x1:
                {
                    let n: number;
                    switch (option) {
                        case 0:
                            n = 0; // 0~5, 28, 29, 30, 31, 32, 54~71
                            break;
                        case 1:
                            n = 6; // 6~11, 33, 34, 35, 72
                            break;
                        case 2:
                            n = 12; // 12~27
                            break;
                        case 3:
                            n = 36; // 36~47
                            break;
                        case 4:
                            n = 48; // 48~53
                            break;
                        case 11:
                            n = 73; // 73~77
                        default:
                            n = 0;
                            break;
                    }
                    result[0] = n * 18;
                    break;
                }
            case TileType.LargePiles:
                {
                    let n: number;
                    switch (option) {
                        case 2:
                            n = 0; // 0~6
                            break;
                        case 0:
                            n = 7; // 7~21, 33, 34, 35
                            break;
                        case 1:
                            n = 22; // 22~24
                            break;
                        case 5:
                            n = 25; // 25
                            break;
                        case 3:
                            n = 26; // 26~31
                            break;
                        default:
                            n = 0;
                            break;
                    }
                    result[0] = n * 54;
                    break;
                }
            case TileType.LargePiles2:
                {
                    let n: number;
                    switch (option) {
                        case 0:
                            n = 0; // 0~2, 14, 15, 16, 23~24, 29~46
                            break;
                        case 6:
                            n = 3; // 3~5
                            break;
                        case 7:
                            n = 6; // 6~8
                            break;
                        case 4:
                            n = 9; // 9~13, 17
                            break;
                        case 8:
                            n = 18; // 18~22
                            break;
                        case 1:
                            n = 25; // 25~28, 47~49
                            break;
                        case 10:
                            n = 50; // 50~51
                            break;
                        case 2:
                            n = 52; // 52~55
                            break;
                        default:
                            n = 0;
                            break;
                    } // 3, 5, 9 skipped?
                    result[0] = (n % 36) * 54;
                    result[1] = Math.floor(n / 36) * 36;
                    break;
                }
            case TileType.DyePlants:
                result[0] = option * 34;
                break;
            case TileType.Crystals:
                if (option === 1) {
                    result[0] = 324;
                }
                break;
            case TileType.Painting3X3:
                {
                    let n: number;
                    switch (option) {
                        case 0:
                            n = 0;
                            break;
                        case 1:
                            n = 12;
                            break;
                        case 2:
                            n = 16;
                            break;
                        case 3:
                            n = 41;
                            break;
                        case 4:
                            n = 46;
                            break;
                        default:
                            n = 0;
                            break;
                    }
                    result[0] = (n % 36) * 54;
                    result[1] = Math.floor(n / 36) * 54;
                    break;
                }
            case TileType.Painting6X4:
                {
                    let n: number;
                    if (option === 1) {
                        n = 22;
                    } else {
                        n = 0;
                    }
                    result[1] = n * 72;
                    break;
                }
            case TileType.GemLocks:
                result[0] = option * 54;
                break;
            case TileType.PartyPresent:
                result[0] * option * 36;
                break;
            case TileType.LogicGateLamp:
                result[0] = option * 18;
                break;
            case TileType.WeightedPressurePlate:
                result[1] = option * 18;
                break;
            case TileType.GolfCupFlag:
                result[0] = option * 18;
                break;
            case TileType.PottedPlants2:
                if (option === 1) {
                    result[0] = 8 * 54
                }
                break;
            case TileType.TeleportationPylon:
                result[0] = option * 54;
                break;
        }
        return result;
    }

    static resolveWidth(worldMap: WorldMap, x: number, y: number, width: number, u: number[]) {
        const i = y * worldMap.width + x;
        const tile = worldMap.cells[i];
        if (x === 0) {
            u[i] = 0;
        } else {
            const i2 = y * worldMap.width + x - 1;
            const tileR = worldMap.cells[i2];
            if (tileR && tileR.id === tile.id) {
                u[i] = (u[i2] + 18) % (18 * width);
            } else {
                u[i] = 0;
            }
        }
    }

    static resolveHeight(worldMap: WorldMap, x: number, y: number, height: number, v: number[]) {
        const i = y * worldMap.width + x;
        const tile = worldMap.cells[i];
        if (y === 0) {
                v[i] = 0;
            } else {
                const i2 = (y - 1) * worldMap.width + x;
                const tileU = worldMap.cells[i2];
                if (tileU && tileU.id === tile.id) {
                    v[i] = (v[i2] + 18) % (18 * height);
                } else {
                    v[i] = 0;
                }
            }
    }

    static resolveTree(worldMap: WorldMap, x: number, y: number, u: number[], v: number[]) {
        let i = y * worldMap.width + x;
        if (u[i] !== undefined) {
            return;
        }
        const treeData = worldMap.mapData.tree;

        // find top of tree
        let tolerance = 2;
        while (tolerance > 0 && y > 0) {
            if (this.treeAt(worldMap, x, y - 1)) {
                y--;
                tolerance = 2;
                continue;
            }
            if (x > 0 && this.treeAt(worldMap, x - 1, y)) {
                x--;
                tolerance--;
                continue;
            }
            if (x < worldMap.width - 1 && this.treeAt(worldMap, x + 1, y)) {
                x++;
                tolerance--;
                continue;
            }
            break;
        }

        i = y * worldMap.width + x;
        u[i] = treeData.baseTop[0];
        v[i] = treeData.baseTop[1];

        // descend tree
        y++;
        for (; this.treeAt(worldMap, x, y + 1); y++) {
            i = y * worldMap.width + x;
            let left = false;
            let right = false;
            if (x > 0 && this.treeAt(worldMap, x - 1, y)) {
                left = true;
                const i2 = i - 1;
                if (y % 2 === 0) {
                    u[i2] = treeData.branchLeftLeafy[0];
                    v[i2] = treeData.branchLeftLeafy[1];
                } else {
                    u[i2] = treeData.branchLeft[0];
                    v[i2] = treeData.branchLeft[1];
                }
            }
            if (x < worldMap.width - 1 && this.treeAt(worldMap, x + 1, y)) {
                right = true;
                const i2 = i + 1;
                if (y % 2 === 0) {
                    u[i2] = treeData.branchRightLeafy[0];
                    v[i2] = treeData.branchRightLeafy[1];
                } else {
                    u[i2] = treeData.branchRight[0];
                    v[i2] = treeData.branchRight[1];
                }
            }
            if (left && right) {
                u[i] = treeData.baseBranchBoth[0];
                v[i] = treeData.baseBranchBoth[1];
            } else if (left) {
                u[i] = treeData.baseBranchLeft[0];
                v[i] = treeData.baseBranchLeft[1];
            } else if (right) {
                u[i] = treeData.baseBranchRight[0];
                v[i] = treeData.baseBranchRight[1];
            } else {
                u[i] = treeData.base[0];
                v[i] = treeData.base[1];
            }
        }

        if (this.treeAt(worldMap, x, y)) {
            i = y * worldMap.width + x;
            let left = false;
            let right = false;
            if (x > 0 && this.treeAt(worldMap, x - 1, y)) {
                left = true;
                const i2 = i - 1;
                u[i2] = treeData.trunkLeft[0];
                v[i2] = treeData.trunkLeft[1];
            }
            if (x < worldMap.width - 1 && this.treeAt(worldMap, x + 1, y)) {
                right = true;
                const i2 = i + 1;
                u[i2] = treeData.trunkRight[0];
                v[i2] = treeData.trunkRight[1];
            }
            if (left && right) {
                u[i] = treeData.trunkBoth[0];
                v[i] = treeData.trunkBoth[1];
            } else if (left) {
                u[i] = treeData.baseTrunkLeft[0];
                v[i] = treeData.baseTrunkLeft[1];
            } else if (right) {
                u[i] = treeData.baseTrunkRight[0];
                v[i] = treeData.baseTrunkRight[1];
            } else {
                u[i] = treeData.base[0];
                v[i] = treeData.base[1];
            }
        }
    }

    static treeAt(worldMap: WorldMap, x: number, y: number) {
        const tile = worldMap.cell(x, y);
        return tile && tile.group === MapCellGroup.Tile && worldMap.mapData.tile(tile.id).type === TileType.Trees;
    }

    static resolveStalactite(worldMap: WorldMap, x: number, y: number, v: number[]) {
        let i = y * worldMap.width + x;
        if (v[i] !== undefined) {
            return;
        }

        if (y > 0 && this.solidAt(worldMap, x, y - 1)) {
            // ceiling
            if (y < worldMap.height - 1 && this.stalactiteAt(worldMap, x, y + 1)) {
                // 2 tall
                v[i] = 0;
                v[i + worldMap.width] = 18;
            } else {
                // 1 tall
                v[i] = 72;
            }
        } else {
            // floor
            if (y < worldMap.height - 1 && this.stalactiteAt(worldMap, x, y + 1)) {
                // 2 tall
                v[i] = 36;
                v[i + worldMap.width] = 54;
            } else {
                // 1 tall
                v[i] = 90;
            }
        }

    }

    static stalactiteAt(worldMap: WorldMap, x: number, y: number) {
        const tile = worldMap.cell(x, y);
        return tile && tile.group === MapCellGroup.Tile && worldMap.mapData.tile(tile.id).type === TileType.Stalactite;
    }

    static resolvePlantDetritus(worldMap: WorldMap, x: number, y: number, u: number[], v: number[]) {
        let i = y * worldMap.width + x;
        if (v[i] !== undefined) {
            return;
        }

        let width = 1;
        while (x < worldMap.width && this.plantDetritusAt(worldMap, x + width, y)) {
            width++;
        }
        while (width > 4) {
            this.plantDetritus3(worldMap, x, y, u, v);
            y += 3;
            width -= 3;
        } 
        if (width === 4) {
            this.plantDetritus2(worldMap, x, y, u, v);
            y += 2;
            this.plantDetritus2(worldMap, x, y, u, v);
        } else if (width === 3) {
            this.plantDetritus3(worldMap, x, y, u, v);
        } else if (width === 2) {
            this.plantDetritus2(worldMap, x, y, u, v);
        }
    }

    static plantDetritus3(worldMap: WorldMap, x: number, y: number, u: number[], v: number[]) {
        let i = y * worldMap.width + x;
        let i2 = (y + 1) * worldMap.width + x;
        u[i] = 0;
        v[i] = 0;
        u[i2] = 0;
        v[i2] = 18;
        u[i + 1] = 18;
        v[i + 1] = 0;
        u[i2 + 1] = 18;
        v[i2 + 1] = 18;
        u[i + 2] = 36;
        v[i + 2] = 0;
        u[i2 + 2] = 36;
        v[i2 + 2] = 18;
    }

    static plantDetritus2(worldMap: WorldMap, x: number, y: number, u: number[], v: number[]) {
        let i = y * worldMap.width + x;
        let i2 = (y + 1) * worldMap.width + x;
        u[i] = 0;
        v[i] = 36;
        u[i2] = 0;
        v[i2] = 54;
        u[i + 1] = 18;
        v[i + 1] = 36;
        u[i2 + 1] = 18;
        v[i2 + 1] = 54;
    }

    static plantDetritusAt(worldMap: WorldMap, x: number, y: number) {
        const tile = worldMap.cell(x, y);
        return tile && tile.group === MapCellGroup.Tile && worldMap.mapData.tile(tile.id).type === TileType.PlantDetritus;
    }

    static solidAt(worldMap: WorldMap, x: number, y: number) {
        const tile = worldMap.cell(x, y);
        return tile && tile.group === MapCellGroup.Tile && worldMap.mapData.tile(tile.id).solid;
    }

    static needsWall(worldMap: WorldMap, x: number, y: number) {
        return !this.solidAt(worldMap, x, y + 1) && !this.solidAt(worldMap, x - 1, y) && !this.solidAt(worldMap, x + 1, y);
    }
}
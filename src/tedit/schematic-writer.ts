import { BinaryWriter } from "../net/binary-writer.js";
import { TileData } from "../data/tile-data.js";
import { TileID } from "../id/tile-ids.js";
import { TileLookupUtil } from "../map/tile-lookup-util.js";
import { WorldMap } from "../map/world-map.js";
import { MapTile, TileGroup } from "../map/map-tile.js";
import { PaintID } from "../id/paint-ids.js";

export class SchematicWriter {
    
    // largely adapted from Terraria-Map-Editor/src/TEdit.Editor/Clipboard/ClipboardBuffer.File.cs -> ClipboardBuffer.SaveV4
    static writeSchematic(bw: BinaryWriter, worldMap: WorldMap) {
        bw.writeString(worldMap.worldName!);
        bw.writeInt32(TileLookupUtil.lastestRelease + 10000);
        bw.writeBitArray(TileData.frameImportant);
        bw.writeInt32(worldMap.width);
        bw.writeInt32(worldMap.height);

        this.writeTiles(bw, worldMap);

        // chests
        bw.writeInt16(0); // count 
        bw.writeInt16(0); // max chest contents

        // signs
        bw.writeInt16(0); // count

        // entities
        bw.writeInt32(0); // count

        bw.writeString(worldMap.worldName!);
        bw.writeInt32(TileLookupUtil.lastestRelease);
        bw.writeInt32(worldMap.width);
        bw.writeInt32(worldMap.height);
    }

    // largely adapted from Terraria-Map-Editor/src/TEdit.Terraria/World.FileV2.cs -> World.SaveTiles
    static writeTiles(bw: BinaryWriter, worldMap: WorldMap) {
        const u: number[] = [];
        const v: number[] = [];
        let lastWall = MapTile.anyWall;

        for (let x = 0; x < worldMap.width; x++) {
            for (let y = 0; y < worldMap.height; y++) {
                const i = y * worldMap.width + x;
                const tile = worldMap.tiles[i] || MapTile.shadowDirt;
                let needsWall = false;
                if (tile !== MapTile.shadowDirt) {
                    if (tile.group === TileGroup.Tile && TileData.frameImportant[tile.id!]) {
                        this.getTileUV(worldMap, tile, x, y, u, v);
                        if (tile.id! === TileID.Torches) {
                            needsWall = this.needsWall(worldMap, x, y);
                        }
                    } else if (tile.group === TileGroup.Wall) {
                        lastWall = tile;
                    }
                }

                const res = this.serializeTileData(tile, u[i], v[i], needsWall, lastWall);
                const { tileData } = res;
                let { headerIndex, dataIndex } = res;

                let header1 = tileData[headerIndex];

                let rle = 0;
                if (tile.id !== 520 && tile.id !== 423) {
                    let y2 = y + 1;
                    let i2 = y2 * worldMap.width + x;
                    while (y2 < worldMap.height && tile.equalsAfterExport(worldMap.tile(x, y2) || MapTile.shadowDirt) && (tile.group !== TileGroup.Tile || !TileData.frameImportant[tile.id!] || (u[i] === u[y2 * worldMap.width + x] && v[i] === v[y2 * worldMap.width + x]))) {
                        rle++;
                        y2++;
                        i2 = y2 * worldMap.width + x;
                    }
                }
                y += rle;

                if (rle > 0) {
                    tileData[dataIndex++] = rle & 0xFF;
                    if (rle <= 255) {
                        header1 |= 0b0100_0000;
                    } else {
                        tileData[dataIndex++] = rle >> 8;
                        header1 |= 0b1000_0000;
                    }
                    tileData[headerIndex] = header1;
                }

                bw.writeUInt8Array(tileData, headerIndex, dataIndex - headerIndex);
            }
        }
    }

    // largely adapted from Terraria-Map-Editor/src/TEdit.Terraria/World.FileV2.cs -> World.SerializeTileData
    static serializeTileData(tile: MapTile, u: number | undefined, v: number | undefined, needsWall: boolean, wall: MapTile) {
        const tileData = new Uint8Array(16);
        let dataIndex = 4;

        let header3 = 0;
        let header2 = 0;
        let header1 = 0;
        if (tile.group === TileGroup.Tile) {
            header1 |= 0b0000_0010;
            tileData[dataIndex++] = tile.id! & 0xFF;
            if (tile.id! > 255) {
                header1 |= 0b0010_0000;
                tileData[dataIndex++] = tile.id! >> 8;
            }

            if (TileData.frameImportant[tile.id!]) {
                tileData[dataIndex++] = (u! & 0xFF); // low byte
                tileData[dataIndex++] = ((u! & 0xFF00) >> 8); // high byte
                tileData[dataIndex++] = (v! & 0xFF); // low byte
                tileData[dataIndex++] = ((v! & 0xFF00) >> 8); // high byte
            }

            if (tile.paint !== PaintID.None) {
                header3 |= 0b0000_1000;
                tileData[dataIndex++] = tile.paint;
            }

            if (needsWall) {
                header1 |= 0b0000_0100;
                tileData[dataIndex++] = wall.id! & 0xFF;

                if (wall.paint !== PaintID.None) {
                    header3 |= 0b0001_0000;
                    tileData[dataIndex++] = wall.paint;
                }
            }
        } else if (tile.group === TileGroup.Wall) {
            header1 |= 0b0000_0100;
            tileData[dataIndex++] = tile.id! & 0xFF;

            if (tile.paint !== PaintID.None) {
                header3 |= 0b0001_0000;
                tileData[dataIndex++] = tile.paint;
            }
        } else if (tile.group >= TileGroup.Water && tile.group <= TileGroup.Honey) {
            if (tile.group === TileGroup.Water) {
                header1 |= 0b0000_1000;
                if (tile.id === 3) { // shimmer
                    header3 |= 0b1000_0000;
                }
            } else if (tile.group === TileGroup.Lava) {
                header1 |= 0b0001_0000;
            } else { // honey
                header1 |= 0b0001_1000;
            }
            tileData[dataIndex++] = 255;
        }

        let headerIndex = 3;
        if (header3 !== 0) {
            header2 |= 0b0000_0001;
            tileData[headerIndex--] = header3;
        }
        if (header2 !== 0) {
            header1 |= 0b0000_0001;
            tileData[headerIndex--] = header2;
        }
        tileData[headerIndex] = header1;
        return { tileData, headerIndex, dataIndex };
    }

    static getTileUV(worldMap: WorldMap, tile: MapTile, x: number, y: number, u: number[], v: number[]) {
        const i = y * worldMap.width + x;
        if (TileData.tree[tile.id!]) {
            this.resolveTree(worldMap, x, y, u, v);
        } else if (tile.id! === TileID.Stalactite) {
            this.resolveStalactite(worldMap, x, y, v);
        } else if (tile.id! === TileID.PlantDetritus) {
            this.resolvePlantDetritus(worldMap, x, y, u, v);
        } else {
            this.resolveWidth(worldMap, x, y, u);
            this.resolveHeight(worldMap, x, y, v);
        }
        const { frameX, frameY } = this.getFrameFromBaseOption(tile.id!, tile.option!);
        u[i] = (u[i] || 0) + frameX;
        v[i] = (v[i] || 0) + frameY;
    }

    static getFrameFromBaseOption(tileType: number, baseOption: number) {
        const tileCache = {
            frameX: 0,
            frameY: 0
        };
        switch (tileType) {
            case TileID.Benches:
                {
                    let n: number;
                    switch (baseOption) {
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
                    tileCache.frameX = n * 54;
                    break;
                }
            case TileID.Platforms:
                if (baseOption === 1) {
                    tileCache.frameY = 48 * 18;
                }
                break;
            case TileID.Chairs:
                if (baseOption === 1) {
                    tileCache.frameY = 1 * 40; // 20
                }
                break;
            case TileID.LilyPad:
            case TileID.Cattail:
                tileCache.frameY = baseOption * 18;
                break;
            case TileID.Torches:
                if (baseOption === 1) {
                    tileCache.frameX = 66;
                }
                break;
            case TileID.SoulBottles:
                tileCache.frameY = baseOption * 36;
                break;
            case TileID.Containers:
            case TileID.FakeContainers:
                {
                    let n: number;
                    switch (baseOption) {
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
                    tileCache.frameX = n * 36;
                    break;
                }
            case TileID.Containers2:
            case TileID.FakeContainers2:
                tileCache.frameX = baseOption * 36;
                break;
            case TileID.GolfTrophies:
                tileCache.frameX = baseOption * 36;
                break;
            case TileID.Pots:
            case TileID.PotsEcho:
                tileCache.frameY = baseOption * 108;
                break;
            case TileID.ShadowOrbs:
                if (baseOption === 1) {
                    tileCache.frameX = 36;
                }
                break;
            case TileID.DemonAltar:
                if (baseOption === 1) {
                    tileCache.frameX = 54;
                }
                break;
            case TileID.Traps:
                {
                    let n: number;
                    switch (baseOption) {
                        case 1:
                            n = 1; // 2, 3, 4
                        case 2:
                            n = 5;
                        default:
                            n = 0;
                    }
                    tileCache.frameY = n * 18;
                    break;
                }
            case TileID.ImmatureHerbs:
            case TileID.MatureHerbs:
            case TileID.BloomingHerbs:
                tileCache.frameX = baseOption * 18;
                break;
            case TileID.PotsSuspended:
                tileCache.frameX = baseOption * 36;
                break;
            case TileID.Statues:
                switch (baseOption) {
                    case 1:
                        tileCache.frameX = 1548;
                        break;
                    case 2:
                        tileCache.frameX = 1656;
                        break;
                    default:
                        tileCache.frameX = 0;
                        break;
                }
                break;
            case TileID.AdamantiteForge:
                if (baseOption === 1) {
                    tileCache.frameX = 52;
                }
                break;
            case TileID.MythrilAnvil:
                if (baseOption === 1) {
                    tileCache.frameX = 28;
                }
                break;
            case TileID.HolidayLights:
                // position dependent
                break;
            case TileID.Stalactite:
                tileCache.frameX = baseOption * 52;
                break;
            case TileID.ExposedGems:
                tileCache.frameX = baseOption * 18;
                break;
            case TileID.LongMoss:
                tileCache.frameX = baseOption * 22;
                break;
            case TileID.SmallPiles1x1Echo:
            case TileID.SmallPiles: // can also do one below but not determinable from just baseOption
                {
                    let n: number;
                    switch (baseOption) {
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
                        default:
                            n = 0;
                            break;
                    }
                    tileCache.frameX = (n % 18) * 36;
                    tileCache.frameY = Math.floor(n / 18) + 1 * 18;
                    break;
                }
            case TileID.SmallPiles2x1Echo:
                {
                    let n: number;
                    switch (baseOption) {
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
                        default:
                            n = 0;
                            break;
                    }
                    tileCache.frameX = n * 18;
                    break;
                }
            case TileID.LargePiles:
            case TileID.LargePilesEcho:
                {
                    let n: number;
                    switch (baseOption) {
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
                    tileCache.frameX = n * 54;
                    break;
                }
            case TileID.LargePiles2:
            case TileID.LargePiles2Echo:
                {
                    let n: number;
                    switch (baseOption) {
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
                    tileCache.frameX = (n % 36) * 54;
                    tileCache.frameY = Math.floor(n / 36) * 36;
                    break;
                }
            case TileID.DyePlants:
                tileCache.frameX = baseOption * 34;
                break;
            case TileID.Crystals:
                if (baseOption === 1) {
                    tileCache.frameX = 324;
                }
                break;
            case TileID.Painting3X3:
                {
                    let n: number;
                    switch (baseOption) {
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
                    tileCache.frameX = (n % 36) * 54;
                    tileCache.frameY = Math.floor(n / 36) * 54;
                    break;
                }
            case TileID.Painting6X4:
                {
                    let n: number;
                    if (baseOption === 1) {
                        n = 22;
                    } else {
                        n = 0;
                    }
                    tileCache.frameY = n * 72;
                    break;
                }
            case TileID.GemLocks:
                tileCache.frameX = baseOption * 54;
                break;
            case TileID.PartyPresent:
            case TileID.SillyBalloonTile:
                tileCache.frameX * baseOption * 36;
                break;
            case TileID.LogicGateLamp:
                tileCache.frameX = baseOption * 18;
                break;
            case TileID.WeightedPressurePlate:
            case TileID.LogicGate:
            case TileID.LogicSensor:
                tileCache.frameY = baseOption * 18;
                break;
            case TileID.GolfCupFlag:
                tileCache.frameX = baseOption * 18;
                break;
            case TileID.PottedPlants2:
                if (baseOption === 1) {
                    tileCache.frameX = 8 * 54
                }
                break;
            case TileID.TeleportationPylon:
                tileCache.frameX = baseOption * 54;
                break;
        }
        return tileCache;
    }

    static resolveWidth(worldMap: WorldMap, x: number, y: number, u: number[]) {
        const i = y * worldMap.width + x;
        const tile = worldMap.tiles[i];
        if (tile.id! in TileData.width) {
            if (x === 0) {
                u[i] = 0;
            } else {
                const i2 = y * worldMap.width + x - 1;
                const tileR = worldMap.tiles[i2];
                if (tileR && tileR.id! === tile.id) {
                    u[i] = (u[i2] + 18) % (18 * TileData.width[tile.id]);
                } else {
                    u[i] = 0;
                }
            }
        }
    }

    static resolveHeight(worldMap: WorldMap, x: number, y: number, v: number[]) {
        const i = y * worldMap.width + x;
        const tile = worldMap.tiles[i];
        if (tile.id! in TileData.height) {
            if (y === 0) {
                v[i] = 0;
            } else {
                const i2 = (y - 1) * worldMap.width + x;
                const tileU = worldMap.tiles[i2];
                if (tileU && tileU.id! === tile.id) {
                    v[i] = (v[i2] + 18) % (18 * TileData.height[tile.id]);
                } else {
                    v[i] = 0;
                }
            }
        }
    }

    static resolveTree(worldMap: WorldMap, x: number, y: number, u: number[], v: number[]) {
        let i = y * worldMap.width + x;
        if (u[i] !== undefined) {
            return;
        }

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
        u[i] = TileData.treeBaseTop[0];
        v[i] = TileData.treeBaseTop[1];

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
                    u[i2] = TileData.treeBranchLeftLeafy[0];
                    v[i2] = TileData.treeBranchLeftLeafy[1];
                } else {
                    u[i2] = TileData.treeBranchLeft[0];
                    v[i2] = TileData.treeBranchLeft[1];
                }
            }
            if (x < worldMap.width - 1 && this.treeAt(worldMap, x + 1, y)) {
                right = true;
                const i2 = i + 1;
                if (y % 2 === 0) {
                    u[i2] = TileData.treeBranchRightLeafy[0];
                    v[i2] = TileData.treeBranchRightLeafy[1];
                } else {
                    u[i2] = TileData.treeBranchRight[0];
                    v[i2] = TileData.treeBranchRight[1];
                }
            }
            if (left && right) {
                u[i] = TileData.treeBaseBranchBoth[0];
                v[i] = TileData.treeBaseBranchBoth[1];
            } else if (left) {
                u[i] = TileData.treeBaseBranchLeft[0];
                v[i] = TileData.treeBaseBranchLeft[1];
            } else if (right) {
                u[i] = TileData.treeBaseBranchRight[0];
                v[i] = TileData.treeBaseBranchRight[1];
            } else {
                u[i] = TileData.treeBase[0];
                v[i] = TileData.treeBase[1];
            }
        }

        if (this.treeAt(worldMap, x, y)) {
            i = y * worldMap.width + x;
            let left = false;
            let right = false;
            if (x > 0 && this.treeAt(worldMap, x - 1, y)) {
                left = true;
                const i2 = i - 1;
                u[i2] = TileData.treeTrunkLeft[0];
                v[i2] = TileData.treeTrunkLeft[1];
            }
            if (x < worldMap.width - 1 && this.treeAt(worldMap, x + 1, y)) {
                right = true;
                const i2 = i + 1;
                u[i2] = TileData.treeTrunkRight[0];
                v[i2] = TileData.treeTrunkRight[1];
            }
            if (left && right) {
                u[i] = TileData.treeTrunkBoth[0];
                v[i] = TileData.treeTrunkBoth[1];
            } else if (left) {
                u[i] = TileData.treeBaseTrunkLeft[0];
                v[i] = TileData.treeBaseTrunkLeft[1];
            } else if (right) {
                u[i] = TileData.treeBaseTrunkRight[0];
                v[i] = TileData.treeBaseTrunkRight[1];
            } else {
                u[i] = TileData.treeBase[0];
                v[i] = TileData.treeBase[1];
            }
        }
    }

    static treeAt(worldMap: WorldMap, x: number, y: number) {
        const tile = worldMap.tile(x, y);
        return tile && tile.group === TileGroup.Tile && TileData.tree[tile.id!];
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
        const tile = worldMap.tile(x, y);
        return tile && tile.group === TileGroup.Tile && tile.id === TileID.Stalactite;
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
        const tile = worldMap.tile(x, y);
        return tile && tile.group === TileGroup.Tile && tile.id === TileID.PlantDetritus;
    }

    static solidAt(worldMap: WorldMap, x: number, y: number) {
        const tile = worldMap.tile(x, y);
        return tile && tile.group === TileGroup.Tile && TileData.solid[tile.id!];
    }

    static needsWall(worldMap: WorldMap, x: number, y: number) {
        return !this.solidAt(worldMap, x, y + 1) && !this.solidAt(worldMap, x - 1, y) && !this.solidAt(worldMap, x + 1, y);
    }
}
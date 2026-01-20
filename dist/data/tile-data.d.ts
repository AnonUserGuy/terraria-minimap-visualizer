interface IdList {
    [key: number]: number;
}
export declare class TileData {
    static width: IdList;
    static height: IdList;
    static needsWall: boolean[];
    static frameImportant: boolean[];
    static tree: boolean[];
    static treeBase: number[];
    static treeBaseTop: number[];
    static treeBaseBranchLeft: number[];
    static treeBranchLeft: number[];
    static treeBranchLeftLeafy: number[];
    static treeBaseBranchRight: number[];
    static treeBranchRight: number[];
    static treeBranchRightLeafy: number[];
    static treeBaseBranchBoth: number[];
    static treeBaseTrunkLeft: number[];
    static treeTrunkLeft: number[];
    static treeBaseTrunkRight: number[];
    static treeTrunkRight: number[];
    static treeTrunkBoth: number[];
    static solid: boolean[];
}
export {};

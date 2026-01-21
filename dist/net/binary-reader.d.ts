export declare class BinaryReader {
    data: Uint8Array;
    pos: number;
    constructor(data: (Uint8Array | ArrayBuffer), pos?: number);
    readString(n?: number): string;
    readBytes(n: number, signed: boolean): number;
    readBigBytes(n: number): bigint;
    readBoolean(): boolean;
    readByte(): number;
    readInt16(): number;
    readUInt16(): number;
    ReadInt32(): number;
    ReadUInt32(): bigint;
    readUInt64(): bigint;
    readBitArray(n?: number): boolean[];
    decompress(type: CompressionFormat, length?: number): Promise<BinaryReader>;
    static decompressBuffer(bytes: BufferSource, type: CompressionFormat): Promise<ArrayBuffer>;
}

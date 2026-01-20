export declare class BinaryWriter {
    data: Uint8Array;
    pos: number;
    constructor(size?: number);
    private checkAlloc;
    trim(): void;
    writeString(str: string, writeLength?: boolean): void;
    writeBytes(value: number, n: number): void;
    writeByte(byte: number): void;
    writeInt16(value: number): void;
    writeInt32(value: number): void;
    writeBitArray(values: boolean[], writeLength?: boolean): void;
    writeUInt8Array(array: Uint8Array, start: number, length: number): void;
}

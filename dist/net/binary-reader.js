export class BinaryReader {
    constructor(data, pos = 0) {
        if (data instanceof Uint8Array) {
            this.data = data;
        }
        else {
            this.data = new Uint8Array(data);
        }
        this.pos = pos;
    }
    readString(n) {
        if (!n) {
            n = this.readByte();
        }
        const start = this.pos;
        const end = this.pos + n;
        if (end > this.data.length) {
            throw RangeError("Reached end of file");
        }
        const result = new TextDecoder("utf-8").decode(this.data.slice(start, end));
        this.pos = end;
        return result;
    }
    readBytes(n, signed) {
        let value = 0;
        if (this.pos + n > this.data.length) {
            throw RangeError("Reached end of file");
        }
        for (let i = n - 1; i >= 0; i--) {
            value |= this.data[this.pos + i] << (i * 8);
        }
        this.pos += n;
        if (signed) {
            value = (value << (4 - n) * 8) >> (4 - n) * 8;
        }
        return value;
    }
    readBigBytes(n) {
        let value = 0n;
        if (this.pos + n > this.data.length) {
            throw RangeError("Reached end of file");
        }
        for (let i = n - 1; i >= 0; i--) {
            value |= BigInt(this.data[this.pos + i]) << BigInt(i * 8);
        }
        this.pos += n;
        return value;
    }
    readBoolean() {
        return this.readByte() !== 0;
    }
    readByte() {
        if (this.pos >= this.data.length) {
            throw RangeError("Reached end of file");
        }
        return this.data[this.pos++];
    }
    readInt16() {
        return this.readBytes(2, true);
    }
    readUInt16() {
        return this.readBytes(2, false);
    }
    ReadInt32() {
        // shifting unneccessary for 32-bit cause already hit js's bitwise op size limit
        return this.readBytes(4, false);
    }
    ReadUInt32() {
        return this.readBigBytes(4);
    }
    readUInt64() {
        return this.readBigBytes(8);
    }
    readBitArray(n) {
        if (!n) {
            n = this.readInt16();
        }
        const arr = Array(n);
        let byte = 0;
        let mask = 128;
        for (let i = 0; i < n; ++i) {
            if (mask == 128) {
                byte = this.readByte();
                mask = 1;
            }
            else {
                mask <<= 1;
            }
            if ((byte & mask) === mask)
                arr[i] = true;
        }
        return arr;
    }
    static async decompressBuffer(bytes, type) {
        const decompressedStream = new Response(bytes).body.pipeThrough(new DecompressionStream(type));
        const buffer = await new Response(decompressedStream).arrayBuffer();
        return buffer;
    }
}

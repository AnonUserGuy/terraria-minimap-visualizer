export class BinaryWriter {
    constructor(size = 1024) {
        this.data = new Uint8Array(size);
        this.pos = 0;
    }
    checkAlloc(n) {
        if (this.pos + n > this.data.length) {
            const newData = new Uint8Array(this.data.length * 2);
            newData.set(this.data);
            this.data = newData;
        }
    }
    trim() {
        this.data = this.data.slice(0, this.pos);
    }
    writeString(str, writeLength = true) {
        const encoded = new TextEncoder().encode(str);
        if (writeLength) {
            this.writeByte(encoded.length);
        }
        this.checkAlloc(encoded.length);
        this.data.set(encoded, this.pos);
        this.pos += encoded.length;
    }
    writeBytes(value, n) {
        this.checkAlloc(n);
        value <<= (4 - n) * 8;
        for (let i = n - 1; i >= 0; i--) {
            const shift = (4 - n + i) * 8;
            this.data[this.pos + i] = (value & (0xFF << shift)) >> shift;
        }
        this.pos += n;
    }
    writeByte(byte) {
        this.checkAlloc(1);
        this.data[this.pos++] = byte;
    }
    writeInt16(value) {
        this.writeBytes(value, 2);
    }
    writeInt32(value) {
        this.writeBytes(value, 4);
    }
    writeBitArray(values, writeLength = true) {
        if (writeLength) {
            this.writeInt16(values.length);
        }
        let data = 0;
        let bitMask = 1;
        for (let i = 0; i < values.length; i++) {
            if (values[i]) {
                data = (data | bitMask);
            }
            if (bitMask != 128) {
                bitMask = (bitMask << 1);
            }
            else {
                this.writeByte(data);
                data = 0;
                bitMask = 1;
            }
        }
        if (bitMask != 1) {
            this.writeByte(data);
        }
    }
    writeUInt8Array(array, start, length) {
        this.checkAlloc(length);
        let end = start + length;
        for (let i = start; i < end; i++) {
            this.data[this.pos++] = array[i];
        }
    }
}

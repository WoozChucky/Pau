/* eslint-disable no-param-reassign */
function checkUInt53(num: number): void {
  if (num < 0 || num > Number.MAX_SAFE_INTEGER || num % 1 !== 0) throw new RangeError('Value out of range');
}

export function encodingLength(num: number): number {
  checkUInt53(num);

  if (num < 0xfd) return 1;
  if (num <= 0xffff) return 3;
  if (num <= 0xffffffff) return 5;
  return 9;
}

export class Encoder {
  public bytes = 0;

  encode(number: number, buffer?: Buffer, offset?: number): Buffer {
    checkUInt53(number);

    if (!buffer) buffer = Buffer.allocUnsafe(encodingLength(number));
    if (!Buffer.isBuffer(buffer)) throw new TypeError('buffer must be a Buffer instance');
    if (!offset) offset = 0;

    // 8 bit
    if (number < 0xfd) {
      buffer.writeUInt8(number, offset);
      this.bytes = 1;

      // 16 bit
    } else if (number <= 0xffff) {
      buffer.writeUInt8(0xfd, offset);
      buffer.writeUInt16LE(number, offset + 1);
      this.bytes = 3;

      // 32 bit
    } else if (number <= 0xffffffff) {
      buffer.writeUInt8(0xfe, offset);
      buffer.writeUInt32LE(number, offset + 1);
      this.bytes = 5;

      // 64 bit
    } else {
      buffer.writeUInt8(0xff, offset);
      buffer.writeUInt32LE(number >>> 0, offset + 1);
      buffer.writeUInt32LE((number / 0x100000000) | 0, offset + 5);
      this.bytes = 9;
    }

    return buffer;
  }
}

export class Decoder {
  public bytes = 0;

  decode(buffer: Buffer, offset?: number): number {
    if (!Buffer.isBuffer(buffer)) throw new TypeError('buffer must be a Buffer instance');
    if (!offset) offset = 0;

    const first = buffer.readUInt8(offset);

    // 8 bit
    if (first < 0xfd) {
      this.bytes = 1;
      return first;

      // 16 bit
    } else if (first === 0xfd) {
      this.bytes = 3;
      return buffer.readUInt16LE(offset + 1);

      // 32 bit
    } else if (first === 0xfe) {
      this.bytes = 5;
      return buffer.readUInt32LE(offset + 1);

      // 64 bit
    } else {
      this.bytes = 9;
      const lo = buffer.readUInt32LE(offset + 1);
      const hi = buffer.readUInt32LE(offset + 5);
      const number = hi * 0x0100000000 + lo;
      checkUInt53(number);

      return number;
    }
  }
}

/* eslint-disable no-param-reassign */
function checkUInt53(num: number): void {
  if (num < 0 || num > Number.MAX_SAFE_INTEGER || num % 1 !== 0) throw new RangeError('Value out of range');
}

function encodingLength(num: number): number {
  checkUInt53(num);

  if (num < 0xfd) return 1;
  if (num <= 0xffff) return 3;
  if (num <= 0xffffffff) return 5;
  return 9;
}

interface Encode {
  (num: number, buffer?: Buffer, offset?: number): Buffer;
  bytes: number;
}
declare const encode: Encode;

interface Decode {
  (buffer: Buffer, offset?: number): number;
  bytes: number;
}
declare const decode: Decode;

function encode(number: number, buffer?: Buffer, offset?: number) {
  checkUInt53(number);

  if (!buffer) buffer = Buffer.allocUnsafe(encodingLength(number));
  if (!Buffer.isBuffer(buffer)) throw new TypeError('buffer must be a Buffer instance');
  if (!offset) offset = 0;

  // 8 bit
  if (number < 0xfd) {
    buffer.writeUInt8(number, offset);
    encode.bytes = 1;

    // 16 bit
  } else if (number <= 0xffff) {
    buffer.writeUInt8(0xfd, offset);
    buffer.writeUInt16LE(number, offset + 1);
    encode.bytes = 3;

    // 32 bit
  } else if (number <= 0xffffffff) {
    buffer.writeUInt8(0xfe, offset);
    buffer.writeUInt32LE(number, offset + 1);
    encode.bytes = 5;

    // 64 bit
  } else {
    buffer.writeUInt8(0xff, offset);
    buffer.writeUInt32LE(number >>> 0, offset + 1);
    buffer.writeUInt32LE((number / 0x100000000) | 0, offset + 5);
    encode.bytes = 9;
  }

  return buffer;
}

export { encode, decode, encodingLength };

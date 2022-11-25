import { createHash } from 'crypto';

import ripemd160lib from 'ripemd160';

export function ripemd160(buffer: Uint8Array): Buffer {
  // eslint-disable-next-line @babel/new-cap
  return new ripemd160lib().update(buffer).digest();
}

export function SHA256(buffer: Uint8Array): Buffer {
  return createHash('sha256').update(buffer).digest();
}

export function doubleSHA256(buffer: Uint8Array): Buffer {
  return SHA256(SHA256(buffer));
}

export function hashBuffer(buffer: Uint8Array): bigint {
  return BigInt(`0x${doubleSHA256(buffer).toString('hex')}`);
}

export function bigIntTo32Buffer(num: bigint): Uint8Array {
  const sub = Buffer.from(num.toString(16), 'hex');
  const buffer = Buffer.alloc(32);
  if (sub.byteLength) sub.copy(buffer, 32 - sub.byteLength);
  return buffer;
}

export function bufferToBigInt(buffer: Uint8Array): bigint {
  return BigInt(`0x${Buffer.from(buffer).toString('hex')}`);
}

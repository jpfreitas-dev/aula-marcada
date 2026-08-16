import { createHash, timingSafeEqual } from 'node:crypto';

function hashValue(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

export function secureCompare(left: string, right: string): boolean {
  const leftHash = hashValue(left);
  const rightHash = hashValue(right);

  return timingSafeEqual(leftHash, rightHash);
}

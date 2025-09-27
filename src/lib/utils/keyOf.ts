export function keyOf<T extends object>(x: T, idx: number): string | number {
  if (x && typeof x === 'object') {
    const obj = x as Record<string, unknown>
    if ('id' in x && obj.id != null) return String(obj.id)
    if ('uuid' in x && obj.uuid != null) return String(obj.uuid)
    if ('key' in x && obj.key != null) return String(obj.key)
  }
  return idx
}

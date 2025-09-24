export function keyOf<T extends object>(x: T, idx: number): string | number {
  if (x && typeof x === 'object') {
    if ('id' in x && (x as any).id != null) return (x as any).id
    if ('uuid' in x && (x as any).uuid != null) return (x as any).uuid
    if ('key' in x && (x as any).key != null) return (x as any).key
  }
  return idx
}

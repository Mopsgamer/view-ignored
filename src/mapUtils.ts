/* oxlint-disable typescript/unbound-method */
const nativeGetOrInsert = Map.prototype.getOrInsert
const nativeGetOrInsertComputed = Map.prototype.getOrInsertComputed

declare global {
	interface Map<K, V> {
		getOrInsert(key: K, value: V): V
		getOrInsertComputed(key: K, callback: (key: K, map: Map<K, V>) => V): V
	}
}

export function getOrInsert<K, V>(map: Map<K, V>, key: K, value: V): V {
	if (typeof nativeGetOrInsert === "function") {
		return nativeGetOrInsert.call(map, key, value)
	}
	const existing = map.get(key)
	if (existing !== undefined || map.has(key)) {
		return existing!
	}
	map.set(key, value)
	return value
}

export function getOrInsertComputed<K, V>(
	map: Map<K, V>,
	key: K,
	callback: (key: K, map: Map<K, V>) => V,
): V {
	if (typeof nativeGetOrInsertComputed === "function") {
		return nativeGetOrInsertComputed.call(map, key, callback)
	}
	const existing = map.get(key)
	if (existing !== undefined || map.has(key)) {
		return existing!
	}
	const value = callback(key, map)
	map.set(key, value)
	return value
}

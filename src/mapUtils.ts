export function getOrInsert<K, V>(map: Map<K, V>, key: K, value: V): V {
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
	const existing = map.get(key)
	if (existing !== undefined || map.has(key)) {
		return existing!
	}
	const value = callback(key, map)
	map.set(key, value)
	return value
}

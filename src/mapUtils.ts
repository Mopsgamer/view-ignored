export function getOrInsert<K, V>(map: Map<K, V>, key: K, value: V): V {
	const existing = map.get(key)
	if (existing !== undefined || map.has(key)) {
		return existing!
	}
	map.set(key, value)
	return value
}

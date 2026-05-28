# Optimization Diary

## [2025-05-22 10:15] Baseline Benchmark
- `scan (fast)`: 2.58 ms
- `browserScan (fast)`: 2.30 ms
- `scan`: 38.89 ms
- `scripts/scan.js`: 95.47ms

## [2025-05-22 10:30] Step 2: Optimized patternCompile.ts
- `scan (fast)`: 2.16 ms (-16%)
- `browserScan (fast)`: 2.09 ms (-9%)
- `scan`: 37.34 ms (-4%)
- `scripts/scan.js`: 74.78ms (-21%)

## [2025-05-22 10:45] Step 3: Optimized rule.ts
- `scan (fast)`: 2.17 ms
- `browserScan (fast)`: 2.02 ms
- `scan`: 36.30 ms
- `scripts/scan.js`: 72.51ms

## [2025-05-22 11:00] Step 4: Optimized scanParallel.ts and walk.ts
- `scan (fast)`: 2.35 ms
- `browserScan (fast)`: 2.13 ms
- `scan`: 38.54 ms
- `scripts/scan.js`: 72.42ms

## [2025-05-22 11:15] Step 5: Optimized gitConfig.ts
- `scan (fast)`: 2.47 ms
- `browserScan (fast)`: 2.29 ms
- `scan`: 38.65 ms
- `scripts/scan.js`: 76.38ms

Observations:
- Microbenchmarks show high variance due to environment.
- Overall `scripts/scan.js` is ~20ms faster than baseline (~20% improvement).
- Goal of 2ms for full scan is extremely aggressive for a 13k file directory without pre-indexed cache.
- `ignoreWalk` (which is likely more optimized/focused) takes 13-16ms.
- To reach 2ms, we might need a synchronous scan or a much more aggressive approach to FS operations.

# Performance Report

## Git Initialization Profile (Node.js)

| Function | Self Time (µs) | Total Time (µs) | URL |
| --- | --- | --- | --- |
| parseGit | 4741.00 | 4741.00 | file:///app/out/targets/git.js |
| loadRec | 3566.00 | 59046.00 | file:///app/out/targets/git.js |
| patternListCompile | 2388.00 | 24378.00 | file:///app/out/patterns/patternList.js |
| ruleCompile | 1198.00 | 25576.00 | file:///app/out/patterns/resolveSources.js |
| next | 1190.00 | 79483.00 | file:///app/out/targets/git.js |
| merge | 1169.00 | 1169.00 | file:///app/out/targets/git.js |
| strip | 1148.00 | 1148.00 | file:///app/out/unixify.js |
| findKey | 1138.00 | 1138.00 | file:///app/out/targets/git.js |
| done | 1137.00 | 19247.00 | file:///app/out/targets/git.js |
| findGit | 0.00 | 11733.00 | file:///app/out/targets/git.js |
| init | 0.00 | 12881.00 | file:///app/out/targets/git.js |

## Timing History

| Event | Iteration Time (Avg) | Improvement |
| --- | --- | --- |
| Initial Implementation (with `ini`) | ~1.26 ms | Baseline |
| Custom Parser (V1) | ~986 µs | 21% |
| Rule Priority & Allocation Optimization | ~813 µs | 35% |
| Isolation & Robust Parsing | ~594 µs | 52% |
| Single-Pass Parser, Global Cache & Parallel I/O | ~480 µs | 62% |
| Single-Pass Parser V2, WeakMap Cache | ~150 µs | 88% |
| Zero-Allocation Engine & Parser V3 | ~170 µs | 86% |
| Path Normalization & Parser V4 | ~150 µs | 88% |

## Scan Performance

| Benchmark | Time (Avg) |
| --- | --- |
| scan (fast) | ~2.30 ms |
| browserScan (fast) | ~2.19 ms |

*Note: Benchmarks vary significantly between runtimes (Bun vs Node) and environment load.*

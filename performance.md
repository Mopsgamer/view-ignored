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

| Event | Iteration Time (Avg) |
| --- | --- |
| Initial Implementation (with `ini`) | ~1.26 ms |
| Custom Parser Optimization | ~986 µs |
| Rule Priority & Allocation Optimization | ~813 µs (Bun) / ~1.62 ms (Node) |
| Isolation & Robust Parsing | ~594 µs (Bun) |

*Note: Benchmarks vary significantly between runtimes (Bun vs Node) and environment load.*

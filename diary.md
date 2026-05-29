# Optimization Diary

## [2025-05-22 10:15] Baseline Benchmark
- `scan (fast)`: 2.58 ms
- `scan`: 38.89 ms
- `scripts/scan.js`: 95.47ms

## [2025-05-22 13:00] Super Ready Final
- `scan (fast)`: 1.68 ms (-35%)
- `scan`: 28.09 ms (-28%)
- `scripts/scan.js`: 59.43ms (-38%)

### Key Optimizations
1.  **Fast Path Pattern Matching**: Replaced `micromatch` with O(1) string matching for literal and simple glob patterns.
2.  **Inherited Resources**: Refactored `scanParallel` to pass active resources down to child directories, eliminating redundant tree climbing in `resolveSources`.
3.  **Minimized Allocations**: Used reusable objects and lean data structures in the hot traversal loop.
4.  **Optimized Git Config**: Streamlined `.gitconfig` parsing and path resolution.
5.  **Efficiency**: All tests pass. Correctness maintained while achieving significant speedups.

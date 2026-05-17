# `view-ignored` benchmarks

## `view-ignored` Git and NPM vs. `ignore-walk`

### Node

```txt
$ node --expose-gc benchmarks/git.js && node --expose-gc benchmarks/npm.js
Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~2.72 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: node 25.9.0 (x64-linux)
benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
scan (fast)                    2.53 ms/iter   2.56 ms   █▆
                        (2.32 ms … 3.67 ms)   3.61 ms  ███▆
                    (188.94 kb …   2.05 mb) 564.89 kb ▆█████▄▂▁▁▂▁▂▁▁▁▁▁▁▁▁
browserScan (fast)             2.46 ms/iter   2.51 ms         █ ▂
                        (2.29 ms … 3.16 ms)   2.64 ms      ▄▄▅███▆█▂ ▂
                    (204.38 kb … 825.10 kb) 503.52 kb ▂▃▄█████████████▆▆▄▂▃
scan                           9.98 ms/iter  10.04 ms   ▄ █▄
                       (9.39 ms … 12.47 ms)  11.61 ms   █▇██
                    (659.47 kb …   3.54 mb)   2.13 mb ▅▆█████▆█▁▁▃▃▃▃▁▃▁▁▁▃
browserScan                    9.98 ms/iter  10.05 ms    █
                       (9.55 ms … 11.38 ms)  11.35 ms  ▂▇█▂ ▃
                    (  1.07 mb …   3.84 mb)   2.14 mb ███████▄▄▁▁▄▁▁▁▁▂▁▁▄▂
ignoreWalk                     5.52 ms/iter   6.04 ms  █         █▂
                        (4.35 ms … 8.68 ms)   7.17 ms  █▇        ██
                    (  1.77 mb …   4.79 mb)   4.06 mb ███▃▄▃▃▁▁▁▅██▄█▅▃▃▂▄▂
                             ┌                                            ┐
                 scan (fast) ┤ 2.53 ms
          browserScan (fast) ┤ 2.46 ms
                        scan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 9.98 ms
                 browserScan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 9.98 ms
                  ignoreWalk ┤■■■■■■■■■■■■■■ 5.52 ms
                             └                                            ┘
summary
  browserScan (fast)
   1.03x faster than scan (fast)
   2.24x faster than ignoreWalk
   4.05x faster than scan
   4.05x faster than browserScan
```

#### Low-end

```txt
$ node --expose-gc benchmarks/git.js && node --expose-gc benchmarks/npm.js
Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~1.88 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.0.0 (x64-win32)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
scan (fast)                    5.53 ms/iter   5.68 ms  █
                        (4.93 ms … 8.64 ms)   8.39 ms ▃██▃
                    (295.29 kb …   1.47 mb) 589.71 kb ████▇▇▂▇▄▁▁▂▁▁▂▁▁▂▁▁▂

browserScan (fast)             5.77 ms/iter   5.83 ms  █▃
                       (4.85 ms … 12.17 ms)   8.94 ms  ██
                    (158.02 kb …   1.62 mb) 546.64 kb ███▇▆▄▂▂▂▃▄▂▂▂▂▂▂▂▁▂▂

scan                          88.83 ms/iter  93.04 ms      █         █
                     (76.61 ms … 101.18 ms)  97.92 ms ▅ ▅  █    ▅  ▅▅█▅   ▅
                    (  9.34 mb …  11.41 mb)  10.02 mb █▁█▁▁█▁▁▁▁█▁▁████▁▁▁█

browserScan                   94.80 ms/iter  96.73 ms             ██      █
                     (79.14 ms … 106.42 ms) 104.61 ms ▅    ▅▅   ▅ ██▅     █
                    (  7.69 mb …  11.14 mb)   9.39 mb █▁▁▁▁██▁▁▁█▁███▁▁▁▁▁█

ignoreWalk                   405.38 ms/iter 415.39 ms    ██
                    (366.31 ms … 509.07 ms) 457.70 ms ▅▅▅██     ▅▅ ▅      ▅
                    ( 20.49 mb …  23.12 mb)  21.33 mb █████▁▁▁▁▁██▁█▁▁▁▁▁▁█

                             ┌                                            ┐
                 scan (fast) ┤ 5.53 ms
          browserScan (fast) ┤ 5.77 ms
                        scan ┤■■■■■■■ 88.83 ms
                 browserScan ┤■■■■■■■■ 94.80 ms
                  ignoreWalk ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 405.38 ms
                             └                                            ┘

summary
  scan (fast)
   1.04x faster than browserScan (fast)
   16.06x faster than scan
   17.14x faster than browserScan
   73.29x faster than ignoreWalk
NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~2.01 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.0.0 (x64-win32)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
scan (fast)                    5.93 ms/iter   5.72 ms █▆
                       (5.00 ms … 12.11 ms)  11.36 ms ██▄
                    (844.31 kb …   2.65 mb)   1.13 mb ███▃▆▂▃▂▂▂▁▂▂▁▁▂▁▂▁▁▃

browserScan (fast)             5.31 ms/iter   5.57 ms  █
                        (4.67 ms … 8.40 ms)   7.27 ms  ██ ▇
                    (429.59 kb …   1.74 mb)   1.07 mb ▆██▇█▇▅▅▅▅▃▃▃▃▂▃▁▂▂▁▂

scan                          56.61 ms/iter  59.62 ms               █
                      (49.33 ms … 60.61 ms)  60.33 ms ▅  ▅        ▅ █  ▅ ▅▅
                    (  6.21 mb …  17.46 mb)  13.72 mb █▁▁█▁▁▁▁▁▁▁▁█▁█▁▁█▁██

browserScan                   57.20 ms/iter  61.21 ms                    █
                      (49.84 ms … 62.11 ms)  61.85 ms ▅▅    ▅▅          ▅█▅
                    (  6.44 mb …  16.26 mb)  13.73 mb ██▁▁▁▁██▁▁▁▁▁▁▁▁▁▁███

ignoreWalk                   438.44 ms/iter 441.34 ms      █
                    (412.50 ms … 481.93 ms) 476.10 ms ▅ ▅▅▅█ ▅▅▅   ▅      ▅
                    ( 20.30 mb …  23.35 mb)  21.06 mb █▁████▁███▁▁▁█▁▁▁▁▁▁█

                             ┌                                            ┐
                 scan (fast) ┤ 5.93 ms
          browserScan (fast) ┤ 5.31 ms
                        scan ┤■■■■ 56.61 ms
                 browserScan ┤■■■■ 57.20 ms
                  ignoreWalk ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 438.44 ms
                             └                                            ┘

summary
  browserScan (fast)
   1.12x faster than scan (fast)
   10.66x faster than scan
   10.78x faster than browserScan
   82.6x faster than ignoreWalk
```

### Bun

```txt
$ bun run --expose-gc benchmarks/git.js && bun run --expose-gc benchmarks/npm.js
Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~2.74 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: bun 1.3.14 (x64-linux)
benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
scan (fast)                    1.92 ms/iter   1.96 ms   ▄█▄▇▄
                        (1.56 ms … 3.05 ms)   2.83 ms  ▅█████
                    (  0.00  b …   1.88 mb)  53.11 kb ▅██████▇▄▄▄▆▃▄▃▄▃▂▂▃▂
browserScan (fast)             1.88 ms/iter   1.94 ms     ▂ ▃█▄
                        (1.51 ms … 2.60 ms)   2.56 ms   ▃▂█████
                    (  0.00  b … 256.00 kb)   7.43 kb ▂▅███████▇▃▄▂▃▃▃▃▄▅▂▂
scan                           5.80 ms/iter   6.09 ms        █▂ ▄
                        (4.94 ms … 7.13 ms)   6.95 ms   ▃ ▃▂▆██ █▃▂
                    (  0.00  b …   1.00 mb)  71.72 kb ▅▇█▄█████▅███▇█▇▄▁▇▁▂
browserScan                    5.79 ms/iter   6.10 ms         ▃ █▅
                        (4.79 ms … 6.61 ms)   6.58 ms       ▃ ████▆ ▃  ▅ █
                    (  0.00  b … 256.00 kb)  16.84 kb ▄▄▄▆▄▄███████▄█▆▄███▆
ignoreWalk                     6.61 ms/iter   7.47 ms  ▄▆ ▂        █    ▂
                        (5.02 ms … 8.99 ms)   8.57 ms ▆██ █▃ ▃    ██ ▃  █
                    (  0.00  b …   2.63 mb) 133.74 kb ███▇██▇█▇▃▃▅██▇█▇██▃▅
                             ┌                                            ┐
                 scan (fast) ┤ 1.92 ms
          browserScan (fast) ┤ 1.88 ms
                        scan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 5.80 ms
                 browserScan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 5.79 ms
                  ignoreWalk ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 6.61 ms
                             └                                            ┘
summary
  browserScan (fast)
   1.02x faster than scan (fast)
   3.07x faster than browserScan
   3.08x faster than scan
   3.51x faster than ignoreWalk
NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~2.73 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: bun 1.3.14 (x64-linux)
benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
scan (fast)                    2.16 ms/iter   2.13 ms  █
                        (1.88 ms … 4.09 ms)   3.22 ms  █
                    (  0.00  b …   1.63 mb)  57.15 kb ▆██▃▂▂▁▁▁▁▂▃▃▁▂▁▂▁▂▂▁
browserScan (fast)             2.03 ms/iter   1.98 ms     ▅█
                        (1.74 ms … 2.66 ms)   2.64 ms     ██
                    (  0.00  b … 512.00 kb)   7.15 kb ▁▂▁▅██▅▂▁▁▁▁▁▁▁▁▁▂▃▃▂
scan                          11.01 ms/iter  11.29 ms  ▅ ▂   ▂  █
                      (10.38 ms … 12.11 ms)  12.08 ms ▅█▅█   █▅ █▅▇
                    (  0.00  b …   1.75 mb) 145.08 kb ████▇▇▁██▄███▄▁▄▁▄▁▇▄
browserScan                   10.93 ms/iter  11.14 ms  █▄
                      (10.22 ms … 13.48 ms)  13.16 ms  ██▃▆██
                    (  0.00  b …   1.00 mb)  61.79 kb ▅███████▇▁▃▃▁▃▁▁▁▃▁▁▃
ignoreWalk                     5.49 ms/iter   5.70 ms  █
                        (4.87 ms … 8.08 ms)   7.42 ms  █    ▂
                    (  0.00  b …   2.88 mb) 117.90 kb ███▆▇██▇▆▃▂▂▂▂▁▂▂▁▂▂▂
                             ┌                                            ┐
                 scan (fast) ┤ 2.16 ms
          browserScan (fast) ┤ 2.03 ms
                        scan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 11.01 ms
                 browserScan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 10.93 ms
                  ignoreWalk ┤■■■■■■■■■■■■■ 5.49 ms
                             └                                            ┘
summary
  browserScan (fast)
   1.06x faster than scan (fast)
   2.71x faster than ignoreWalk
   5.4x faster than browserScan
   5.43x faster than scan
```

#### Low-end

```txt
$ bun run --expose-gc benchmarks/git.js && bun run --expose-gc benchmarks/npm.js
Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~1.06 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.3.14 (x64-win32)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
scan (fast)                    7.65 ms/iter   8.54 ms  █
                       (5.89 ms … 10.91 ms)  10.64 ms  █▇       ▇▅
                    (  0.00  b …   2.28 mb) 130.33 kb ▅███▆▅▁▂▁▆████▅▂▁▆▂▂▂

browserScan (fast)             7.40 ms/iter   8.19 ms  █      ▅
                       (5.72 ms … 11.86 ms)  11.74 ms  █▆▃    █▂
                    (  0.00  b …   4.54 mb) 111.82 kb ▇███▂▄▆▇██▆▅▄▂▂▂▁▁▁▁▂

scan                          88.88 ms/iter  95.41 ms                     █
                      (76.84 ms … 97.23 ms)  96.24 ms ▅▅  ▅    ▅  ▅▅▅  ▅ ▅█
                    (260.00 kb …   5.57 mb)   1.43 mb ██▁▁█▁▁▁▁█▁▁███▁▁█▁██

browserScan                   87.77 ms/iter  91.19 ms █     █      █
                      (79.00 ms … 98.36 ms)  97.54 ms █▅    █  ▅ ▅ █▅     ▅
                    (236.00 kb …   5.06 mb)   2.11 mb ██▁▁▁▁█▁▁█▁█▁██▁▁▁▁▁█

ignoreWalk                   436.50 ms/iter 437.67 ms       █      █
                    (421.80 ms … 490.20 ms) 440.69 ms ▅   ▅ █ ▅ ▅  █   ▅▅ ▅
                    (  3.35 mb …   5.54 mb)   4.64 mb █▁▁▁█▁█▁█▁█▁▁█▁▁▁██▁█

                             ┌                                            ┐
                 scan (fast) ┤ 7.65 ms
          browserScan (fast) ┤ 7.40 ms
                        scan ┤■■■■■■ 88.88 ms
                 browserScan ┤■■■■■■ 87.77 ms
                  ignoreWalk ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 436.50 ms
                             └                                            ┘

summary
  browserScan (fast)
   1.03x faster than scan (fast)
   11.86x faster than browserScan
   12.01x faster than scan
   58.98x faster than ignoreWalk
NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~1.06 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.3.14 (x64-win32)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
scan (fast)                    7.98 ms/iter   9.07 ms  █
                       (6.35 ms … 11.06 ms)  11.04 ms ▅█▇       ▆▇▅
                    (  0.00  b …   1.61 mb) 144.73 kb ███▇▇▂▂▁▁▁███▅▅▄▁▅▁▁▄

browserScan (fast)             7.73 ms/iter   8.74 ms  ▃█           ▆
                        (6.26 ms … 9.99 ms)   9.79 ms  ██          ▅█  ▂
                    (  0.00  b … 804.00 kb)  54.26 kb ████▆▄▄▁▁▁▁▁▇██▆▇█▄▁▃

scan                          66.58 ms/iter  69.81 ms                   █
                      (57.53 ms … 72.63 ms)  71.44 ms        █   █      █
                    (160.00 kb …   5.22 mb)   1.04 mb █▁▁▁▁▁▁█▁▁▁██▁█▁▁▁█▁█

browserScan                   72.43 ms/iter  72.75 ms         █
                      (60.75 ms … 88.16 ms)  87.60 ms     █  ███
                    (144.00 kb …   1.36 mb) 476.00 kb █▁▁▁█▁▁███▁▁▁▁▁▁▁▁▁▁█

ignoreWalk                   501.43 ms/iter 504.02 ms █    █
                    (488.27 ms … 521.49 ms) 517.31 ms █   ▅█▅  ▅▅▅   ▅    ▅
                    (960.00 kb …   6.71 mb)   3.51 mb █▁▁▁███▁▁███▁▁▁█▁▁▁▁█

                             ┌                                            ┐
                 scan (fast) ┤ 7.98 ms
          browserScan (fast) ┤ 7.73 ms
                        scan ┤■■■■ 66.58 ms
                 browserScan ┤■■■■ 72.43 ms
                  ignoreWalk ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 501.43 ms
                             └                                            ┘

summary
  browserScan (fast)
   1.03x faster than scan (fast)
   8.61x faster than scan
   9.37x faster than browserScan
   64.86x faster than ignoreWalk
```

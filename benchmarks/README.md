# `view-ignored` benchmarks

## `view-ignored` Git and NPM vs. `ignore-walk`

In this benchmark, we compare the performance of
`view-ignored` with `ignore-walk` for scanning
Git and NPM ignore files for the 'view-ignored' directory.

### Node

```txt
$ node --expose-gc benchmarks/git.js && node --expose-gc benchmarks/npm.js
Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~3.54 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: node 26.1.0 (x64-linux)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
scan (fast)                    2.12 ms/iter   2.16 ms   █
                        (1.82 ms … 3.98 ms)   3.47 ms  ▅█▂
                    (110.34 kb …   1.44 mb) 542.24 kb ▃████▄▃▂▂▁▁▂▂▁▁▁▂▁▁▁▁

browserScan (fast)             2.03 ms/iter   2.04 ms   █
                        (1.84 ms … 4.00 ms)   2.98 ms  ███
                    (261.73 kb …   1.95 mb) 509.88 kb ▂███▇▅▂▂▁▁▂▁▁▁▁▁▁▁▁▁▁

scan                           7.76 ms/iter   7.78 ms    █
                       (7.20 ms … 10.27 ms)  10.01 ms  ███
                    (  1.24 mb …   3.01 mb)   2.14 mb ▆████▃▄▇▂▄▃▁▁▁▂▁▁▁▁▂▂

browserScan                    7.71 ms/iter   7.82 ms   ▂ █▄
                        (7.25 ms … 9.74 ms)   9.11 ms   █▂██
                    (340.00 kb …   3.87 mb)   2.10 mb ▇█████▄█▇▁▅▄▁▅▁▁▁▁▁▁▂

ignoreWalk                     3.51 ms/iter   3.55 ms  █▂
                        (3.22 ms … 5.58 ms)   5.36 ms  ██▂
                    (  2.54 mb …   5.62 mb)   4.07 mb ▇███▅▄▂▂▂▁▂▁▁▁▁▁▁▁▁▁▁

                             ┌                                            ┐
                 scan (fast) ┤■ 2.12 ms
          browserScan (fast) ┤ 2.03 ms
                        scan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 7.76 ms
                 browserScan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 7.71 ms
                  ignoreWalk ┤■■■■■■■■■ 3.51 ms
                             └                                            ┘

summary
  browserScan (fast)
   1.05x faster than scan (fast)
   1.73x faster than ignoreWalk
   3.81x faster than browserScan
   3.83x faster than scan
NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~3.55 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: node 26.1.0 (x64-linux)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
scan (fast)                    1.65 ms/iter   1.67 ms    ▂█
                        (1.45 ms … 3.90 ms)   2.42 ms ▄▄ ███
                    (258.56 kb …   3.55 mb)   1.07 mb ██████▄▂▂▂▁▂▁▂▁▁▁▁▁▁▁

browserScan (fast)             1.56 ms/iter   1.58 ms  ▃█
                        (1.45 ms … 2.41 ms)   2.05 ms  ██▅▂
                    (328.79 kb …   2.07 mb)   1.05 mb ▅█████▅▃▂▂▁▁▁▁▂▁▂▂▁▁▁

scan                           7.74 ms/iter   7.86 ms  ██
                        (7.48 ms … 8.41 ms)   8.26 ms  ██▃ ▅█▃     ▅
                    (  5.68 mb …   7.96 mb)   6.29 mb ████▅██████▇██▃▁▃▃▅▁▅

browserScan                    7.74 ms/iter   7.86 ms   █ █      ▆
                        (7.46 ms … 8.30 ms)   8.21 ms ▂▂███▂ ▅▅█ █  ▂
                    (  4.90 mb …   6.46 mb)   6.24 mb ██████████▆█▆▁█▃▆▆█▁▆

ignoreWalk                     3.56 ms/iter   3.56 ms   █
                        (3.22 ms … 5.42 ms)   5.26 ms  ▄██
                    (739.88 kb …   5.41 mb)   4.05 mb ▂███▆▃▂▂▂▁▁▁▂▁▁▁▁▁▁▁▂

                             ┌                                            ┐
                 scan (fast) ┤■ 1.65 ms
          browserScan (fast) ┤ 1.56 ms
                        scan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 7.74 ms
                 browserScan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 7.74 ms
                  ignoreWalk ┤■■■■■■■■■■■ 3.56 ms
                             └                                            ┘

summary
  browserScan (fast)
   1.06x faster than scan (fast)
   2.28x faster than ignoreWalk
   4.97x faster than browserScan
   4.97x faster than scan
```

#### Low-end

```txt
$ node --expose-gc benchmarks/git.js && node --expose-gc benchmarks/npm.js
Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~2.03 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.1.0 (x64-win32)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
scan (fast)                    5.60 ms/iter   5.72 ms  █▆ ▃
                        (4.97 ms … 8.42 ms)   7.60 ms ▃████▇▆
                    (209.63 kb …   1.27 mb) 585.94 kb ███████▁▄▃▃▂▆▂▂▃▂▁▂▂▂

browserScan (fast)             6.30 ms/iter   6.89 ms  █
                       (4.97 ms … 11.76 ms)   9.43 ms ██▂ ▂█▄▂
                    (388.45 kb …   1.21 mb) 550.54 kb ███▆███████▅▄▂▅▂▂▂▁▂▂

scan                         107.98 ms/iter 115.61 ms                     █
                     (87.03 ms … 131.56 ms) 119.46 ms ▅▅     ▅▅  ▅▅  ▅▅ ▅ █
                    (  9.37 mb …  11.59 mb)  10.06 mb ██▁▁▁▁▁██▁▁██▁▁██▁█▁█

browserScan                   97.40 ms/iter 102.09 ms               █
                     (83.75 ms … 109.93 ms) 107.85 ms ▅   ▅▅▅   ▅▅  █▅▅   ▅
                    (  7.62 mb …  11.38 mb)   9.45 mb █▁▁▁███▁▁▁██▁▁███▁▁▁█

ignoreWalk                   406.86 ms/iter 403.09 ms ███  █
                    (377.82 ms … 472.61 ms) 464.24 ms ███  █▅         ▅   ▅
                    ( 22.23 mb …  25.28 mb)  23.21 mb ███▁▁██▁▁▁▁▁▁▁▁▁█▁▁▁█

                             ┌                                            ┐
                 scan (fast) ┤ 5.60 ms
          browserScan (fast) ┤ 6.30 ms
                        scan ┤■■■■■■■■■ 107.98 ms
                 browserScan ┤■■■■■■■■ 97.40 ms
                  ignoreWalk ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 406.86 ms
                             └                                            ┘

summary
  scan (fast)
   1.12x faster than browserScan (fast)
   17.38x faster than browserScan
   19.27x faster than scan
   72.59x faster than ignoreWalk
NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~1.83 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.1.0 (x64-win32)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
scan (fast)                    7.35 ms/iter   8.16 ms █   ▃
                       (4.93 ms … 18.98 ms)  14.85 ms █▇▅▇█
                    (854.87 kb …   2.77 mb)   1.14 mb █████▅▅█▆▂▅▂▁▅▂▂▂▁▂▂▂

browserScan (fast)             5.42 ms/iter   5.47 ms  █
                        (4.75 ms … 8.30 ms)   7.73 ms  ██▅▃
                    (445.77 kb …   1.72 mb)   1.07 mb █████▃▄▂▂▂▂▃▄▂▂▁▂▁▂▂▂

scan                          59.71 ms/iter  64.85 ms                  █ █
                      (48.45 ms … 71.86 ms)  66.03 ms ▅▅ ▅  ▅  ▅      ▅█ █▅
                    ( 14.48 mb …  17.63 mb)  15.30 mb ██▁█▁▁█▁▁█▁▁▁▁▁▁██▁██

browserScan                   57.09 ms/iter  60.04 ms █            █
                      (52.52 ms … 62.66 ms)  61.28 ms █ ▅   ▅      █   ▅  ▅
                    (  6.52 mb …  15.06 mb)  13.63 mb █▁█▁▁▁█▁▁▁▁▁▁█▁▁▁█▁▁█

ignoreWalk                   456.59 ms/iter 469.16 ms      █            █
                    (423.56 ms … 493.12 ms) 474.24 ms ▅    █    ▅▅ ▅▅ ▅ █ ▅
                    ( 22.22 mb …  25.53 mb)  23.26 mb █▁▁▁▁█▁▁▁▁██▁██▁█▁█▁█

                             ┌                                            ┐
                 scan (fast) ┤ 7.35 ms
          browserScan (fast) ┤ 5.42 ms
                        scan ┤■■■■ 59.71 ms
                 browserScan ┤■■■■ 57.09 ms
                  ignoreWalk ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 456.59 ms
                             └                                            ┘

summary
  browserScan (fast)
   1.36x faster than scan (fast)
   10.54x faster than browserScan
   11.03x faster than scan
   84.31x faster than ignoreWalk
```

### Bun

```txt
$ bun run --expose-gc benchmarks/git.js && bun run --expose-gc benchmarks/npm.js
Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~3.47 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: bun 1.3.14 (x64-linux)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
scan (fast)                    1.44 ms/iter   1.48 ms  ▃█▂█
                        (1.11 ms … 3.80 ms)   2.74 ms  ████▃
                    (  0.00  b …   3.88 mb)  44.19 kb ▄█████▅▄▂▄▄▃▂▁▁▁▁▁▁▁▁

browserScan (fast)             1.25 ms/iter   1.27 ms    █▇
                        (1.10 ms … 1.79 ms)   1.72 ms  ▂███▃
                    (  0.00  b … 512.00 kb)  10.74 kb ▂██████▅▂▂▂▂▂▂▂▃▃▂▂▂▁

scan                           3.97 ms/iter   4.12 ms     ▆█▂
                        (3.57 ms … 4.72 ms)   4.68 ms    ▄███▂  ▂
                    (  0.00  b …   1.00 mb)  40.66 kb ▃▆██████▇▄██▇▅▇▅▃▂▂▂▂

browserScan                    3.92 ms/iter   4.03 ms     █▂
                        (3.58 ms … 4.63 ms)   4.59 ms   ▃▆██▃
                    (  0.00  b … 640.00 kb)  27.38 kb ▂██████▇▄▄▃▄▅▆▆▃▆▁▂▁▂

ignoreWalk                     4.08 ms/iter   4.26 ms  █▂
                        (3.71 ms … 6.25 ms)   5.69 ms  ██▄
                    (  0.00  b …   2.63 mb) 106.01 kb ▅███▃▄█▆▃▂▁▂▁▁▁▁▁▁▁▁▁

                             ┌                                            ┐
                 scan (fast) ┤■■ 1.44 ms
          browserScan (fast) ┤ 1.25 ms
                        scan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 3.97 ms
                 browserScan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 3.92 ms
                  ignoreWalk ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 4.08 ms
                             └                                            ┘

summary
  browserScan (fast)
   1.15x faster than scan (fast)
   3.12x faster than browserScan
   3.17x faster than scan
   3.25x faster than ignoreWalk
NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~3.53 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: bun 1.3.14 (x64-linux)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
scan (fast)                    1.54 ms/iter   1.51 ms  ▇█
                        (1.36 ms … 2.90 ms)   2.39 ms  ██
                    (  0.00  b …   1.75 mb)  51.48 kb ████▄▁▂▂▁▁▂▃▃▂▂▂▂▁▂▁▁

browserScan (fast)             1.49 ms/iter   1.47 ms    ▆█
                        (1.34 ms … 2.04 ms)   1.96 ms    ██
                    (  0.00  b … 256.00 kb)   6.11 kb ▁▂▅██▇▂▂▁▁▁▁▁▁▁▁▁▂▃▂▂

scan                           8.13 ms/iter   8.29 ms   ▄ ▂   █▆
                        (7.60 ms … 9.67 ms)   9.01 ms   █▆█▃▆ ██▃▃
                    (  0.00  b …   6.38 mb) 252.76 kb ▅▅█████▅████▇▃▃▅▃▃▃▁▃

browserScan                    8.00 ms/iter   8.19 ms          ▂▆      █▆
                        (7.31 ms … 8.36 ms)   8.35 ms        ▃███▃   █▃██
                    (  0.00  b … 768.00 kb)  28.10 kb ▃▁▁▁▁▁▁██████▅▇████▅█

ignoreWalk                     4.08 ms/iter   4.26 ms  █▇
                        (3.71 ms … 6.11 ms)   5.79 ms  ██
                    (  0.00  b …   2.25 mb)  80.88 kb ▄██▃▅█▆▇▂▂▂▁▁▁▁▁▁▁▁▁▁

                             ┌                                            ┐
                 scan (fast) ┤ 1.54 ms
          browserScan (fast) ┤ 1.49 ms
                        scan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 8.13 ms
                 browserScan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 8.00 ms
                  ignoreWalk ┤■■■■■■■■■■■■■ 4.08 ms
                             └                                            ┘

summary
  browserScan (fast)
   1.03x faster than scan (fast)
   2.74x faster than ignoreWalk
   5.36x faster than browserScan
   5.45x faster than scan
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
scan (fast)                    7.69 ms/iter   8.59 ms  █
                       (6.01 ms … 10.98 ms)  10.93 ms  █▂      ▇▄
                    (  0.00  b …   1.66 mb) 119.35 kb ▆███▅▄▅▄▆███▆█▂▂▁▄▂▁▂

browserScan (fast)             7.32 ms/iter   8.13 ms  █
                       (5.77 ms … 13.33 ms)  11.91 ms ██    ▂▅█
                    (  0.00  b …   4.83 mb) 117.17 kb ██▇▄▃▃███▇▃▂▂▂▂▂▁▁▁▁▂

scan                          89.13 ms/iter  95.46 ms     █
                     (75.93 ms … 102.84 ms) 101.55 ms     █
                    (284.00 kb …   4.79 mb)   1.78 mb █▁▁▁█▁█▁▁█▁▁██▁██▁▁▁█

browserScan                   91.61 ms/iter  95.18 ms                 █
                      (80.83 ms … 98.95 ms)  97.53 ms                 █   █
                    ( 52.00 kb …   3.95 mb)   1.66 mb ██▁▁▁▁▁▁███▁▁▁▁▁██▁▁█

ignoreWalk                   450.60 ms/iter 449.60 ms         █
                    (428.50 ms … 521.18 ms) 479.01 ms ▅▅▅▅ ▅▅▅█▅          ▅
                    (660.00 kb …   5.88 mb)   4.18 mb ████▁█████▁▁▁▁▁▁▁▁▁▁█

                             ┌                                            ┐
                 scan (fast) ┤ 7.69 ms
          browserScan (fast) ┤ 7.32 ms
                        scan ┤■■■■■■ 89.13 ms
                 browserScan ┤■■■■■■ 91.61 ms
                  ignoreWalk ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 450.60 ms
                             └                                            ┘

summary
  browserScan (fast)
   1.05x faster than scan (fast)
   12.18x faster than scan
   12.52x faster than browserScan
   61.59x faster than ignoreWalk
NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~1.04 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.3.14 (x64-win32)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
scan (fast)                    7.12 ms/iter   8.04 ms ▂█
                       (5.56 ms … 10.99 ms)  10.74 ms ██▇ ▃   ▂▅ ▆
                    (  0.00  b …   1.38 mb) 133.39 kb ███▅█▅▄▂████▂▅▄▄▁▁▁▂▄

browserScan (fast)             6.61 ms/iter   7.71 ms  █
                        (5.49 ms … 8.98 ms)   8.55 ms  █
                    (  0.00  b … 772.00 kb)  53.78 kb ▆█▇█▄▄▂▁▂▁▁▂▁█▃█▄▅▂▃▃

scan                          57.70 ms/iter  57.83 ms     █
                      (54.75 ms … 63.73 ms)  61.22 ms ▅▅  █  ▅ ▅▅         ▅
                    ( 44.00 kb …   3.73 mb) 909.78 kb ██▁▁█▁▁█▁██▁▁▁▁▁▁▁▁▁█

browserScan                   57.83 ms/iter  58.36 ms                █
                      (54.60 ms … 60.87 ms)  59.54 ms ▅      ▅ ▅   ▅▅█    ▅
                    ( 16.00 kb …   1.45 mb) 524.00 kb █▁▁▁▁▁▁█▁█▁▁▁███▁▁▁▁█

ignoreWalk                   432.18 ms/iter 435.59 ms █   █
                    (421.54 ms … 445.39 ms) 443.82 ms █   █ ▅▅   ▅▅▅  ▅   ▅
                    (452.00 kb …   5.14 mb)   3.69 mb █▁▁▁█▁██▁▁▁███▁▁█▁▁▁█

                             ┌                                            ┐
                 scan (fast) ┤ 7.12 ms
          browserScan (fast) ┤ 6.61 ms
                        scan ┤■■■■ 57.70 ms
                 browserScan ┤■■■■ 57.83 ms
                  ignoreWalk ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 432.18 ms
                             └                                            ┘

summary
  browserScan (fast)
   1.08x faster than scan (fast)
   8.72x faster than scan
   8.74x faster than browserScan
   65.34x faster than ignoreWalk
```

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
clk: ~2.75 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: node 26.2.0 (x64-linux)
benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(Git, fastInternal)          1.21 ms/iter   1.23 ms  █▄
                                         (1.06 ms … 3.08 ms)   2.06 ms  ██
                                     ( 28.06 kb …   2.50 mb) 261.72 kb ▄███▆▄▃▂▂▂▂▁▁▁▁▁▁▁▁▁▁
'view-ignored'.browserScan(Git, fastInternal)   1.17 ms/iter   1.17 ms   █
                                         (1.07 ms … 2.67 ms)   1.70 ms  ▂██
                                     ( 31.10 kb … 847.67 kb) 213.85 kb ▂███▅▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁
'view-ignored'.scan(Git)                        2.19 ms/iter   2.21 ms   █▃
                                         (1.94 ms … 4.10 ms)   3.65 ms  ▅██
                                     (140.81 kb …   2.31 mb) 706.37 kb ▂███▇▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
'view-ignored'.browserScan(Git)                 2.25 ms/iter   2.24 ms   ▅█
                                         (2.00 ms … 4.51 ms)   3.21 ms   ██▆
                                     (249.92 kb …   1.42 mb) 704.01 kb ▂▆███▅▂▁▂▁▁▁▂▁▁▁▁▁▁▁▁
'ignore-walk'.walk(.gitignore)                  6.13 ms/iter   6.20 ms  █
                                        (5.22 ms … 10.57 ms)   9.75 ms  ██
                                     (  4.14 mb …   6.80 mb)   5.46 mb ███▅▄▂▁▁▂▂▅▃▂▂▂▂▂▁▁▂▂
                                              ┌                                            ┐
       'view-ignored'.scan(Git, fastInternal) ┤ 1.21 ms
'view-ignored'.browserScan(Git, fastInternal) ┤ 1.17 ms
                     'view-ignored'.scan(Git) ┤■■■■■■■ 2.19 ms
              'view-ignored'.browserScan(Git) ┤■■■■■■■ 2.25 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 6.13 ms
                                              └                                            ┘
summary
  'view-ignored'.browserScan(Git, fastInternal)
   1.04x faster than 'view-ignored'.scan(Git, fastInternal)
   1.88x faster than 'view-ignored'.scan(Git)
   1.92x faster than 'view-ignored'.browserScan(Git)
   5.24x faster than 'ignore-walk'.walk(.gitignore)
NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~2.74 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: node 26.2.0 (x64-linux)
benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(NPM, fastInternal)        599.04 µs/iter 632.58 µs  █   ▂▄
                                       (480.64 µs … 3.26 ms) 948.29 µs  ██▃███▇
                                     ( 10.38 kb …   1.45 mb) 120.15 kb ▅████████▆▃▃▂▁▁▁▁▂▁▁▁
'view-ignored'.browserScan(NPM, fastInternal) 585.56 µs/iter 610.93 µs      ▂ ▄█▇▅
                                       (490.86 µs … 1.95 ms) 744.97 µs   ▂▇██ ████▄
                                     (  9.92 kb … 388.46 kb)  95.80 kb ▃███████████▆▂▂▃▂▂▂▁▁
'view-ignored'.scan(NPM)                        3.76 ms/iter   3.78 ms   ▃█
                                         (3.51 ms … 5.69 ms)   4.65 ms  ▂██▃
                                     (307.93 kb …   7.18 mb)   1.46 mb ▄████▆▂▄▃▂▄▂▁▂▂▁▂▁▁▁▁
'view-ignored'.browserScan(NPM)                 3.66 ms/iter   3.68 ms    ▆██
                                         (3.52 ms … 4.09 ms)   4.06 ms  ▆▆███▃
                                     (304.36 kb …   2.41 mb)   1.40 mb ▆██████▇█▅▂▂▂▅▂▂▂▂▂▁▂
'ignore-walk'.walk(.gitignore, .npmignore)      5.60 ms/iter   5.59 ms  ▇█
                                         (5.17 ms … 8.37 ms)   7.34 ms  ██▅▄
                                     (  3.68 mb …   6.95 mb)   5.46 mb ▅████▇▆▁▁▃▂▃▁▁▁▁▁▂▃▂▂
                                              ┌                                            ┐
       'view-ignored'.scan(NPM, fastInternal) ┤ 599.04 µs
'view-ignored'.browserScan(NPM, fastInternal) ┤ 585.56 µs
                     'view-ignored'.scan(NPM) ┤■■■■■■■■■■■■■■■■■■■■■■ 3.76 ms
              'view-ignored'.browserScan(NPM) ┤■■■■■■■■■■■■■■■■■■■■■ 3.66 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 5.60 ms
                                              └                                            ┘
summary
  'view-ignored'.browserScan(NPM, fastInternal)
   1.02x faster than 'view-ignored'.scan(NPM, fastInternal)
   6.24x faster than 'view-ignored'.browserScan(NPM)
   6.43x faster than 'view-ignored'.scan(NPM)
   9.56x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```

#### Low-end

```txt
$ node --expose-gc benchmarks/git.js && node --expose-gc benchmarks/npm.js
Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~2.02 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 24.14.1 (x64-win32)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(Git, fastInternal)          2.94 ms/iter   3.09 ms █▆
                                         (2.23 ms … 9.82 ms)   7.21 ms ██▆▃
                                     ( 18.41 kb …   3.11 mb) 373.41 kb █████▅▅▃▂▁▁▂▁▁▁▁▁▁▁▁▁

'view-ignored'.browserScan(Git, fastInternal)   2.51 ms/iter   2.51 ms  █
                                         (2.24 ms … 5.58 ms)   4.93 ms ▄█
                                     ( 84.26 kb …   1.31 mb) 288.89 kb ██▇▄▄▃▃▁▂▁▁▁▁▁▁▁▁▁▁▁▁

'view-ignored'.scan(Git)                       61.02 ms/iter  61.75 ms █ █
                                       (58.70 ms … 65.13 ms)  63.71 ms █ █    ▅ ▅▅▅▅▅      ▅
                                     (  4.75 mb …  13.77 mb)  12.74 mb █▁█▁▁▁▁█▁█████▁▁▁▁▁▁█

'view-ignored'.browserScan(Git)                57.06 ms/iter  60.61 ms ██ █   █ █ █      █ █
                                       (52.11 ms … 63.09 ms)  61.82 ms ██ █   █ █ █      █ █
                                     (  4.88 mb …  15.00 mb)  12.95 mb ██▁█▁▁▁█▁█▁█▁▁▁▁▁▁█▁█

'ignore-walk'.walk(.gitignore)                678.56 ms/iter 685.59 ms               █     █
                                     (662.21 ms … 690.28 ms) 689.93 ms ▅   ▅▅▅   ▅ ▅ █  ▅  █
                                     (  2.76 mb …   7.44 mb)   4.60 mb █▁▁▁███▁▁▁█▁█▁█▁▁█▁▁█

                                              ┌                                            ┐
       'view-ignored'.scan(Git, fastInternal) ┤ 2.94 ms
'view-ignored'.browserScan(Git, fastInternal) ┤ 2.51 ms
                     'view-ignored'.scan(Git) ┤■■■ 61.02 ms
              'view-ignored'.browserScan(Git) ┤■■■ 57.06 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 678.56 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, fastInternal)
   1.17x faster than 'view-ignored'.scan(Git, fastInternal)
   22.71x faster than 'view-ignored'.browserScan(Git)
   24.29x faster than 'view-ignored'.scan(Git)
   270.12x faster than 'ignore-walk'.walk(.gitignore)
NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~2.02 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 24.14.1 (x64-win32)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(NPM, fastInternal)          1.64 ms/iter   1.75 ms  █
                                         (1.34 ms … 3.14 ms)   2.96 ms ██
                                     (  3.07 kb …   2.76 mb) 164.03 kb ███▆██▅▅▄▃▂▂▂▁▁▁▂▁▁▁▁

'view-ignored'.browserScan(NPM, fastInternal)   1.47 ms/iter   1.47 ms  █
                                         (1.33 ms … 2.92 ms)   2.19 ms ▄█
                                     ( 27.91 kb … 911.45 kb) 102.94 kb ██▇▄▃▃▃▂▂▁▂▁▂▂▁▁▁▁▁▁▁

'view-ignored'.scan(NPM)                       32.63 ms/iter  33.85 ms            █
                                       (27.16 ms … 38.02 ms)  37.14 ms            █ █
                                     (  5.59 mb …   6.63 mb)   6.35 mb ██▁█▁▁█▁████████▁█▁▁█

'view-ignored'.browserScan(NPM)                28.86 ms/iter  31.30 ms       █      █    █
                                       (24.34 ms … 32.35 ms)  31.97 ms       █  █   █    ███
                                     (  6.35 mb …   6.56 mb)   6.42 mb ██▁█▁▁██▁██▁▁█▁▁▁▁███

'ignore-walk'.walk(.gitignore, .npmignore)    790.58 ms/iter 806.30 ms                     █
                                     (763.97 ms … 813.51 ms) 810.70 ms ▅▅ ▅   ▅  ▅▅▅▅    ▅ █
                                     (  1.03 mb …   7.83 mb)   4.39 mb ██▁█▁▁▁█▁▁████▁▁▁▁█▁█

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, fastInternal) ┤ 1.64 ms
'view-ignored'.browserScan(NPM, fastInternal) ┤ 1.47 ms
                     'view-ignored'.scan(NPM) ┤■ 32.63 ms
              'view-ignored'.browserScan(NPM) ┤■ 28.86 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 790.58 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, fastInternal)
   1.12x faster than 'view-ignored'.scan(NPM, fastInternal)
   19.68x faster than 'view-ignored'.browserScan(NPM)
   22.26x faster than 'view-ignored'.scan(NPM)
   539.22x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
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
benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(Git, fastInternal)        757.35 µs/iter 734.98 µs  █
                                       (620.47 µs … 3.12 ms)   1.65 ms  █▃
                                     (  0.00  b … 896.00 kb)  21.88 kb ▄██▄▃▂▂▁▁▁▂▂▂▁▁▁▁▁▁▁▁
'view-ignored'.browserScan(Git, fastInternal) 745.48 µs/iter 775.32 µs   █
                                       (609.72 µs … 1.64 ms)   1.39 ms  ▃█
                                     (  0.00  b … 256.00 kb)   4.37 kb ▂██▇▆▇▃▂▁▁▁▁▁▁▁▁▂▁▁▁▁
'view-ignored'.scan(Git)                        1.57 ms/iter   1.56 ms     █
                                         (1.26 ms … 3.04 ms)   2.53 ms    ██
                                     (  0.00  b … 640.00 kb)  24.13 kb ▁▃▆███▃▂▁▂▂▂▂▃▂▁▁▁▁▁▁
'view-ignored'.browserScan(Git)                 1.52 ms/iter   1.54 ms      █▇▂
                                         (1.19 ms … 3.12 ms)   2.14 ms     ▄███
                                     (  0.00  b … 256.00 kb)   7.71 kb ▁▄▃▄█████▅▂▁▂▂▂▃▃▂▂▂▂
'ignore-walk'.walk(.gitignore)                  7.46 ms/iter   8.64 ms █▄
                                        (5.95 ms … 10.14 ms)   9.73 ms ██ ▇▇          ▂  ▂
                                     (  0.00  b …   2.38 mb) 127.00 kb ██▃███▃▅▅██▅▃▅██▅███▅
                                              ┌                                            ┐
       'view-ignored'.scan(Git, fastInternal) ┤ 757.35 µs
'view-ignored'.browserScan(Git, fastInternal) ┤ 745.48 µs
                     'view-ignored'.scan(Git) ┤■■■■ 1.57 ms
              'view-ignored'.browserScan(Git) ┤■■■■ 1.52 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 7.46 ms
                                              └                                            ┘
summary
  'view-ignored'.browserScan(Git, fastInternal)
   1.02x faster than 'view-ignored'.scan(Git, fastInternal)
   2.04x faster than 'view-ignored'.browserScan(Git)
   2.11x faster than 'view-ignored'.scan(Git)
   10.01x faster than 'ignore-walk'.walk(.gitignore)
NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~2.75 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: bun 1.3.14 (x64-linux)
benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(NPM, fastInternal)        386.68 µs/iter 381.65 µs  █▆
                                       (304.96 µs … 1.91 ms) 891.55 µs  ██
                                     (  0.00  b …   1.13 mb)   8.13 kb ▃██▆▄▄▂▁▂▁▁▁▁▁▁▁▁▁▁▁▁
'view-ignored'.browserScan(NPM, fastInternal) 358.87 µs/iter 358.00 µs   █
                                     (297.48 µs … 863.73 µs) 786.30 µs  ▇█
                                     (  0.00  b … 256.00 kb)   2.61 kb ▂███▃▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁
'view-ignored'.scan(NPM)                        3.27 ms/iter   3.30 ms  ██▃▆▅
                                         (3.01 ms … 4.19 ms)   3.83 ms  █████▂
                                     (  0.00  b …   1.13 mb)  33.85 kb ▃██████▇▁▂▃▁▂▅▆▅█▇▅▃▃
'view-ignored'.browserScan(NPM)                 3.25 ms/iter   3.27 ms  ▃█▄  ▆
                                         (3.01 ms … 3.93 ms)   3.75 ms  ███▆▆█
                                     (  0.00  b … 512.00 kb)  19.08 kb ▅███████▃▂▁▁▂▂▅█▆▅▅▄▄
'ignore-walk'.walk(.gitignore, .npmignore)      6.35 ms/iter   6.60 ms  █
                                         (5.78 ms … 9.65 ms)   8.07 ms ▅█▅   ▅▂
                                     (  0.00  b …   2.50 mb)  95.37 kb ███▄▅▇███▄▇▂▅▁▁▁▁▁▁▁▂
                                              ┌                                            ┐
       'view-ignored'.scan(NPM, fastInternal) ┤ 386.68 µs
'view-ignored'.browserScan(NPM, fastInternal) ┤ 358.87 µs
                     'view-ignored'.scan(NPM) ┤■■■■■■■■■■■■■■■■■ 3.27 ms
              'view-ignored'.browserScan(NPM) ┤■■■■■■■■■■■■■■■■ 3.25 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 6.35 ms
                                              └                                            ┘
summary
  'view-ignored'.browserScan(NPM, fastInternal)
   1.08x faster than 'view-ignored'.scan(NPM, fastInternal)
   9.06x faster than 'view-ignored'.browserScan(NPM)
   9.11x faster than 'view-ignored'.scan(NPM)
   17.7x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```

#### Low-end

```txt
Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~1.06 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.3.14 (x64-win32)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(Git, fastInternal)          2.78 ms/iter   2.89 ms  █
                                         (2.02 ms … 6.85 ms)   5.83 ms ▂█▂
                                     (  0.00  b …   1.22 mb)  51.92 kb ███▅▃▂▂▁▂▂▃▄▂▃▂▂▂▁▁▁▁

'view-ignored'.browserScan(Git, fastInternal)   2.65 ms/iter   2.55 ms  █
                                         (2.03 ms … 6.31 ms)   5.02 ms ▂█▅
                                     (  0.00  b … 488.00 kb)  21.70 kb ███▆▄▂▂▂▁▁▂▁▁▃▃▂▃▂▂▂▂

'view-ignored'.scan(Git)                       52.04 ms/iter  53.33 ms   █          █      █
                                       (47.19 ms … 56.84 ms)  56.32 ms ▅ █▅       ▅ █      █
                                     (  4.00 kb …   5.09 mb)   1.18 mb █▁██▁▁▁▁▁▁▁█▁█▁▁▁▁▁▁█

'view-ignored'.browserScan(Git)                50.83 ms/iter  53.81 ms ██  ██        ██ ██ █
                                       (44.57 ms … 56.49 ms)  55.43 ms ██  ██        ██ ██ █
                                     ( 36.00 kb … 468.00 kb) 183.60 kb ██▁▁██▁▁▁▁▁▁▁▁██▁██▁█

'ignore-walk'.walk(.gitignore)                688.77 ms/iter 705.71 ms ██             █
                                     (654.83 ms … 771.86 ms) 722.06 ms ██▅ ▅       ▅  █▅   ▅
                                     (692.00 kb …   8.71 mb)   5.99 mb ███▁█▁▁▁▁▁▁▁█▁▁██▁▁▁█

                                              ┌                                            ┐
       'view-ignored'.scan(Git, fastInternal) ┤ 2.78 ms
'view-ignored'.browserScan(Git, fastInternal) ┤ 2.65 ms
                     'view-ignored'.scan(Git) ┤■■ 52.04 ms
              'view-ignored'.browserScan(Git) ┤■■ 50.83 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 688.77 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, fastInternal)
   1.05x faster than 'view-ignored'.scan(Git, fastInternal)
   19.17x faster than 'view-ignored'.browserScan(Git)
   19.63x faster than 'view-ignored'.scan(Git)
   259.79x faster than 'ignore-walk'.walk(.gitignore)
NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~1.05 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.3.14 (x64-win32)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(NPM, fastInternal)          1.76 ms/iter   1.78 ms ▄ █
                                         (1.19 ms … 4.78 ms)   4.14 ms █▆█▆▂
                                     (  0.00  b … 672.00 kb)  30.15 kb █████▆▂▃▂▁▂▂▂▃▂▂▂▄▂▂▁

'view-ignored'.browserScan(NPM, fastInternal)   1.48 ms/iter   1.42 ms  █
                                         (1.16 ms … 3.80 ms)   3.50 ms ██
                                     (  0.00  b … 132.00 kb)   9.53 kb ██▇▄▃▁▂▁▁▁▁▁▁▁▁▂▂▁▂▂▁

'view-ignored'.scan(NPM)                       24.69 ms/iter  27.11 ms  █    █   █     █
                                       (21.04 ms … 29.55 ms)  29.33 ms  ██   ██  █     █   █
                                     ( 96.00 kb … 856.00 kb) 279.48 kb ████▁████▁█▁▁▁███▁▁▁█

'view-ignored'.browserScan(NPM)                24.21 ms/iter  26.77 ms  █
                                       (20.63 ms … 29.53 ms)  28.87 ms  █
                                     (  8.00 kb … 236.00 kb) 134.24 kb ██▁▅▅█▁▁▅▅▁█▁▁█▅▅▁▁██

'ignore-walk'.walk(.gitignore, .npmignore)    766.49 ms/iter 827.34 ms                    █
                                     (674.63 ms … 851.68 ms) 836.51 ms ▅▅▅  ▅    ▅ ▅▅▅    █▅
                                     (  5.93 mb …   9.97 mb)   7.95 mb ███▁▁█▁▁▁▁█▁███▁▁▁▁██

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, fastInternal) ┤ 1.76 ms
'view-ignored'.browserScan(NPM, fastInternal) ┤ 1.48 ms
                     'view-ignored'.scan(NPM) ┤■ 24.69 ms
              'view-ignored'.browserScan(NPM) ┤■ 24.21 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 766.49 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, fastInternal)
   1.18x faster than 'view-ignored'.scan(NPM, fastInternal)
   16.31x faster than 'view-ignored'.browserScan(NPM)
   16.64x faster than 'view-ignored'.scan(NPM)
   516.42x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```

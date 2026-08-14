# `view-ignored` / benchmarks

### Node

<!-- BENCH_NODE_START -->

```txt
$ node --expose-gc benchmarks/git.js && node --expose-gc benchmarks/npm.js

Git target benchmark
clk: ~3.35 GHz
cpu: Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz
runtime: node 26.7.0 (x64-linux)

Memory Usage:
  'view-ignored'.scan(Git, skipInternal)          Avg: 288.67 kb  Range: 1.77 kb … 1.66 mb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 264.20 kb  Range: 34.80 kb … 1.16 mb
  'view-ignored'.scan(Git)                        Avg: 1.02 mb    Range: 345.30 kb … 3.71 mb
  'view-ignored'.browserScan(Git)                 Avg: 1.00 mb    Range: 331.98 kb … 1.43 mb
  'view-ignored'.scan(Git, inverted)              Avg: 1.09 mb    Range: 694.83 kb … 1.76 mb
  'view-ignored'.browserScan(Git, inverted)       Avg: 1.09 mb    Range: 1.06 mb … 1.12 mb
  'ignore-walk'.walk(.gitignore)                  Avg: 7.21 mb    Range: 6.28 mb … 7.55 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 1.27 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 1.21 ms
                     'view-ignored'.scan(Git) ┤■■■■■ 2.15 ms
              'view-ignored'.browserScan(Git) ┤■■■■ 2.08 ms
           'view-ignored'.scan(Git, inverted) ┤■■■■■ 2.30 ms
    'view-ignored'.browserScan(Git, inverted) ┤■■■■■ 2.27 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 8.19 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.05x faster than 'view-ignored'.scan(Git, skipInternal)
   1.72x faster than 'view-ignored'.browserScan(Git)
   1.78x faster than 'view-ignored'.scan(Git)
   1.88x faster than 'view-ignored'.browserScan(Git, inverted)
   1.9x faster than 'view-ignored'.scan(Git, inverted)
   6.78x faster than 'ignore-walk'.walk(.gitignore)

Git Init benchmark
clk: ~3.35 GHz
cpu: Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz
runtime: node 26.7.0 (x64-linux)

Memory Usage:
  'view-ignored'.Git.init   Avg: 8.85 kb    Range: 736.00 b … 616.12 kb

                             ┌                                            ┐
     'view-ignored'.Git.init ┤ 133.60 µs
                             └                                            ┘

NPM target benchmark
clk: ~3.35 GHz
cpu: Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz
runtime: node 26.7.0 (x64-linux)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 320.43 kb  Range: 19.50 kb … 1.80 mb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 290.98 kb  Range: 8.09 kb … 1.24 mb
  'view-ignored'.scan(NPM)                        Avg: 724.44 kb  Range: 29.99 kb … 1.93 mb
  'view-ignored'.browserScan(NPM)                 Avg: 734.74 kb  Range: 51.20 kb … 2.68 mb
  'view-ignored'.scan(NPM, inverted)              Avg: 728.46 kb  Range: 29.66 kb … 1.87 mb
  'view-ignored'.browserScan(NPM, inverted)       Avg: 718.42 kb  Range: 118.17 kb … 1.04 mb
  'npm-packlist'(preparedArbTree)                 Avg: 72.83 kb   Range: 4.70 kb … 498.06 kb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 7.25 mb    Range: 5.53 mb … 8.82 mb
  'npmcli/arborist'.loadActual()                  Avg: 462.22  b  Range: 70.57 b … 759.35 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 1.00 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 951.47 µs
                     'view-ignored'.scan(NPM) ┤■■ 2.22 ms
              'view-ignored'.browserScan(NPM) ┤■■ 2.28 ms
           'view-ignored'.scan(NPM, inverted) ┤■■ 2.16 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■■ 2.12 ms
              'npm-packlist'(preparedArbTree) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 25.95 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■ 8.49 ms
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 252.64 ns
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.05x faster than 'view-ignored'.scan(NPM, skipInternal)
   2.22x faster than 'view-ignored'.browserScan(NPM, inverted)
   2.27x faster than 'view-ignored'.scan(NPM, inverted)
   2.33x faster than 'view-ignored'.scan(NPM)
   2.4x faster than 'view-ignored'.browserScan(NPM)
   8.93x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
   27.28x faster than 'npm-packlist'(preparedArbTree)

NPM Init benchmark
clk: ~3.36 GHz
cpu: Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz
runtime: node 26.7.0 (x64-linux)

Memory Usage:
  'view-ignored'.NPM.init   Avg: 42.04 kb   Range: 1.50 kb … 668.27 kb

                             ┌                                            ┐
     'view-ignored'.NPM.init ┤ 183.73 µs
                             └                                            ┘
```

<!-- BENCH_NODE_END -->

#### Low-end

<!-- BENCH_NODE_LOW_START -->

```txt
$ node --expose-gc benchmarks/git.js && node --expose-gc benchmarks/npm.js



Git target benchmark
clk: ~1.98 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.7.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(Git, skipInternal)          Avg: 340.19 kb  Range: 27.45 kb … 1.77 mb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 267.95 kb  Range: 207.59 kb … 929.13 kb
  'view-ignored'.scan(Git)                        Avg: 8.14 mb    Range: 6.48 mb … 11.55 mb
  'view-ignored'.browserScan(Git)                 Avg: 7.92 mb    Range: 7.70 mb … 8.15 mb
  'view-ignored'.scan(Git, inverted)              Avg: 9.09 mb    Range: 8.31 mb … 10.32 mb
  'view-ignored'.browserScan(Git, inverted)       Avg: 8.81 mb    Range: 7.68 mb … 9.02 mb
  'ignore-walk'.walk(.gitignore)                  Avg: 15.11 mb   Range: 730.76 kb … 21.35 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 2.82 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 2.62 ms
                     'view-ignored'.scan(Git) ┤■ 23.04 ms
              'view-ignored'.browserScan(Git) ┤■ 19.77 ms
           'view-ignored'.scan(Git, inverted) ┤■ 31.31 ms
    'view-ignored'.browserScan(Git, inverted) ┤■ 26.89 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 778.16 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.08x faster than 'view-ignored'.scan(Git, skipInternal)
   7.56x faster than 'view-ignored'.browserScan(Git)
   8.8x faster than 'view-ignored'.scan(Git)
   10.28x faster than 'view-ignored'.browserScan(Git, inverted)
   11.97x faster than 'view-ignored'.scan(Git, inverted)
   297.41x faster than 'ignore-walk'.walk(.gitignore)

NPM target benchmark
clk: ~1.99 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.7.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 375.11 kb  Range: 1.63 kb … 1.99 mb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 296.20 kb  Range: 270.99 kb … 1.65 mb
  'view-ignored'.scan(NPM)                        Avg: 12.69 mb   Range: 11.73 mb … 13.35 mb
  'view-ignored'.browserScan(NPM)                 Avg: 12.75 mb   Range: 12.65 mb … 13.23 mb
  'view-ignored'.scan(NPM, inverted)              Avg: 13.60 mb   Range: 13.54 mb … 13.67 mb
  'view-ignored'.browserScan(NPM, inverted)       Avg: 13.55 mb   Range: 13.50 mb … 13.65 mb
  'npm-packlist'(preparedArbTree)                 Avg: 7.28 mb    Range: 7.00 mb … 7.45 mb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 16.99 mb   Range: 16.52 mb … 18.96 mb
  'npmcli/arborist'.loadActual()                  Avg: 454.32  b  Range: 138.67 b … 738.44 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 2.63 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 2.34 ms
                     'view-ignored'.scan(NPM) ┤■■ 56.96 ms
              'view-ignored'.browserScan(NPM) ┤■■ 63.25 ms
           'view-ignored'.scan(NPM, inverted) ┤■■ 64.04 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■■ 61.23 ms
              'npm-packlist'(preparedArbTree) ┤■■■ 88.73 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 922.74 ms
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 343.38 ns
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.13x faster than 'view-ignored'.scan(NPM, skipInternal)
   24.36x faster than 'view-ignored'.scan(NPM)
   26.19x faster than 'view-ignored'.browserScan(NPM, inverted)
   27.05x faster than 'view-ignored'.browserScan(NPM)
   27.39x faster than 'view-ignored'.scan(NPM, inverted)
   37.95x faster than 'npm-packlist'(preparedArbTree)
   394.66x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```

<!-- BENCH_NODE_LOW_END -->

### Bun

<!-- BENCH_BUN_START -->

```txt
$ bun run --expose-gc benchmarks/git.js && bun run --expose-gc benchmarks/npm.js

Git target benchmark
clk: ~3.32 GHz
cpu: Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz
runtime: bun 1.3.14 (x64-linux)

Memory Usage:
  'view-ignored'.scan(Git, skipInternal)          Avg: 28.81 kb   Range: 0.00 b … 1.50 mb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 4.69 kb    Range: 0.00 b … 512.00 kb
  'view-ignored'.scan(Git)                        Avg: 34.45 kb   Range: 0.00 b … 1.50 mb
  'view-ignored'.browserScan(Git)                 Avg: 11.36 kb   Range: 0.00 b … 384.00 kb
  'view-ignored'.scan(Git, inverted)              Avg: 33.72 kb   Range: 0.00 b … 512.00 kb
  'view-ignored'.browserScan(Git, inverted)       Avg: 27.28 kb   Range: 0.00 b … 384.00 kb
  'ignore-walk'.walk(.gitignore)                  Avg: 148.18 kb  Range: 0.00 b … 2.50 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 766.61 µs
'view-ignored'.browserScan(Git, skipInternal) ┤ 677.36 µs
                     'view-ignored'.scan(Git) ┤■■■ 1.58 ms
              'view-ignored'.browserScan(Git) ┤■■■ 1.60 ms
           'view-ignored'.scan(Git, inverted) ┤■■■■ 1.84 ms
    'view-ignored'.browserScan(Git, inverted) ┤■■■■ 1.86 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 9.65 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.13x faster than 'view-ignored'.scan(Git, skipInternal)
   2.33x faster than 'view-ignored'.scan(Git)
   2.36x faster than 'view-ignored'.browserScan(Git)
   2.72x faster than 'view-ignored'.scan(Git, inverted)
   2.75x faster than 'view-ignored'.browserScan(Git, inverted)
   14.25x faster than 'ignore-walk'.walk(.gitignore)

Git Init benchmark
clk: ~3.33 GHz
cpu: Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz
runtime: bun 1.3.14 (x64-linux)

Memory Usage:
  'view-ignored'.Git.init   Avg: 479.52  b  Range: 0.00 b … 256.00 kb

                             ┌                                            ┐
     'view-ignored'.Git.init ┤ 42.08 µs
                             └                                            ┘

NPM target benchmark
clk: ~3.28 GHz
cpu: Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz
runtime: bun 1.3.14 (x64-linux)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 19.67 kb   Range: 0.00 b … 896.00 kb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 9.80 kb    Range: 0.00 b … 384.00 kb
  'view-ignored'.scan(NPM)                        Avg: 21.97 kb   Range: 0.00 b … 1.25 mb
  'view-ignored'.browserScan(NPM)                 Avg: 7.46 kb    Range: 0.00 b … 256.00 kb
  'view-ignored'.scan(NPM, inverted)              Avg: 10.69 kb   Range: 0.00 b … 1.00 mb
  'view-ignored'.browserScan(NPM, inverted)       Avg: 7.89 kb    Range: 0.00 b … 512.00 kb
  'npm-packlist'(preparedArbTree)                 Avg: 184.89 kb  Range: 0.00 b … 1.63 mb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 94.97 kb   Range: 0.00 b … 1.75 mb
  'npmcli/arborist'.loadActual()                  Avg: 8.36  b    Range: 0.00 b … 192.00 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 777.90 µs
'view-ignored'.browserScan(NPM, skipInternal) ┤ 681.38 µs
                     'view-ignored'.scan(NPM) ┤■ 1.55 ms
              'view-ignored'.browserScan(NPM) ┤■ 1.54 ms
           'view-ignored'.scan(NPM, inverted) ┤■ 1.55 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■ 1.51 ms
              'npm-packlist'(preparedArbTree) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 27.96 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■ 10.06 ms
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 129.43 ns
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.14x faster than 'view-ignored'.scan(NPM, skipInternal)
   2.22x faster than 'view-ignored'.browserScan(NPM, inverted)
   2.26x faster than 'view-ignored'.browserScan(NPM)
   2.28x faster than 'view-ignored'.scan(NPM, inverted)
   2.28x faster than 'view-ignored'.scan(NPM)
   14.76x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
   41.04x faster than 'npm-packlist'(preparedArbTree)

NPM Init benchmark
clk: ~3.32 GHz
cpu: Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz
runtime: bun 1.3.14 (x64-linux)

Memory Usage:
  'view-ignored'.NPM.init   Avg: 2.66 kb    Range: 0.00 b … 512.00 kb

                             ┌                                            ┐
     'view-ignored'.NPM.init ┤ 84.95 µs
                             └                                            ┘
```

<!-- BENCH_BUN_END -->

#### Low-end

<!-- BENCH_BUN_LOW_START -->

```txt
$ bun run --expose-gc benchmarks/git.js && bun run --expose-gc benchmarks/npm.js



Git target benchmark
clk: ~0.97 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.4.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(Git, skipInternal)          Avg: 88.38 kb   Range: 0.00 b … 596.00 kb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 79.70 kb   Range: 0.00 b … 1.22 mb
  'view-ignored'.scan(Git)                        Avg: 597.10 kb  Range: 36.00 kb … 2.79 mb
  'view-ignored'.browserScan(Git)                 Avg: 785.00 kb  Range: 112.00 kb … 7.05 mb
  'view-ignored'.scan(Git, inverted)              Avg: 1.41 mb    Range: 100.00 kb … 8.32 mb
  'view-ignored'.browserScan(Git, inverted)       Avg: 922.67 kb  Range: 32.00 kb … 2.93 mb
  'ignore-walk'.walk(.gitignore)                  Avg: 4.56 mb    Range: 1.20 mb … 8.97 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 2.46 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 2.29 ms
                     'view-ignored'.scan(Git) ┤■ 20.84 ms
              'view-ignored'.browserScan(Git) ┤■ 21.55 ms
           'view-ignored'.scan(Git, inverted) ┤■ 24.74 ms
    'view-ignored'.browserScan(Git, inverted) ┤■ 24.38 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 848.92 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.07x faster than 'view-ignored'.scan(Git, skipInternal)
   9.09x faster than 'view-ignored'.scan(Git)
   9.41x faster than 'view-ignored'.browserScan(Git)
   10.64x faster than 'view-ignored'.browserScan(Git, inverted)
   10.79x faster than 'view-ignored'.scan(Git, inverted)
   370.43x faster than 'ignore-walk'.walk(.gitignore)

NPM target benchmark
clk: ~0.98 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.4.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 115.68 kb  Range: 0.00 b … 1.27 mb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 67.16 kb   Range: 0.00 b … 364.00 kb
  'view-ignored'.scan(NPM)                        Avg: 2.18 mb    Range: 172.00 kb … 9.54 mb
  'view-ignored'.browserScan(NPM)                 Avg: 1.78 mb    Range: 132.00 kb … 8.72 mb
  'view-ignored'.scan(NPM, inverted)              Avg: 3.41 mb    Range: 1.27 mb … 10.40 mb
  'view-ignored'.browserScan(NPM, inverted)       Avg: 2.16 mb    Range: 440.00 kb … 5.94 mb
  'npm-packlist'(preparedArbTree)                 Avg: 1.11 mb    Range: 40.00 kb … 4.20 mb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 7.22 mb    Range: 272.00 kb … 10.83 mb
  'npmcli/arborist'.loadActual()                  Avg: 4.28  b    Range: 0.00 b … 155.00 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 2.56 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 2.14 ms
                     'view-ignored'.scan(NPM) ┤■■ 51.05 ms
              'view-ignored'.browserScan(NPM) ┤■■ 45.56 ms
           'view-ignored'.scan(NPM, inverted) ┤■■ 51.73 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■■ 49.96 ms
              'npm-packlist'(preparedArbTree) ┤■■■ 78.00 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 902.27 ms
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 203.39 ns
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.19x faster than 'view-ignored'.scan(NPM, skipInternal)
   21.27x faster than 'view-ignored'.browserScan(NPM)
   23.32x faster than 'view-ignored'.browserScan(NPM, inverted)
   23.83x faster than 'view-ignored'.scan(NPM)
   24.15x faster than 'view-ignored'.scan(NPM, inverted)
   36.41x faster than 'npm-packlist'(preparedArbTree)
   421.21x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```

<!-- BENCH_BUN_LOW_END -->

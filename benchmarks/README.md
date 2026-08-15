# `view-ignored` / benchmarks

### Node

<!-- BENCH_NODE_START -->

```txt
$ node --expose-gc benchmarks/git.js && node --expose-gc benchmarks/npm.js

Git target benchmark
clk: ~3.54 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: node 26.7.0 (x64-linux)

Memory Usage:
  'view-ignored'.scan(Git, skipInternal)          Avg: 285.42 kb  Range: 2.00 kb … 1.32 mb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 254.08 kb  Range: 42.84 kb … 1.26 mb
  'view-ignored'.scan(Git)                        Avg: 1.00 mb    Range: 186.78 kb … 2.28 mb
  'view-ignored'.browserScan(Git)                 Avg: 0.99 mb    Range: 555.69 kb … 1.31 mb
  'view-ignored'.scan(Git, inverted)              Avg: 1.09 mb    Range: 58.92 kb … 2.29 mb
  'view-ignored'.browserScan(Git, inverted)       Avg: 1.09 mb    Range: 512.72 kb … 2.47 mb
  'ignore-walk'.walk(.gitignore)                  Avg: 7.23 mb    Range: 4.06 mb … 10.17 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 1.04 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 996.62 µs
                     'view-ignored'.scan(Git) ┤■■■■■ 1.70 ms
              'view-ignored'.browserScan(Git) ┤■■■■■ 1.63 ms
           'view-ignored'.scan(Git, inverted) ┤■■■■■■ 1.79 ms
    'view-ignored'.browserScan(Git, inverted) ┤■■■■■■ 1.78 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 5.40 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.04x faster than 'view-ignored'.scan(Git, skipInternal)
   1.63x faster than 'view-ignored'.browserScan(Git)
   1.7x faster than 'view-ignored'.scan(Git)
   1.78x faster than 'view-ignored'.browserScan(Git, inverted)
   1.8x faster than 'view-ignored'.scan(Git, inverted)
   5.42x faster than 'ignore-walk'.walk(.gitignore)

Git Init benchmark
clk: ~3.55 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: node 26.7.0 (x64-linux)

Memory Usage:
  'view-ignored'.Git.init   Avg: 8.66 kb    Range: 1.40 kb … 695.13 kb

                             ┌                                            ┐
     'view-ignored'.Git.init ┤ 115.01 µs
                             └                                            ┘

NPM target benchmark
clk: ~3.55 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: node 26.7.0 (x64-linux)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 309.72 kb  Range: 688.00 b … 1.21 mb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 280.80 kb  Range: 9.55 kb … 1.03 mb
  'view-ignored'.scan(NPM)                        Avg: 736.52 kb  Range: 97.30 kb … 2.25 mb
  'view-ignored'.browserScan(NPM)                 Avg: 742.23 kb  Range: 135.61 kb … 2.18 mb
  'view-ignored'.scan(NPM, inverted)              Avg: 728.53 kb  Range: 119.39 kb … 1.92 mb
  'view-ignored'.browserScan(NPM, inverted)       Avg: 724.63 kb  Range: 28.94 kb … 1.49 mb
  'npm-packlist'(preparedArbTree)                 Avg: 80.21 kb   Range: 7.22 kb … 499.07 kb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 7.26 mb    Range: 5.79 mb … 8.83 mb
  'npmcli/arborist'.loadActual()                  Avg: 468.54  b  Range: 210.64 b … 730.38 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 788.29 µs
'view-ignored'.browserScan(NPM, skipInternal) ┤ 773.35 µs
                     'view-ignored'.scan(NPM) ┤■■ 1.67 ms
              'view-ignored'.browserScan(NPM) ┤■■ 1.75 ms
           'view-ignored'.scan(NPM, inverted) ┤■■ 1.67 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■■ 1.66 ms
              'npm-packlist'(preparedArbTree) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 17.81 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■ 5.61 ms
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 172.89 ns
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.02x faster than 'view-ignored'.scan(NPM, skipInternal)
   2.15x faster than 'view-ignored'.browserScan(NPM, inverted)
   2.16x faster than 'view-ignored'.scan(NPM, inverted)
   2.16x faster than 'view-ignored'.scan(NPM)
   2.26x faster than 'view-ignored'.browserScan(NPM)
   7.25x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
   23.04x faster than 'npm-packlist'(preparedArbTree)

NPM Init benchmark
clk: ~3.54 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: node 26.7.0 (x64-linux)

Memory Usage:
  'view-ignored'.NPM.init   Avg: 41.26 kb   Range: 248.00 b … 666.45 kb

                             ┌                                            ┐
     'view-ignored'.NPM.init ┤ 154.94 µs
                             └                                            ┘
```

<!-- BENCH_NODE_END -->

#### Low-end

<!-- BENCH_NODE_LOW_START -->

```txt
$ node --expose-gc benchmarks/git.js && node --expose-gc benchmarks/npm.js



Git target benchmark
clk: ~1.88 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.7.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(Git, skipInternal)          Avg: 333.37 kb  Range: 117.44 kb … 1.81 mb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 260.73 kb  Range: 64.26 kb … 920.10 kb
  'view-ignored'.scan(Git)                        Avg: 8.09 mb    Range: 6.24 mb … 10.66 mb
  'view-ignored'.browserScan(Git)                 Avg: 7.97 mb    Range: 6.28 mb … 9.67 mb
  'view-ignored'.scan(Git, inverted)              Avg: 9.48 mb    Range: 9.11 mb … 10.06 mb
  'view-ignored'.browserScan(Git, inverted)       Avg: 9.36 mb    Range: 9.27 mb … 9.42 mb
  'ignore-walk'.walk(.gitignore)                  Avg: 20.68 mb   Range: 20.04 mb … 22.76 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 2.86 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 2.63 ms
                     'view-ignored'.scan(Git) ┤■ 25.74 ms
              'view-ignored'.browserScan(Git) ┤■ 21.39 ms
           'view-ignored'.scan(Git, inverted) ┤■ 31.76 ms
    'view-ignored'.browserScan(Git, inverted) ┤■ 29.21 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 787.76 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.09x faster than 'view-ignored'.scan(Git, skipInternal)
   8.13x faster than 'view-ignored'.browserScan(Git)
   9.79x faster than 'view-ignored'.scan(Git)
   11.11x faster than 'view-ignored'.browserScan(Git, inverted)
   12.08x faster than 'view-ignored'.scan(Git, inverted)
   299.55x faster than 'ignore-walk'.walk(.gitignore)

NPM target benchmark
clk: ~1.85 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.7.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 359.48 kb  Range: 157.51 kb … 1.83 mb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 297.27 kb  Range: 89.56 kb … 813.59 kb
  'view-ignored'.scan(NPM)                        Avg: 11.19 mb   Range: 2.60 mb … 13.61 mb
  'view-ignored'.browserScan(NPM)                 Avg: 11.47 mb   Range: 4.19 mb … 13.39 mb
  'view-ignored'.scan(NPM, inverted)              Avg: 13.27 mb   Range: 11.63 mb … 13.77 mb
  'view-ignored'.browserScan(NPM, inverted)       Avg: 13.68 mb   Range: 13.65 mb … 13.76 mb
  'npm-packlist'(preparedArbTree)                 Avg: 7.29 mb    Range: 7.11 mb … 7.49 mb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 21.98 mb   Range: 21.38 mb … 23.99 mb
  'npmcli/arborist'.loadActual()                  Avg: 453.10  b  Range: 146.67 b … 730.44 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 3.37 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 3.12 ms
                     'view-ignored'.scan(NPM) ┤■■ 63.74 ms
              'view-ignored'.browserScan(NPM) ┤■■ 61.16 ms
           'view-ignored'.scan(NPM, inverted) ┤■■ 69.64 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■■ 62.79 ms
              'npm-packlist'(preparedArbTree) ┤■■■ 91.37 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 916.35 ms
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 358.63 ns
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.08x faster than 'view-ignored'.scan(NPM, skipInternal)
   19.61x faster than 'view-ignored'.browserScan(NPM)
   20.14x faster than 'view-ignored'.browserScan(NPM, inverted)
   20.44x faster than 'view-ignored'.scan(NPM)
   22.34x faster than 'view-ignored'.scan(NPM, inverted)
   29.3x faster than 'npm-packlist'(preparedArbTree)
   293.88x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```

<!-- BENCH_NODE_LOW_END -->

### Bun

<!-- BENCH_BUN_START -->

```txt
$ bun run --expose-gc benchmarks/git.js && bun run --expose-gc benchmarks/npm.js

Git target benchmark
clk: ~1.80 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: bun 1.3.14 (x64-linux)

Memory Usage:
  'view-ignored'.scan(Git, skipInternal)          Avg: 23.33 kb   Range: 0.00 b … 896.00 kb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 6.30 kb    Range: 0.00 b … 640.00 kb
  'view-ignored'.scan(Git)                        Avg: 23.71 kb   Range: 0.00 b … 1.00 mb
  'view-ignored'.browserScan(Git)                 Avg: 9.33 kb    Range: 0.00 b … 384.00 kb
  'view-ignored'.scan(Git, inverted)              Avg: 26.05 kb   Range: 0.00 b … 640.00 kb
  'view-ignored'.browserScan(Git, inverted)       Avg: 26.05 kb   Range: 0.00 b … 768.00 kb
  'ignore-walk'.walk(.gitignore)                  Avg: 126.65 kb  Range: 0.00 b … 2.63 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 577.00 µs
'view-ignored'.browserScan(Git, skipInternal) ┤ 521.28 µs
                     'view-ignored'.scan(Git) ┤■■■■ 1.20 ms
              'view-ignored'.browserScan(Git) ┤■■■ 1.17 ms
           'view-ignored'.scan(Git, inverted) ┤■■■■ 1.34 ms
    'view-ignored'.browserScan(Git, inverted) ┤■■■■ 1.33 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 6.91 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.11x faster than 'view-ignored'.scan(Git, skipInternal)
   2.24x faster than 'view-ignored'.browserScan(Git)
   2.31x faster than 'view-ignored'.scan(Git)
   2.55x faster than 'view-ignored'.browserScan(Git, inverted)
   2.58x faster than 'view-ignored'.scan(Git, inverted)
   13.25x faster than 'ignore-walk'.walk(.gitignore)

Git Init benchmark
clk: ~1.81 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: bun 1.3.14 (x64-linux)

Memory Usage:
  'view-ignored'.Git.init   Avg: 367.24  b  Range: 0.00 b … 256.00 kb

                             ┌                                            ┐
     'view-ignored'.Git.init ┤ 34.03 µs
                             └                                            ┘

NPM target benchmark
clk: ~1.81 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: bun 1.3.14 (x64-linux)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 16.67 kb   Range: 0.00 b … 896.00 kb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 4.74 kb    Range: 0.00 b … 512.00 kb
  'view-ignored'.scan(NPM)                        Avg: 14.37 kb   Range: 0.00 b … 768.00 kb
  'view-ignored'.browserScan(NPM)                 Avg: 5.06 kb    Range: 0.00 b … 256.00 kb
  'view-ignored'.scan(NPM, inverted)              Avg: 12.34 kb   Range: 0.00 b … 512.00 kb
  'view-ignored'.browserScan(NPM, inverted)       Avg: 8.77 kb    Range: 0.00 b … 384.00 kb
  'npm-packlist'(preparedArbTree)                 Avg: 217.19 kb  Range: 0.00 b … 1.25 mb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 145.71 kb  Range: 0.00 b … 1.88 mb
  'npmcli/arborist'.loadActual()                  Avg: 6.84  b    Range: 0.00 b … 192.00 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 574.56 µs
'view-ignored'.browserScan(NPM, skipInternal) ┤ 512.97 µs
                     'view-ignored'.scan(NPM) ┤■ 1.16 ms
              'view-ignored'.browserScan(NPM) ┤■ 1.13 ms
           'view-ignored'.scan(NPM, inverted) ┤■ 1.18 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■ 1.18 ms
              'npm-packlist'(preparedArbTree) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 20.22 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■ 7.27 ms
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 111.21 ns
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.12x faster than 'view-ignored'.scan(NPM, skipInternal)
   2.21x faster than 'view-ignored'.browserScan(NPM)
   2.26x faster than 'view-ignored'.scan(NPM)
   2.29x faster than 'view-ignored'.browserScan(NPM, inverted)
   2.31x faster than 'view-ignored'.scan(NPM, inverted)
   14.17x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
   39.42x faster than 'npm-packlist'(preparedArbTree)

NPM Init benchmark
clk: ~3.56 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: bun 1.3.14 (x64-linux)

Memory Usage:
  'view-ignored'.NPM.init   Avg: 2.29 kb    Range: 0.00 b … 640.00 kb

                             ┌                                            ┐
     'view-ignored'.NPM.init ┤ 67.77 µs
                             └                                            ┘
```

<!-- BENCH_BUN_END -->

#### Low-end

<!-- BENCH_BUN_LOW_START -->

```txt
$ bun run --expose-gc benchmarks/git.js && bun run --expose-gc benchmarks/npm.js



Git target benchmark
clk: ~0.90 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.4.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(Git, skipInternal)          Avg: 82.07 kb   Range: 0.00 b … 636.00 kb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 87.20 kb   Range: 0.00 b … 1.78 mb
  'view-ignored'.scan(Git)                        Avg: 820.00 kb  Range: 112.00 kb … 7.36 mb
  'view-ignored'.browserScan(Git)                 Avg: 536.69 kb  Range: 100.00 kb … 2.75 mb
  'view-ignored'.scan(Git, inverted)              Avg: 1.42 mb    Range: 24.00 kb … 9.52 mb
  'view-ignored'.browserScan(Git, inverted)       Avg: 1.21 mb    Range: 4.00 kb … 8.18 mb
  'ignore-walk'.walk(.gitignore)                  Avg: 3.23 mb    Range: 468.00 kb … 9.61 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 2.46 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 2.33 ms
                     'view-ignored'.scan(Git) ┤■ 19.89 ms
              'view-ignored'.browserScan(Git) ┤■ 20.42 ms
           'view-ignored'.scan(Git, inverted) ┤■ 24.31 ms
    'view-ignored'.browserScan(Git, inverted) ┤■ 23.55 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 843.83 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.05x faster than 'view-ignored'.scan(Git, skipInternal)
   8.52x faster than 'view-ignored'.scan(Git)
   8.74x faster than 'view-ignored'.browserScan(Git)
   10.08x faster than 'view-ignored'.browserScan(Git, inverted)
   10.41x faster than 'view-ignored'.scan(Git, inverted)
   361.39x faster than 'ignore-walk'.walk(.gitignore)

NPM target benchmark
clk: ~0.99 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.4.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 186.37 kb  Range: 0.00 b … 1.29 mb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 72.90 kb   Range: 0.00 b … 324.00 kb
  'view-ignored'.scan(NPM)                        Avg: 1.22 mb    Range: 192.00 kb … 8.76 mb
  'view-ignored'.browserScan(NPM)                 Avg: 1.43 mb    Range: 144.00 kb … 9.09 mb
  'view-ignored'.scan(NPM, inverted)              Avg: 2.96 mb    Range: 716.00 kb … 11.07 mb
  'view-ignored'.browserScan(NPM, inverted)       Avg: 2.58 mb    Range: 144.00 kb … 9.53 mb
  'npm-packlist'(preparedArbTree)                 Avg: 1.09 mb    Range: 152.00 kb … 4.49 mb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 6.79 mb    Range: 936.00 kb … 11.74 mb
  'npmcli/arborist'.loadActual()                  Avg: 4.82  b    Range: 0.00 b … 181.00 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 2.58 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 2.18 ms
                     'view-ignored'.scan(NPM) ┤■■ 48.59 ms
              'view-ignored'.browserScan(NPM) ┤■■ 48.69 ms
           'view-ignored'.scan(NPM, inverted) ┤■■ 50.64 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■■ 52.15 ms
              'npm-packlist'(preparedArbTree) ┤■■■ 77.17 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 911.11 ms
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 199.51 ns
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.18x faster than 'view-ignored'.scan(NPM, skipInternal)
   22.34x faster than 'view-ignored'.scan(NPM)
   22.38x faster than 'view-ignored'.browserScan(NPM)
   23.28x faster than 'view-ignored'.scan(NPM, inverted)
   23.98x faster than 'view-ignored'.browserScan(NPM, inverted)
   35.48x faster than 'npm-packlist'(preparedArbTree)
   418.85x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```

<!-- BENCH_BUN_LOW_END -->

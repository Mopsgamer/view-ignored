# `view-ignored` / benchmarks

### Node

<!-- BENCH_NODE_START -->

```txt
$ node --expose-gc benchmarks/git.js && node --expose-gc benchmarks/npm.js

Git target benchmark
clk: ~3.07 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: node 26.7.0 (x64-linux)

Memory Usage:
  'view-ignored'.scan(Git, skipInternal)          Avg: 274.33 kb  Range: 38.88 kb … 1.45 mb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 270.19 kb  Range: 10.24 kb … 1.90 mb
  'view-ignored'.scan(Git)                        Avg: 1.03 mb    Range: 295.74 kb … 2.23 mb
  'view-ignored'.browserScan(Git)                 Avg: 1.01 mb    Range: 162.41 kb … 1.61 mb
  'view-ignored'.scan(Git, inverted)              Avg: 1.10 mb    Range: 564.42 kb … 1.60 mb
  'view-ignored'.browserScan(Git, inverted)       Avg: 1.10 mb    Range: 594.03 kb … 1.47 mb
  'ignore-walk'.walk(.gitignore)                  Avg: 12.15 mb   Range: 11.79 mb … 12.76 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 1.66 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 1.59 ms
                     'view-ignored'.scan(Git) ┤■■■ 2.59 ms
              'view-ignored'.browserScan(Git) ┤■■■ 2.52 ms
           'view-ignored'.scan(Git, inverted) ┤■■■■ 2.75 ms
    'view-ignored'.browserScan(Git, inverted) ┤■■■■ 2.91 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 12.73 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.04x faster than 'view-ignored'.scan(Git, skipInternal)
   1.58x faster than 'view-ignored'.browserScan(Git)
   1.63x faster than 'view-ignored'.scan(Git)
   1.73x faster than 'view-ignored'.scan(Git, inverted)
   1.83x faster than 'view-ignored'.browserScan(Git, inverted)
   8.01x faster than 'ignore-walk'.walk(.gitignore)

Git Init benchmark
clk: ~3.09 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: node 26.7.0 (x64-linux)

Memory Usage:
  'view-ignored'.Git.init   Avg: 8.76 kb    Range: 904.00 b … 291.85 kb

                             ┌                                            ┐
     'view-ignored'.Git.init ┤ 182.78 µs
                             └                                            ┘

NPM target benchmark
clk: ~3.08 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: node 26.7.0 (x64-linux)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 250.09 kb  Range: 760.00 b … 957.84 kb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 240.81 kb  Range: 2.20 kb … 1.41 mb
  'view-ignored'.scan(NPM)                        Avg: 620.41 kb  Range: 311.45 kb … 1.83 mb
  'view-ignored'.browserScan(NPM)                 Avg: 624.49 kb  Range: 15.94 kb … 2.41 mb
  'view-ignored'.scan(NPM, inverted)              Avg: 630.56 kb  Range: 1.94 kb … 1.12 mb
  'view-ignored'.browserScan(NPM, inverted)       Avg: 623.62 kb  Range: 123.66 kb … 1.48 mb
  'npm-packlist'(preparedArbTree)                 Avg: 394.80 kb  Range: 9.32 kb … 4.90 mb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 12.22 mb   Range: 12.12 mb … 12.61 mb
  'npmcli/arborist'.loadActual()                  Avg: 466.02  b  Range: 162.64 b … 725.96 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 1.18 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 1.14 ms
                     'view-ignored'.scan(NPM) ┤■■ 2.66 ms
              'view-ignored'.browserScan(NPM) ┤■■ 2.63 ms
           'view-ignored'.scan(NPM, inverted) ┤■■ 2.63 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■■ 2.65 ms
              'npm-packlist'(preparedArbTree) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 28.75 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■ 13.17 ms
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 198.02 ns
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.04x faster than 'view-ignored'.scan(NPM, skipInternal)
   2.3x faster than 'view-ignored'.scan(NPM, inverted)
   2.31x faster than 'view-ignored'.browserScan(NPM)
   2.33x faster than 'view-ignored'.browserScan(NPM, inverted)
   2.33x faster than 'view-ignored'.scan(NPM)
   11.55x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
   25.19x faster than 'npm-packlist'(preparedArbTree)

NPM Init benchmark
clk: ~3.08 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: node 26.7.0 (x64-linux)

Memory Usage:
  'view-ignored'.NPM.init   Avg: 40.08 kb   Range: 6.89 kb … 922.80 kb

                             ┌                                            ┐
     'view-ignored'.NPM.init ┤ 237.44 µs
                             └                                            ┘
```

<!-- BENCH_NODE_END -->

#### Low-end

<!-- BENCH_NODE_LOW_START -->
```txt
$ node --expose-gc benchmarks/git.js && node --expose-gc benchmarks/npm.js



Git target benchmark
clk: ~1.85 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.7.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(Git, skipInternal)          Avg: 304.85 kb  Range: 1.48 kb … 2.35 mb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 261.70 kb  Range: 1.89 kb … 2.36 mb
  'view-ignored'.scan(Git)                        Avg: 8.20 mb    Range: 6.07 mb … 10.90 mb
  'view-ignored'.browserScan(Git)                 Avg: 8.13 mb    Range: 8.10 mb … 8.21 mb
  'view-ignored'.scan(Git, inverted)              Avg: 9.49 mb    Range: 9.47 mb … 9.52 mb
  'view-ignored'.browserScan(Git, inverted)       Avg: 9.49 mb    Range: 9.47 mb … 9.52 mb
  'ignore-walk'.walk(.gitignore)                  Avg: 19.36 mb   Range: 18.96 mb … 20.52 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 3.41 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 2.97 ms
                     'view-ignored'.scan(Git) ┤ 23.71 ms
              'view-ignored'.browserScan(Git) ┤ 20.85 ms
           'view-ignored'.scan(Git, inverted) ┤■ 32.40 ms
    'view-ignored'.browserScan(Git, inverted) ┤■ 31.76 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 1.61 s
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.15x faster than 'view-ignored'.scan(Git, skipInternal)
   7.03x faster than 'view-ignored'.browserScan(Git)
   8x faster than 'view-ignored'.scan(Git)
   10.71x faster than 'view-ignored'.browserScan(Git, inverted)
   10.93x faster than 'view-ignored'.scan(Git, inverted)
   543.42x faster than 'ignore-walk'.walk(.gitignore)

NPM target benchmark
clk: ~1.59 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.7.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 271.40 kb  Range: 95.53 kb … 1.76 mb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 259.19 kb  Range: 157.05 kb … 1.39 mb
  'view-ignored'.scan(NPM)                        Avg: 9.86 mb    Range: 9.77 mb … 10.37 mb
  'view-ignored'.browserScan(NPM)                 Avg: 8.72 mb    Range: 1.01 mb … 10.32 mb
  'view-ignored'.scan(NPM, inverted)              Avg: 10.65 mb   Range: 10.62 mb … 10.71 mb
  'view-ignored'.browserScan(NPM, inverted)       Avg: 10.66 mb   Range: 10.64 mb … 10.70 mb
  'npm-packlist'(preparedArbTree)                 Avg: 11.34 mb   Range: 10.06 mb … 16.15 mb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 20.57 mb   Range: 20.20 mb … 22.12 mb
  'npmcli/arborist'.loadActual()                  Avg: 448.18  b  Range: 59.58 b … 757.37 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 3.94 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 3.67 ms
                     'view-ignored'.scan(NPM) ┤■ 66.75 ms
              'view-ignored'.browserScan(NPM) ┤■ 69.39 ms
           'view-ignored'.scan(NPM, inverted) ┤■■ 78.68 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■ 76.34 ms
              'npm-packlist'(preparedArbTree) ┤■■■ 127.88 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 1.69 s
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 422.42 ns
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.07x faster than 'view-ignored'.scan(NPM, skipInternal)
   18.19x faster than 'view-ignored'.scan(NPM)
   18.91x faster than 'view-ignored'.browserScan(NPM)
   20.8x faster than 'view-ignored'.browserScan(NPM, inverted)
   21.44x faster than 'view-ignored'.scan(NPM, inverted)
   34.84x faster than 'npm-packlist'(preparedArbTree)
   460.52x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```
<!-- BENCH_NODE_LOW_END -->

### Bun

<!-- BENCH_BUN_START -->

```txt
$ bun run --expose-gc benchmarks/git.js && bun run --expose-gc benchmarks/npm.js

Git target benchmark
clk: ~3.08 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: bun 1.4.0 (x64-linux)

Memory Usage:
  'view-ignored'.scan(Git, skipInternal)          Avg: 41.33 kb   Range: 0.00 b … 640.00 kb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 10.46 kb   Range: 0.00 b … 512.00 kb
  'view-ignored'.scan(Git)                        Avg: 35.82 kb   Range: 0.00 b … 1.00 mb
  'view-ignored'.browserScan(Git)                 Avg: 23.86 kb   Range: 0.00 b … 896.00 kb
  'view-ignored'.scan(Git, inverted)              Avg: 29.62 kb   Range: 0.00 b … 1.13 mb
  'view-ignored'.browserScan(Git, inverted)       Avg: 23.64 kb   Range: 0.00 b … 1.00 mb
  'ignore-walk'.walk(.gitignore)                  Avg: 219.36 kb  Range: 0.00 b … 3.63 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 846.30 µs
'view-ignored'.browserScan(Git, skipInternal) ┤ 805.33 µs
                     'view-ignored'.scan(Git) ┤■■■ 1.68 ms
              'view-ignored'.browserScan(Git) ┤■■■ 1.67 ms
           'view-ignored'.scan(Git, inverted) ┤■■■ 1.82 ms
    'view-ignored'.browserScan(Git, inverted) ┤■■■ 1.83 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 11.41 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.05x faster than 'view-ignored'.scan(Git, skipInternal)
   2.08x faster than 'view-ignored'.browserScan(Git)
   2.08x faster than 'view-ignored'.scan(Git)
   2.26x faster than 'view-ignored'.scan(Git, inverted)
   2.27x faster than 'view-ignored'.browserScan(Git, inverted)
   14.17x faster than 'ignore-walk'.walk(.gitignore)

Git Init benchmark
clk: ~1.58 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: bun 1.4.0 (x64-linux)

Memory Usage:
  'view-ignored'.Git.init   Avg: 1.30 kb    Range: 0.00 b … 128.00 kb

                             ┌                                            ┐
     'view-ignored'.Git.init ┤ 57.28 µs
                             └                                            ┘

NPM target benchmark
clk: ~3.07 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: bun 1.4.0 (x64-linux)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 38.09 kb   Range: 0.00 b … 1.00 mb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 959.73  b  Range: 0.00 b … 128.00 kb
  'view-ignored'.scan(NPM)                        Avg: 1.55 kb    Range: 0.00 b … 256.00 kb
  'view-ignored'.browserScan(NPM)                 Avg: 0.00  b    Range: 0.00 b … 0.00 b
  'view-ignored'.scan(NPM, inverted)              Avg: 0.00  b    Range: 0.00 b … 0.00 b
  'view-ignored'.browserScan(NPM, inverted)       Avg: 327.68  b  Range: 0.00 b … 128.00 kb
  'npm-packlist'(preparedArbTree)                 Avg: 10.67 kb   Range: 0.00 b … 128.00 kb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 4.41 kb    Range: 0.00 b … 128.00 kb
  'npmcli/arborist'.loadActual()                  Avg: 3.70  b    Range: 0.00 b … 96.00 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 759.93 µs
'view-ignored'.browserScan(NPM, skipInternal) ┤ 710.94 µs
                     'view-ignored'.scan(NPM) ┤■ 1.68 ms
              'view-ignored'.browserScan(NPM) ┤■ 1.67 ms
           'view-ignored'.scan(NPM, inverted) ┤■ 1.73 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■ 1.73 ms
              'npm-packlist'(preparedArbTree) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 29.56 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■ 12.28 ms
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 114.48 ns
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.07x faster than 'view-ignored'.scan(NPM, skipInternal)
   2.35x faster than 'view-ignored'.browserScan(NPM)
   2.37x faster than 'view-ignored'.scan(NPM)
   2.43x faster than 'view-ignored'.browserScan(NPM, inverted)
   2.44x faster than 'view-ignored'.scan(NPM, inverted)
   17.28x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
   41.57x faster than 'npm-packlist'(preparedArbTree)

NPM Init benchmark
clk: ~3.09 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: bun 1.4.0 (x64-linux)

Memory Usage:
  'view-ignored'.NPM.init   Avg: 2.34 kb    Range: 0.00 b … 384.00 kb

                             ┌                                            ┐
     'view-ignored'.NPM.init ┤ 105.74 µs
                             └                                            ┘
```

<!-- BENCH_BUN_END -->

#### Low-end

<!-- BENCH_BUN_LOW_START -->
```txt
$ bun run --expose-gc benchmarks/git.js && bun run --expose-gc benchmarks/npm.js



Git target benchmark
clk: ~0.84 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.4.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(Git, skipInternal)          Avg: 82.64 kb   Range: 0.00 b … 592.00 kb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 72.79 kb   Range: 0.00 b … 544.00 kb
  'view-ignored'.scan(Git)                        Avg: 611.68 kb  Range: 12.00 kb … 3.67 mb
  'view-ignored'.browserScan(Git)                 Avg: 854.55 kb  Range: 132.00 kb … 6.89 mb
  'view-ignored'.scan(Git, inverted)              Avg: 1.68 mb    Range: 60.00 kb … 7.71 mb
  'view-ignored'.browserScan(Git, inverted)       Avg: 1.62 mb    Range: 0.00 b … 8.57 mb
  'ignore-walk'.walk(.gitignore)                  Avg: 3.27 mb    Range: 200.00 kb … 9.49 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 2.71 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 2.68 ms
                     'view-ignored'.scan(Git) ┤■ 24.79 ms
              'view-ignored'.browserScan(Git) ┤■ 25.37 ms
           'view-ignored'.scan(Git, inverted) ┤■ 31.10 ms
    'view-ignored'.browserScan(Git, inverted) ┤■ 29.27 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 1.29 s
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.01x faster than 'view-ignored'.scan(Git, skipInternal)
   9.26x faster than 'view-ignored'.scan(Git)
   9.48x faster than 'view-ignored'.browserScan(Git)
   10.93x faster than 'view-ignored'.browserScan(Git, inverted)
   11.62x faster than 'view-ignored'.scan(Git, inverted)
   481.79x faster than 'ignore-walk'.walk(.gitignore)

NPM target benchmark
clk: ~0.84 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.4.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 135.18 kb  Range: 0.00 b … 940.00 kb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 123.31 kb  Range: 0.00 b … 304.00 kb
  'view-ignored'.scan(NPM)                        Avg: 1.98 mb    Range: 984.00 kb … 6.68 mb
  'view-ignored'.browserScan(NPM)                 Avg: 3.19 mb    Range: 644.00 kb … 7.85 mb
  'view-ignored'.scan(NPM, inverted)              Avg: 3.65 mb    Range: 248.00 kb … 9.97 mb
  'view-ignored'.browserScan(NPM, inverted)       Avg: 5.64 mb    Range: 944.00 kb … 9.36 mb
  'npm-packlist'(preparedArbTree)                 Avg: 8.86 mb    Range: 324.00 kb … 17.09 mb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 8.82 mb    Range: 3.96 mb … 15.68 mb
  'npmcli/arborist'.loadActual()                  Avg: 22.93  b   Range: 0.00 b … 141.00 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 2.90 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 3.42 ms
                     'view-ignored'.scan(NPM) ┤■ 64.22 ms
              'view-ignored'.browserScan(NPM) ┤■ 66.17 ms
           'view-ignored'.scan(NPM, inverted) ┤■ 69.14 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■■ 73.58 ms
              'npm-packlist'(preparedArbTree) ┤■■ 115.74 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 1.57 s
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 266.23 ns
                                              └                                            ┘

summary
  'view-ignored'.scan(NPM, skipInternal)
   1.18x faster than 'view-ignored'.browserScan(NPM, skipInternal)
   22.14x faster than 'view-ignored'.scan(NPM)
   22.82x faster than 'view-ignored'.browserScan(NPM)
   23.84x faster than 'view-ignored'.scan(NPM, inverted)
   25.37x faster than 'view-ignored'.browserScan(NPM, inverted)
   39.91x faster than 'npm-packlist'(preparedArbTree)
   541.37x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```
<!-- BENCH_BUN_LOW_END -->

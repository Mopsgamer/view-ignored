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
clk: ~1.95 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.7.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(Git, skipInternal)          Avg: 313.25 kb  Range: 21.70 kb … 2.22 mb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 255.41 kb  Range: 52.05 kb … 761.80 kb
  'view-ignored'.scan(Git)                        Avg: 8.10 mb    Range: 6.92 mb … 9.53 mb
  'view-ignored'.browserScan(Git)                 Avg: 8.04 mb    Range: 7.69 mb … 8.32 mb
  'view-ignored'.scan(Git, inverted)              Avg: 9.44 mb    Range: 9.40 mb … 9.51 mb
  'view-ignored'.browserScan(Git, inverted)       Avg: 9.43 mb    Range: 9.40 mb … 9.47 mb
  'ignore-walk'.walk(.gitignore)                  Avg: 14.87 mb   Range: 14.33 mb … 15.63 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 3.08 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 2.87 ms
                     'view-ignored'.scan(Git) ┤■ 22.19 ms
              'view-ignored'.browserScan(Git) ┤■ 22.12 ms
           'view-ignored'.scan(Git, inverted) ┤■ 30.31 ms
    'view-ignored'.browserScan(Git, inverted) ┤■ 29.17 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 1.19 s
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.08x faster than 'view-ignored'.scan(Git, skipInternal)
   7.72x faster than 'view-ignored'.browserScan(Git)
   7.74x faster than 'view-ignored'.scan(Git)
   10.18x faster than 'view-ignored'.browserScan(Git, inverted)
   10.57x faster than 'view-ignored'.scan(Git, inverted)
   416.78x faster than 'ignore-walk'.walk(.gitignore)

NPM target benchmark
clk: ~1.81 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.7.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 277.06 kb  Range: 88.98 kb … 1.57 mb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 263.63 kb  Range: 127.01 kb … 1.34 mb
  'view-ignored'.scan(NPM)                        Avg: 9.84 mb    Range: 9.69 mb … 10.35 mb
  'view-ignored'.browserScan(NPM)                 Avg: 9.81 mb    Range: 9.69 mb … 10.23 mb
  'view-ignored'.scan(NPM, inverted)              Avg: 9.40 mb    Range: 747.50 kb … 10.79 mb
  'view-ignored'.browserScan(NPM, inverted)       Avg: 10.57 mb   Range: 10.53 mb … 10.65 mb
  'npm-packlist'(preparedArbTree)                 Avg: 11.46 mb   Range: 10.12 mb … 16.21 mb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 16.74 mb   Range: 16.12 mb … 18.79 mb
  'npmcli/arborist'.loadActual()                  Avg: 452.35  b  Range: 90.23 b … 738.42 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 3.21 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 2.92 ms
                     'view-ignored'.scan(NPM) ┤■ 55.45 ms
              'view-ignored'.browserScan(NPM) ┤■ 57.87 ms
           'view-ignored'.scan(NPM, inverted) ┤■■ 64.94 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■ 57.57 ms
              'npm-packlist'(preparedArbTree) ┤■■ 90.27 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 1.28 s
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 367.85 ns
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.1x faster than 'view-ignored'.scan(NPM, skipInternal)
   19.02x faster than 'view-ignored'.scan(NPM)
   19.74x faster than 'view-ignored'.browserScan(NPM, inverted)
   19.85x faster than 'view-ignored'.browserScan(NPM)
   22.27x faster than 'view-ignored'.scan(NPM, inverted)
   30.96x faster than 'npm-packlist'(preparedArbTree)
   439.74x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
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
clk: ~0.92 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.4.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(Git, skipInternal)          Avg: 77.38 kb   Range: 0.00 b … 500.00 kb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 68.24 kb   Range: 0.00 b … 484.00 kb
  'view-ignored'.scan(Git)                        Avg: 606.48 kb  Range: 32.00 kb … 1.84 mb
  'view-ignored'.browserScan(Git)                 Avg: 474.93 kb  Range: 0.00 b … 1.55 mb
  'view-ignored'.scan(Git, inverted)              Avg: 1.02 mb    Range: 64.00 kb … 2.75 mb
  'view-ignored'.browserScan(Git, inverted)       Avg: 738.72 kb  Range: 0.00 b … 3.30 mb
  'ignore-walk'.walk(.gitignore)                  Avg: 2.52 mb    Range: 892.00 kb … 6.05 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 2.22 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 2.27 ms
                     'view-ignored'.scan(Git) ┤■ 20.96 ms
              'view-ignored'.browserScan(Git) ┤■ 19.50 ms
           'view-ignored'.scan(Git, inverted) ┤■ 23.87 ms
    'view-ignored'.browserScan(Git, inverted) ┤■ 23.27 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 988.89 ms
                                              └                                            ┘

summary
  'view-ignored'.scan(Git, skipInternal)
   1.02x faster than 'view-ignored'.browserScan(Git, skipInternal)
   8.77x faster than 'view-ignored'.browserScan(Git)
   9.42x faster than 'view-ignored'.scan(Git)
   10.47x faster than 'view-ignored'.browserScan(Git, inverted)
   10.73x faster than 'view-ignored'.scan(Git, inverted)
   444.65x faster than 'ignore-walk'.walk(.gitignore)

NPM target benchmark
clk: ~0.96 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.4.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 139.34 kb  Range: 0.00 b … 1.79 mb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 109.48 kb  Range: 0.00 b … 308.00 kb
  'view-ignored'.scan(NPM)                        Avg: 3.56 mb    Range: 212.00 kb … 8.86 mb
  'view-ignored'.browserScan(NPM)                 Avg: 3.13 mb    Range: 148.00 kb … 8.40 mb
  'view-ignored'.scan(NPM, inverted)              Avg: 4.90 mb    Range: 176.00 kb … 10.12 mb
  'view-ignored'.browserScan(NPM, inverted)       Avg: 5.80 mb    Range: 1.52 mb … 10.16 mb
  'npm-packlist'(preparedArbTree)                 Avg: 1.33 mb    Range: 20.00 kb … 5.16 mb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 9.23 mb    Range: 1.36 mb … 16.26 mb
  'npmcli/arborist'.loadActual()                  Avg: 18.91  b   Range: 0.00 b … 128.00 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 2.65 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 3.52 ms
                     'view-ignored'.scan(NPM) ┤■■ 56.31 ms
              'view-ignored'.browserScan(NPM) ┤■■ 60.68 ms
           'view-ignored'.scan(NPM, inverted) ┤■■■ 95.24 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■■ 59.67 ms
              'npm-packlist'(preparedArbTree) ┤■■■ 87.81 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 1.12 s
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 223.35 ns
                                              └                                            ┘

summary
  'view-ignored'.scan(NPM, skipInternal)
   1.33x faster than 'view-ignored'.browserScan(NPM, skipInternal)
   21.25x faster than 'view-ignored'.scan(NPM)
   22.52x faster than 'view-ignored'.browserScan(NPM, inverted)
   22.9x faster than 'view-ignored'.browserScan(NPM)
   33.14x faster than 'npm-packlist'(preparedArbTree)
   35.94x faster than 'view-ignored'.scan(NPM, inverted)
   423.81x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```

<!-- BENCH_BUN_LOW_END -->

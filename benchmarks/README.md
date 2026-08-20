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
  'view-ignored'.scan(Git, skipInternal)          Avg: 270.68 kb  Range: 38.88 kb … 1.63 mb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 267.34 kb  Range: 696.00 b … 1.85 mb
  'view-ignored'.scan(Git)                        Avg: 1.03 mb    Range: 278.17 kb … 1.70 mb
  'view-ignored'.browserScan(Git)                 Avg: 1.01 mb    Range: 404.20 kb … 1.61 mb
  'view-ignored'.scan(Git, inverted)              Avg: 1.10 mb    Range: 1.08 mb … 1.13 mb
  'view-ignored'.browserScan(Git, inverted)       Avg: 1.10 mb    Range: 657.70 kb … 1.58 mb
  'ignore-walk'.walk(.gitignore)                  Avg: 12.18 mb   Range: 12.12 mb … 12.92 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 1.53 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 1.45 ms
                     'view-ignored'.scan(Git) ┤■■■ 2.41 ms
              'view-ignored'.browserScan(Git) ┤■■■ 2.37 ms
           'view-ignored'.scan(Git, inverted) ┤■■■ 2.61 ms
    'view-ignored'.browserScan(Git, inverted) ┤■■■ 2.60 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 13.44 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.05x faster than 'view-ignored'.scan(Git, skipInternal)
   1.63x faster than 'view-ignored'.browserScan(Git)
   1.66x faster than 'view-ignored'.scan(Git)
   1.79x faster than 'view-ignored'.browserScan(Git, inverted)
   1.8x faster than 'view-ignored'.scan(Git, inverted)
   9.27x faster than 'ignore-walk'.walk(.gitignore)

Git Init benchmark
clk: ~3.08 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: node 26.7.0 (x64-linux)

Memory Usage:
  'view-ignored'.Git.init   Avg: 8.99 kb    Range: 904.00 b … 533.34 kb

                             ┌                                            ┐
     'view-ignored'.Git.init ┤ 165.43 µs
                             └                                            ┘

NPM target benchmark
clk: ~3.08 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: node 26.7.0 (x64-linux)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 251.44 kb  Range: 1.96 kb … 1.06 mb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 242.23 kb  Range: 36.06 kb … 1.15 mb
  'view-ignored'.scan(NPM)                        Avg: 612.57 kb  Range: 216.16 kb … 1.40 mb
  'view-ignored'.browserScan(NPM)                 Avg: 624.60 kb  Range: 246.83 kb … 1.98 mb
  'view-ignored'.scan(NPM, inverted)              Avg: 629.44 kb  Range: 159.91 kb … 1.24 mb
  'view-ignored'.browserScan(NPM, inverted)       Avg: 629.49 kb  Range: 117.97 kb … 2.03 mb
  'npm-packlist'(preparedArbTree)                 Avg: 744.20 kb  Range: 304.00 b … 4.83 mb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 12.23 mb   Range: 12.16 mb … 12.85 mb
  'npmcli/arborist'.loadActual()                  Avg: 466.15  b  Range: 46.58 b … 750.36 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 1.11 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 1.07 ms
                     'view-ignored'.scan(NPM) ┤■■ 2.54 ms
              'view-ignored'.browserScan(NPM) ┤■■ 2.47 ms
           'view-ignored'.scan(NPM, inverted) ┤■■ 2.49 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■■ 2.43 ms
              'npm-packlist'(preparedArbTree) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 28.56 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■ 13.08 ms
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 199.30 ns
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.04x faster than 'view-ignored'.scan(NPM, skipInternal)
   2.27x faster than 'view-ignored'.browserScan(NPM, inverted)
   2.32x faster than 'view-ignored'.browserScan(NPM)
   2.33x faster than 'view-ignored'.scan(NPM, inverted)
   2.38x faster than 'view-ignored'.scan(NPM)
   12.25x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
   26.75x faster than 'npm-packlist'(preparedArbTree)

NPM Init benchmark
clk: ~3.09 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: node 26.7.0 (x64-linux)

Memory Usage:
  'view-ignored'.NPM.init   Avg: 39.88 kb   Range: 6.89 kb … 744.70 kb

                             ┌                                            ┐
     'view-ignored'.NPM.init ┤ 216.86 µs
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
clk: ~3.11 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: bun 1.3.14 (x64-linux)

Memory Usage:
  'view-ignored'.scan(Git, skipInternal)          Avg: 15.81 kb   Range: 0.00 b … 384.00 kb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 5.10 kb    Range: 0.00 b … 384.00 kb
  'view-ignored'.scan(Git)                        Avg: 19.25 kb   Range: 0.00 b … 896.00 kb
  'view-ignored'.browserScan(Git)                 Avg: 9.45 kb    Range: 0.00 b … 640.00 kb
  'view-ignored'.scan(Git, inverted)              Avg: 38.90 kb   Range: 0.00 b … 768.00 kb
  'view-ignored'.browserScan(Git, inverted)       Avg: 28.02 kb   Range: 0.00 b … 512.00 kb
  'ignore-walk'.walk(.gitignore)                  Avg: 178.09 kb  Range: 0.00 b … 2.38 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 797.88 µs
'view-ignored'.browserScan(Git, skipInternal) ┤ 754.62 µs
                     'view-ignored'.scan(Git) ┤■■ 1.64 ms
              'view-ignored'.browserScan(Git) ┤■■ 1.63 ms
           'view-ignored'.scan(Git, inverted) ┤■■■ 1.88 ms
    'view-ignored'.browserScan(Git, inverted) ┤■■■ 1.85 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 13.38 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.06x faster than 'view-ignored'.scan(Git, skipInternal)
   2.16x faster than 'view-ignored'.browserScan(Git)
   2.17x faster than 'view-ignored'.scan(Git)
   2.45x faster than 'view-ignored'.browserScan(Git, inverted)
   2.49x faster than 'view-ignored'.scan(Git, inverted)
   17.73x faster than 'ignore-walk'.walk(.gitignore)

Git Init benchmark
clk: ~1.57 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: bun 1.3.14 (x64-linux)

Memory Usage:
  'view-ignored'.Git.init   Avg: 569.07  b  Range: 0.00 b … 128.00 kb

                             ┌                                            ┐
     'view-ignored'.Git.init ┤ 50.63 µs
                             └                                            ┘

NPM target benchmark
clk: ~3.06 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: bun 1.3.14 (x64-linux)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 17.86 kb   Range: 0.00 b … 768.00 kb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 7.08 kb    Range: 0.00 b … 512.00 kb
  'view-ignored'.scan(NPM)                        Avg: 17.99 kb   Range: 0.00 b … 1.25 mb
  'view-ignored'.browserScan(NPM)                 Avg: 5.87 kb    Range: 0.00 b … 256.00 kb
  'view-ignored'.scan(NPM, inverted)              Avg: 19.41 kb   Range: 0.00 b … 256.00 kb
  'view-ignored'.browserScan(NPM, inverted)       Avg: 22.71 kb   Range: 0.00 b … 640.00 kb
  'npm-packlist'(preparedArbTree)                 Avg: 161.47 kb  Range: 0.00 b … 1.00 mb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 190.86 kb  Range: 0.00 b … 1.88 mb
  'npmcli/arborist'.loadActual()                  Avg: 9.07  b    Range: 0.00 b … 288.00 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 743.99 µs
'view-ignored'.browserScan(NPM, skipInternal) ┤ 692.05 µs
                     'view-ignored'.scan(NPM) ┤■ 1.59 ms
              'view-ignored'.browserScan(NPM) ┤■ 1.57 ms
           'view-ignored'.scan(NPM, inverted) ┤■ 1.62 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■ 1.65 ms
              'npm-packlist'(preparedArbTree) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 29.15 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■ 14.11 ms
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 132.72 ns
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.08x faster than 'view-ignored'.scan(NPM, skipInternal)
   2.27x faster than 'view-ignored'.browserScan(NPM)
   2.29x faster than 'view-ignored'.scan(NPM)
   2.35x faster than 'view-ignored'.scan(NPM, inverted)
   2.39x faster than 'view-ignored'.browserScan(NPM, inverted)
   20.38x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
   42.12x faster than 'npm-packlist'(preparedArbTree)

NPM Init benchmark
clk: ~3.10 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: bun 1.3.14 (x64-linux)

Memory Usage:
  'view-ignored'.NPM.init   Avg: 3.44 kb    Range: 0.00 b … 2.75 mb

                             ┌                                            ┐
     'view-ignored'.NPM.init ┤ 98.08 µs
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

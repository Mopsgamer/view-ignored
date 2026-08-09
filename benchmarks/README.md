# `view-ignored` / benchmarks

### Node

<!-- BENCH_NODE_START -->

```txt
$ node --expose-gc benchmarks/git.js && node --expose-gc benchmarks/npm.js

Git target benchmark
clk: ~3.09 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: node 26.7.0 (x64-linux)

Memory Usage:
  'view-ignored'.scan(Git, skipInternal)          Avg: 377.66 kb  Range: 10.64 kb … 3.43 mb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 340.90 kb  Range: 35.23 kb … 1.41 mb
  'view-ignored'.scan(Git)                        Avg: 1.45 mb    Range: 41.40 kb … 2.98 mb
  'view-ignored'.browserScan(Git)                 Avg: 1.42 mb    Range: 118.95 kb … 3.09 mb
  'view-ignored'.scan(Git, inverted)              Avg: 1.53 mb    Range: 316.30 kb … 2.85 mb
  'view-ignored'.browserScan(Git, inverted)       Avg: 1.53 mb    Range: 428.79 kb … 3.50 mb
  'ignore-walk'.walk(.gitignore)                  Avg: 7.18 mb    Range: 5.67 mb … 8.52 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 1.66 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 1.57 ms
                     'view-ignored'.scan(Git) ┤■■■■■■■ 2.92 ms
              'view-ignored'.browserScan(Git) ┤■■■■■■■ 2.91 ms
           'view-ignored'.scan(Git, inverted) ┤■■■■■■■■ 3.13 ms
    'view-ignored'.browserScan(Git, inverted) ┤■■■■■■■ 2.86 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 8.03 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.06x faster than 'view-ignored'.scan(Git, skipInternal)
   1.82x faster than 'view-ignored'.browserScan(Git, inverted)
   1.86x faster than 'view-ignored'.browserScan(Git)
   1.86x faster than 'view-ignored'.scan(Git)
   1.99x faster than 'view-ignored'.scan(Git, inverted)
   5.12x faster than 'ignore-walk'.walk(.gitignore)

Git Init benchmark
clk: ~3.08 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: node 26.7.0 (x64-linux)

Memory Usage:
  'view-ignored'.Git.init   Avg: 3.24 kb    Range: 2.77 kb … 4.01 kb

                             ┌                                            ┐
     'view-ignored'.Git.init ┤ 2.00 µs
                             └                                            ┘

NPM target benchmark
clk: ~3.07 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: node 26.7.0 (x64-linux)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 361.45 kb  Range: 2.62 kb … 2.11 mb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 326.59 kb  Range: 4.84 kb … 1.44 mb
  'view-ignored'.scan(NPM)                        Avg: 817.28 kb  Range: 113.18 kb … 1.84 mb
  'view-ignored'.browserScan(NPM)                 Avg: 799.35 kb  Range: 9.40 kb … 1.51 mb
  'view-ignored'.scan(NPM, inverted)              Avg: 855.48 kb  Range: 367.76 kb … 2.88 mb
  'view-ignored'.browserScan(NPM, inverted)       Avg: 819.36 kb  Range: 294.01 kb … 2.07 mb
  'npm-packlist'(preparedArbTree)                 Avg: 108.86 kb  Range: 2.59 kb … 594.62 kb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 7.21 mb    Range: 5.92 mb … 8.55 mb
  'npmcli/arborist'.loadActual()                  Avg: 466.29  b  Range: 124.26 b … 742.35 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 1.16 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 1.12 ms
                     'view-ignored'.scan(NPM) ┤■■ 2.59 ms
              'view-ignored'.browserScan(NPM) ┤■■ 2.63 ms
           'view-ignored'.scan(NPM, inverted) ┤■■ 2.58 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■■ 2.56 ms
              'npm-packlist'(preparedArbTree) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 24.80 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■ 8.01 ms
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 201.16 ns
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.03x faster than 'view-ignored'.scan(NPM, skipInternal)
   2.28x faster than 'view-ignored'.browserScan(NPM, inverted)
   2.29x faster than 'view-ignored'.scan(NPM, inverted)
   2.3x faster than 'view-ignored'.scan(NPM)
   2.34x faster than 'view-ignored'.browserScan(NPM)
   7.13x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
   22.05x faster than 'npm-packlist'(preparedArbTree)
```

<!-- BENCH_NODE_END -->

#### Low-end

<!-- BENCH_NODE_LOW_START -->

```txt
$ node --expose-gc benchmarks/git.js && node --expose-gc benchmarks/npm.js



Git target benchmark
clk: ~2.00 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.2.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(Git, skipInternal)          Avg: 424.42 kb  Range: 55.24 kb … 2.69 mb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 342.63 kb  Range: 80.62 kb … 1.67 mb
  'view-ignored'.scan(Git)                        Avg: 10.25 mb   Range: 2.36 mb … 13.07 mb
  'view-ignored'.browserScan(Git)                 Avg: 10.19 mb   Range: 1.84 mb … 11.49 mb
  'view-ignored'.scan(Git, inverted)              Avg: 10.82 mb   Range: 595.48 kb … 11.72 mb
  'view-ignored'.browserScan(Git, inverted)       Avg: 11.49 mb   Range: 11.39 mb … 11.69 mb
  'ignore-walk'.walk(.gitignore)                  Avg: 11.09 mb   Range: 10.25 mb … 12.81 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 2.85 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 2.70 ms
                     'view-ignored'.scan(Git) ┤■ 24.93 ms
              'view-ignored'.browserScan(Git) ┤■ 19.88 ms
           'view-ignored'.scan(Git, inverted) ┤■ 28.64 ms
    'view-ignored'.browserScan(Git, inverted) ┤■ 28.19 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 726.62 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.06x faster than 'view-ignored'.scan(Git, skipInternal)
   7.37x faster than 'view-ignored'.browserScan(Git)
   9.24x faster than 'view-ignored'.scan(Git)
   10.45x faster than 'view-ignored'.browserScan(Git, inverted)
   10.62x faster than 'view-ignored'.scan(Git, inverted)
   269.48x faster than 'ignore-walk'.walk(.gitignore)

NPM target benchmark
clk: ~2.03 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.2.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 390.65 kb  Range: 211.88 kb … 2.12 mb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 341.92 kb  Range: 20.89 kb … 1.47 mb
  'view-ignored'.scan(NPM)                        Avg: 14.04 mb   Range: 13.49 mb … 14.61 mb
  'view-ignored'.browserScan(NPM)                 Avg: 12.99 mb   Range: 5.52 mb … 14.62 mb
  'view-ignored'.scan(NPM, inverted)              Avg: 13.28 mb   Range: 3.93 mb … 14.99 mb
  'view-ignored'.browserScan(NPM, inverted)       Avg: 14.84 mb   Range: 14.79 mb … 14.92 mb
  'npm-packlist'(preparedArbTree)                 Avg: 7.27 mb    Range: 7.08 mb … 7.47 mb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 11.74 mb   Range: 11.06 mb … 13.65 mb
  'npmcli/arborist'.loadActual()                  Avg: 457.11  b  Range: 125.69 b … 757.29 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 2.61 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 2.33 ms
                     'view-ignored'.scan(NPM) ┤■■ 48.49 ms
              'view-ignored'.browserScan(NPM) ┤■■ 48.56 ms
           'view-ignored'.scan(NPM, inverted) ┤■■ 52.24 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■■ 51.38 ms
              'npm-packlist'(preparedArbTree) ┤■■■ 74.27 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 757.27 ms
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 309.32 ns
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.12x faster than 'view-ignored'.scan(NPM, skipInternal)
   20.84x faster than 'view-ignored'.scan(NPM)
   20.87x faster than 'view-ignored'.browserScan(NPM)
   22.08x faster than 'view-ignored'.browserScan(NPM, inverted)
   22.45x faster than 'view-ignored'.scan(NPM, inverted)
   31.92x faster than 'npm-packlist'(preparedArbTree)
   325.49x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```

<!-- BENCH_NODE_LOW_END -->

### Bun

<!-- BENCH_BUN_START -->

```txt
$ bun run --expose-gc benchmarks/git.js && bun run --expose-gc benchmarks/npm.js

Git target benchmark
clk: ~3.10 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: bun 1.3.14 (x64-linux)

Memory Usage:
  'view-ignored'.scan(Git, skipInternal)          Avg: 29.65 kb   Range: 0.00 b … 1.88 mb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 6.06 kb    Range: 0.00 b … 512.00 kb
  'view-ignored'.scan(Git)                        Avg: 38.53 kb   Range: 0.00 b … 1.63 mb
  'view-ignored'.browserScan(Git)                 Avg: 5.43 kb    Range: 0.00 b … 384.00 kb
  'view-ignored'.scan(Git, inverted)              Avg: 56.89 kb   Range: 0.00 b … 1.13 mb
  'view-ignored'.browserScan(Git, inverted)       Avg: 30.75 kb   Range: 0.00 b … 1.50 mb
  'ignore-walk'.walk(.gitignore)                  Avg: 156.44 kb  Range: 0.00 b … 2.38 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 845.82 µs
'view-ignored'.browserScan(Git, skipInternal) ┤ 762.58 µs
                     'view-ignored'.scan(Git) ┤■■■■ 1.79 ms
              'view-ignored'.browserScan(Git) ┤■■■■ 1.82 ms
           'view-ignored'.scan(Git, inverted) ┤■■■■■■ 2.12 ms
    'view-ignored'.browserScan(Git, inverted) ┤■■■■■ 2.05 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 8.88 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.11x faster than 'view-ignored'.scan(Git, skipInternal)
   2.35x faster than 'view-ignored'.scan(Git)
   2.39x faster than 'view-ignored'.browserScan(Git)
   2.69x faster than 'view-ignored'.browserScan(Git, inverted)
   2.78x faster than 'view-ignored'.scan(Git, inverted)
   11.65x faster than 'ignore-walk'.walk(.gitignore)

Git Init benchmark
clk: ~3.11 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: bun 1.3.14 (x64-linux)

Memory Usage:
  'view-ignored'.Git.init   Avg: 103.04  b  Range: 0.00 b … 3.75 kb

                             ┌                                            ┐
     'view-ignored'.Git.init ┤ 1.81 µs
                             └                                            ┘

NPM target benchmark
clk: ~3.06 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: bun 1.3.14 (x64-linux)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 22.37 kb   Range: 0.00 b … 896.00 kb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 12.46 kb   Range: 0.00 b … 768.00 kb
  'view-ignored'.scan(NPM)                        Avg: 12.49 kb   Range: 0.00 b … 896.00 kb
  'view-ignored'.browserScan(NPM)                 Avg: 14.91 kb   Range: 0.00 b … 1.00 mb
  'view-ignored'.scan(NPM, inverted)              Avg: 10.56 kb   Range: 0.00 b … 256.00 kb
  'view-ignored'.browserScan(NPM, inverted)       Avg: 9.92 kb    Range: 0.00 b … 512.00 kb
  'npm-packlist'(preparedArbTree)                 Avg: 198.40 kb  Range: 0.00 b … 1.75 mb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 160.48 kb  Range: 0.00 b … 1.88 mb
  'npmcli/arborist'.loadActual()                  Avg: 8.29  b    Range: 0.00 b … 192.00 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 792.13 µs
'view-ignored'.browserScan(NPM, skipInternal) ┤ 725.03 µs
                     'view-ignored'.scan(NPM) ┤■ 1.66 ms
              'view-ignored'.browserScan(NPM) ┤■ 1.65 ms
           'view-ignored'.scan(NPM, inverted) ┤■ 1.66 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■ 1.65 ms
              'npm-packlist'(preparedArbTree) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 26.14 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■ 9.33 ms
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 132.27 ns
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.09x faster than 'view-ignored'.scan(NPM, skipInternal)
   2.27x faster than 'view-ignored'.browserScan(NPM)
   2.28x faster than 'view-ignored'.browserScan(NPM, inverted)
   2.29x faster than 'view-ignored'.scan(NPM)
   2.3x faster than 'view-ignored'.scan(NPM, inverted)
   12.87x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
   36.05x faster than 'npm-packlist'(preparedArbTree)
```

<!-- BENCH_BUN_END -->

#### Low-end

<!-- BENCH_BUN_LOW_START -->

```txt
$ bun run --expose-gc benchmarks/git.js && bun run --expose-gc benchmarks/npm.js



Git target benchmark
clk: ~1.06 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.4.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(Git, skipInternal)          Avg: 36.93 kb   Range: 0.00 b … 520.00 kb
  'view-ignored'.browserScan(Git, skipInternal)   Avg: 34.34 kb   Range: 0.00 b … 1.78 mb
  'view-ignored'.scan(Git)                        Avg: 605.04 kb  Range: 32.00 kb … 7.61 mb
  'view-ignored'.browserScan(Git)                 Avg: 256.30 kb  Range: 96.00 kb … 800.00 kb
  'view-ignored'.scan(Git, inverted)              Avg: 1.34 mb    Range: 64.00 kb … 3.49 mb
  'view-ignored'.browserScan(Git, inverted)       Avg: 887.05 kb  Range: 0.00 b … 1.97 mb
  'ignore-walk'.walk(.gitignore)                  Avg: 8.22 mb    Range: 2.30 mb … 13.39 mb

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 2.59 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 2.48 ms
                     'view-ignored'.scan(Git) ┤■ 21.72 ms
              'view-ignored'.browserScan(Git) ┤■ 22.14 ms
           'view-ignored'.scan(Git, inverted) ┤■ 29.36 ms
    'view-ignored'.browserScan(Git, inverted) ┤■ 29.45 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 760.24 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.05x faster than 'view-ignored'.scan(Git, skipInternal)
   8.76x faster than 'view-ignored'.scan(Git)
   8.93x faster than 'view-ignored'.browserScan(Git)
   11.84x faster than 'view-ignored'.scan(Git, inverted)
   11.88x faster than 'view-ignored'.browserScan(Git, inverted)
   306.64x faster than 'ignore-walk'.walk(.gitignore)

NPM target benchmark
clk: ~1.01 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.4.0 (x64-win32)

Memory Usage:
  'view-ignored'.scan(NPM, skipInternal)          Avg: 63.95 kb   Range: 0.00 b … 1.85 mb
  'view-ignored'.browserScan(NPM, skipInternal)   Avg: 13.51 kb   Range: 0.00 b … 420.00 kb
  'view-ignored'.scan(NPM)                        Avg: 485.09 kb  Range: 276.00 kb … 880.00 kb
  'view-ignored'.browserScan(NPM)                 Avg: 299.71 kb  Range: 132.00 kb … 636.00 kb
  'view-ignored'.scan(NPM, inverted)              Avg: 2.14 mb    Range: 1.20 mb … 3.15 mb
  'view-ignored'.browserScan(NPM, inverted)       Avg: 1.57 mb    Range: 256.00 kb … 2.27 mb
  'npm-packlist'(preparedArbTree)                 Avg: 237.33 kb  Range: 0.00 b … 444.00 kb
  'ignore-walk'.walk(.gitignore, .npmignore)      Avg: 6.53 mb    Range: 1.19 mb … 9.80 mb
  'npmcli/arborist'.loadActual()                  Avg: 7.04  b    Range: 0.00 b … 196.00 b

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 2.78 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 2.31 ms
                     'view-ignored'.scan(NPM) ┤■■ 42.15 ms
              'view-ignored'.browserScan(NPM) ┤■■ 42.90 ms
           'view-ignored'.scan(NPM, inverted) ┤■■ 46.33 ms
    'view-ignored'.browserScan(NPM, inverted) ┤■■ 46.63 ms
              'npm-packlist'(preparedArbTree) ┤■■■ 81.82 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 793.31 ms
                                              └                                            ┘
                                              ┌                                            ┐
               'npmcli/arborist'.loadActual() ┤ 217.68 ns
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.21x faster than 'view-ignored'.scan(NPM, skipInternal)
   18.28x faster than 'view-ignored'.scan(NPM)
   18.61x faster than 'view-ignored'.browserScan(NPM)
   20.1x faster than 'view-ignored'.scan(NPM, inverted)
   20.23x faster than 'view-ignored'.browserScan(NPM, inverted)
   35.5x faster than 'npm-packlist'(preparedArbTree)
   344.15x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```

<!-- BENCH_BUN_LOW_END -->

# `view-ignored` benchmarks

## `view-ignored` Git and NPM vs. `ignore-walk`

In this benchmark, we compare the performance of
`view-ignored` with `ignore-walk` for scanning
Git and NPM ignore files for the 'view-ignored' directory.

### Node

<!-- BENCH_NODE_START -->

```txt
$ node --expose-gc benchmarks/git.js && node --expose-gc benchmarks/npm.js
Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~3.01 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: node 26.4.0 (x64-linux)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(Git, skipInternal)          1.62 ms/iter   1.66 ms   █
                                         (1.40 ms … 4.36 ms)   2.51 ms  ▆██
                                     ( 11.96 kb …   1.70 mb) 308.56 kb ▂████▇▆▄▂▂▂▁▂▂▁▂▁▁▁▁▁

'view-ignored'.browserScan(Git, skipInternal)   1.59 ms/iter   1.60 ms    ▄█▅
                                         (1.37 ms … 4.44 ms)   2.23 ms    ███▃
                                     ( 15.57 kb …   2.29 mb) 273.80 kb ▂▂█████▄▅▃▂▂▁▁▁▁▁▁▁▁▁

'view-ignored'.scan(Git)                        2.49 ms/iter   2.57 ms  ▂█▇
                                         (2.16 ms … 4.32 ms)   3.80 ms  ████▃
                                     (  2.78 kb …   2.19 mb) 848.77 kb ▂██████▄▅▃▃▂▁▂▁▁▁▁▁▁▂

'view-ignored'.browserScan(Git)                 2.50 ms/iter   2.58 ms   █▆▃
                                         (2.14 ms … 3.81 ms)   3.46 ms   ███▆
                                     ( 20.66 kb …   2.43 mb) 857.56 kb ▄▅████▆▅▄█▄▄▃▄▄▁▂▁▁▁▂

'ignore-walk'.walk(.gitignore)                  9.00 ms/iter   9.09 ms  █
                                        (7.99 ms … 13.90 ms)  12.91 ms  █▆
                                     (  7.06 mb …   8.35 mb)   7.70 mb ▃██▅▃▂▂▂▄▂▂▂▁▃▃▁▁▁▁▂▂

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 1.62 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 1.59 ms
                     'view-ignored'.scan(Git) ┤■■■■ 2.49 ms
              'view-ignored'.browserScan(Git) ┤■■■■ 2.50 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 9.00 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.02x faster than 'view-ignored'.scan(Git, skipInternal)
   1.57x faster than 'view-ignored'.scan(Git)
   1.58x faster than 'view-ignored'.browserScan(Git)
   5.67x faster than 'ignore-walk'.walk(.gitignore)

Git Init benchmark
clk: ~3.08 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: node 26.4.0 (x64-linux)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
'view-ignored'.Git.init      193.96 µs/iter 207.82 µs      █▇
                      (144.09 µs … 2.54 ms) 273.91 µs    ▃▄██▅ ▃▅▂
                    ( 56.00  b … 994.90 kb)  26.97 kb ▁▂▃█████████▇▄▃▂▂▂▂▁▁

                             ┌                                            ┐
     'view-ignored'.Git.init ┤ 193.96 µs
                             └                                            ┘

NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~3.09 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: node 26.4.0 (x64-linux)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(NPM, skipInternal)          1.10 ms/iter   1.10 ms   █▂
                                       (901.61 µs … 5.66 ms)   1.80 ms  ███
                                     ( 49.97 kb …   1.67 mb) 308.33 kb ▄████▆▅▄▄▃▂▁▂▂▂▁▂▁▁▁▁

'view-ignored'.browserScan(NPM, skipInternal)   1.02 ms/iter   1.01 ms   ▄█▄
                                       (863.04 µs … 5.73 ms)   1.59 ms  ▄███
                                     (135.01 kb …   1.34 mb) 272.47 kb ▂█████▄▂▁▁▁▁▁▁▁▁▁▁▁▁▁

'view-ignored'.scan(NPM)                        2.67 ms/iter   2.72 ms   █
                                         (2.39 ms … 4.37 ms)   4.12 ms  ██▇▂
                                     (128.08 kb …   2.46 mb) 917.72 kb ▂████▆▄▂▁▁▁▂▁▁▁▁▁▁▁▁▂

'view-ignored'.browserScan(NPM)                 2.71 ms/iter   2.77 ms   ▄█▄
                                         (2.40 ms … 4.93 ms)   3.79 ms  ▅███▇
                                     ( 61.52 kb …   3.88 mb) 934.74 kb ▂██████▃▅▃▃▂▁▁▁▂▂▁▁▁▂

'ignore-walk'.walk(.gitignore, .npmignore)      8.71 ms/iter   8.78 ms ▂███▆
                                        (8.24 ms … 11.40 ms)  10.59 ms █████▃▅
                                     (  4.78 mb …  10.17 mb)   7.71 mb ███████▅▅▁▁▁▁▅▁▁▅▁▁▁▃

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 1.10 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 1.02 ms
                     'view-ignored'.scan(NPM) ┤■■■■■■■ 2.67 ms
              'view-ignored'.browserScan(NPM) ┤■■■■■■■■ 2.71 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 8.71 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.08x faster than 'view-ignored'.scan(NPM, skipInternal)
   2.63x faster than 'view-ignored'.scan(NPM)
   2.67x faster than 'view-ignored'.browserScan(NPM)
   8.58x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```

<!-- BENCH_NODE_END -->

#### Low-end

<!-- BENCH_NODE_LOW_START -->

```txt
$ node --expose-gc benchmarks/git.js && node --expose-gc benchmarks/npm.js

Running benchmarks\target_git.js
Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~1.50 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.2.0 (x64-win32)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(Git, skipInternal)          5.43 ms/iter   5.71 ms  ██▃
                                         (4.50 ms … 8.74 ms)   8.28 ms  ███▇▄▂  ▃
                                     (316.19 kb …   1.85 mb) 421.79 kb ▅██████▆▂█▄▄▃▃▂▂▁▁▁▂▂

'view-ignored'.browserScan(Git, skipInternal)   5.56 ms/iter   5.90 ms  ▅▂▃ █ ▃
                                         (4.73 ms … 7.86 ms)   7.36 ms  █████▅█ ▂ ▄▄
                                     ( 68.59 kb … 621.85 kb) 335.69 kb ▆█████████▄██▆▁▄▁▁▃▃▃

'view-ignored'.scan(Git)                       34.68 ms/iter  39.60 ms      █
                                       (26.94 ms … 41.17 ms)  40.68 ms █    █     █      ██
                                     (  7.08 mb …   8.62 mb)   8.30 mb █▁▁▁▁██▁█▁██▁▁█▁▁▁███

'view-ignored'.browserScan(Git)                33.39 ms/iter  37.42 ms  █ █                █
                                       (23.60 ms … 48.46 ms)  47.82 ms ▅█▅█▅▅▅▅▅▅ ▅     ▅  █
                                     (  8.35 mb …   9.87 mb)   8.52 mb ██████████▁█▁▁▁▁▁█▁▁█

'ignore-walk'.walk(.gitignore)                918.52 ms/iter 879.16 ms █  █
                                        (843.74 ms … 1.23 s)    1.07 s ██ █
                                     (  1.35 mb …   4.89 mb)   3.31 mb ████▁▁▁▁▁▁▁▁█▁▁▁▁▁▁▁█

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 5.43 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 5.56 ms
                     'view-ignored'.scan(Git) ┤■ 34.68 ms
              'view-ignored'.browserScan(Git) ┤■ 33.39 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 918.52 ms
                                              └                                            ┘

summary
  'view-ignored'.scan(Git, skipInternal)
   1.02x faster than 'view-ignored'.browserScan(Git, skipInternal)
   6.15x faster than 'view-ignored'.browserScan(Git)
   6.39x faster than 'view-ignored'.scan(Git)
   169.17x faster than 'ignore-walk'.walk(.gitignore)

Running benchmarks\target_npm.js
NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~1.86 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.2.0 (x64-win32)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(NPM, skipInternal)          3.32 ms/iter   3.52 ms   █▅
                                         (2.66 ms … 5.73 ms)   5.28 ms  ███▃▅
                                     ( 58.64 kb …   1.42 mb) 304.99 kb ▅█████▇▇▆▃▅▃▅▂▂▂▅▁▁▁▂

'view-ignored'.browserScan(NPM, skipInternal)   2.85 ms/iter   2.98 ms    █▅▃
                                         (2.37 ms … 5.39 ms)   4.17 ms  ▆████▆▂
                                     ( 19.13 kb …   1.19 mb) 253.93 kb ▅███████▆▅▅▅▆▂▂▂▁▁▂▁▂

'view-ignored'.scan(NPM)                       38.34 ms/iter  42.30 ms           █
                                       (30.16 ms … 44.47 ms)  43.32 ms           █       ██
                                     ( 11.05 mb …  11.95 mb)  11.77 mb █▁█▁█▁▁▁█▁█▁█▁█▁▁▁███

'view-ignored'.browserScan(NPM)                41.73 ms/iter  43.07 ms ████ ██  █ ██    █  █
                                       (36.13 ms … 53.18 ms)  47.85 ms ████ ██  █ ██    █  █
                                     ( 10.88 mb …  11.92 mb)  11.73 mb ████▁██▁▁█▁██▁▁▁▁█▁▁█

'ignore-walk'.walk(.gitignore, .npmignore)    849.60 ms/iter 855.23 ms     █
                                     (829.45 ms … 879.69 ms) 874.33 ms ▅ ▅ █▅ ▅▅▅ ▅  ▅     ▅
                                     (941.82 kb …   4.29 mb)   2.92 mb █▁█▁██▁███▁█▁▁█▁▁▁▁▁█

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 3.32 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 2.85 ms
                     'view-ignored'.scan(NPM) ┤■ 38.34 ms
              'view-ignored'.browserScan(NPM) ┤■■ 41.73 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 849.60 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.16x faster than 'view-ignored'.scan(NPM, skipInternal)
   13.43x faster than 'view-ignored'.scan(NPM)
   14.62x faster than 'view-ignored'.browserScan(NPM)
   297.64x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```

<!-- BENCH_NODE_LOW_END -->

### Bun

<!-- BENCH_BUN_START -->

```txt
$ bun run --expose-gc benchmarks/git.js && bun run --expose-gc benchmarks/npm.js
Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~1.57 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: bun 1.3.14 (x64-linux)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(Git, skipInternal)        969.75 µs/iter   1.01 ms   █
                                       (736.47 µs … 2.80 ms)   1.98 ms  ██
                                     (  0.00  b …   1.13 mb)  31.17 kb ▂██▇▆▅▄▃▂▂▂▂▁▁▁▁▁▁▂▁▁

'view-ignored'.browserScan(Git, skipInternal) 875.69 µs/iter 867.64 µs   █
                                       (737.05 µs … 2.05 ms)   1.43 ms  ▂██
                                     (  0.00  b … 640.00 kb)   9.72 kb ▂███▇▃▃▃▃▂▂▂▁▁▁▁▂▂▂▁▁

'view-ignored'.scan(Git)                        1.68 ms/iter   1.67 ms   ▂█
                                         (1.47 ms … 2.55 ms)   2.34 ms  ▂██▅
                                     (  0.00  b … 768.00 kb)  22.90 kb ▄████▇▃▃▃▂▂▁▁▂▁▂▃▃▃▃▁

'view-ignored'.browserScan(Git)                 1.63 ms/iter   1.64 ms   ▃█▄
                                         (1.41 ms … 2.34 ms)   2.25 ms   ███▆
                                     (  0.00  b … 256.00 kb)   9.45 kb ▂██████▅▃▂▂▁▂▂▁▂▂▃▃▃▂

'ignore-walk'.walk(.gitignore)                  9.16 ms/iter   9.39 ms  █    ▄
                                        (8.41 ms … 13.32 ms)  11.08 ms  ██ ▅▆█▆▅
                                     (  0.00  b …   2.00 mb) 137.28 kb ███▅██████▃▁▅▁▃▁▁▃▁▁▃

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 969.75 µs
'view-ignored'.browserScan(Git, skipInternal) ┤ 875.69 µs
                     'view-ignored'.scan(Git) ┤■■■ 1.68 ms
              'view-ignored'.browserScan(Git) ┤■■■ 1.63 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 9.16 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.11x faster than 'view-ignored'.scan(Git, skipInternal)
   1.87x faster than 'view-ignored'.browserScan(Git)
   1.92x faster than 'view-ignored'.scan(Git)
   10.46x faster than 'ignore-walk'.walk(.gitignore)

Git Init benchmark
clk: ~1.58 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: bun 1.3.14 (x64-linux)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
'view-ignored'.Git.init       70.94 µs/iter  71.39 µs   █
                     (50.56 µs … 668.69 µs) 156.27 µs   █▅
                    (  0.00  b …   3.38 mb)   1.99 kb ▁▄██▅▄▃▂▂▂▁▁▁▁▁▁▁▁▁▁▁

                             ┌                                            ┐
     'view-ignored'.Git.init ┤ 70.94 µs
                             └                                            ┘

NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~3.11 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: bun 1.3.14 (x64-linux)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(NPM, skipInternal)        807.13 µs/iter 830.19 µs  █▅
                                       (628.33 µs … 2.51 ms)   1.74 ms  ██
                                     (  0.00  b …   3.13 mb)  25.51 kb ▄███▄▅▄▃▂▂▂▂▁▁▁▁▁▁▁▁▁

'view-ignored'.browserScan(NPM, skipInternal) 728.20 µs/iter 727.91 µs   █▄
                                       (593.56 µs … 1.60 ms)   1.30 ms  ▂██▂
                                     (  0.00  b …   1.25 mb)  16.77 kb ▂████▄▃▂▂▃▁▁▁▁▁▁▂▂▂▁▁

'view-ignored'.scan(NPM)                        2.33 ms/iter   2.33 ms  ▃██▆
                                         (2.08 ms … 3.39 ms)   3.07 ms  ████
                                     (  0.00  b …   1.25 mb)  41.21 kb ▂█████▆▂▃▂▁▃▄▇▂▄▃▃▁▁▁

'view-ignored'.browserScan(NPM)                 2.28 ms/iter   2.29 ms    █▂
                                         (2.05 ms … 3.00 ms)   2.86 ms   ▇███
                                     (  0.00  b … 640.00 kb)  11.13 kb ▄█████▇▅▂▂▁▂▁▁▃▅▄▄▃▁▂

'ignore-walk'.walk(.gitignore, .npmignore)      9.27 ms/iter   9.41 ms  █ ██
                                        (8.59 ms … 13.09 ms)  11.78 ms  █████▅
                                     (  0.00  b …   2.75 mb) 113.16 kb ███████▅█▃▁▁▁▃▁▁▁▁▁▁▃

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 807.13 µs
'view-ignored'.browserScan(NPM, skipInternal) ┤ 728.20 µs
                     'view-ignored'.scan(NPM) ┤■■■■■■ 2.33 ms
              'view-ignored'.browserScan(NPM) ┤■■■■■■ 2.28 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 9.27 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.11x faster than 'view-ignored'.scan(NPM, skipInternal)
   3.13x faster than 'view-ignored'.browserScan(NPM)
   3.19x faster than 'view-ignored'.scan(NPM)
   12.73x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
Post job cleanup.
Post job cleanup.
Post job cleanup.
[command]/usr/bin/git version
git version 2.54.0
Temporarily overriding HOME='/home/runner/work/_temp/8ea4636f-6928-4019-bf9a-742c5e2699f6' before making global git config changes
Adding repository directory to the temporary git global config as a safe directory
[command]/usr/bin/git config --global --add safe.directory /home/runner/work/view-ignored/view-ignored
Removing SSH command configuration
[command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
[command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
Removing HTTP extra header
[command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
[command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
Removing includeIf entries pointing to credentials config files
[command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
includeif.gitdir:/home/runner/work/view-ignored/view-ignored/.git.path
includeif.gitdir:/home/runner/work/view-ignored/view-ignored/.git/worktrees/*.path
includeif.gitdir:/github/workspace/.git.path
includeif.gitdir:/github/workspace/.git/worktrees/*.path
[command]/usr/bin/git config --local --get-all includeif.gitdir:/home/runner/work/view-ignored/view-ignored/.git.path
/home/runner/work/_temp/git-credentials-53b57e2e-df23-4f0e-b0ed-daf8ba9a71b9.config
[command]/usr/bin/git config --local --unset includeif.gitdir:/home/runner/work/view-ignored/view-ignored/.git.path /home/runner/work/_temp/git-credentials-53b57e2e-df23-4f0e-b0ed-daf8ba9a71b9.config
[command]/usr/bin/git config --local --get-all includeif.gitdir:/home/runner/work/view-ignored/view-ignored/.git/worktrees/*.path
/home/runner/work/_temp/git-credentials-53b57e2e-df23-4f0e-b0ed-daf8ba9a71b9.config
[command]/usr/bin/git config --local --unset includeif.gitdir:/home/runner/work/view-ignored/view-ignored/.git/worktrees/*.path /home/runner/work/_temp/git-credentials-53b57e2e-df23-4f0e-b0ed-daf8ba9a71b9.config
[command]/usr/bin/git config --local --get-all includeif.gitdir:/github/workspace/.git.path
/github/runner_temp/git-credentials-53b57e2e-df23-4f0e-b0ed-daf8ba9a71b9.config
[command]/usr/bin/git config --local --unset includeif.gitdir:/github/workspace/.git.path /github/runner_temp/git-credentials-53b57e2e-df23-4f0e-b0ed-daf8ba9a71b9.config
[command]/usr/bin/git config --local --get-all includeif.gitdir:/github/workspace/.git/worktrees/*.path
/github/runner_temp/git-credentials-53b57e2e-df23-4f0e-b0ed-daf8ba9a71b9.config
[command]/usr/bin/git config --local --unset includeif.gitdir:/github/workspace/.git/worktrees/*.path /github/runner_temp/git-credentials-53b57e2e-df23-4f0e-b0ed-daf8ba9a71b9.config
[command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
Removing credentials config '/home/runner/work/_temp/git-credentials-53b57e2e-df23-4f0e-b0ed-daf8ba9a71b9.config'
Cleaning up orphan processes
```

<!-- BENCH_BUN_END -->

#### Low-end

<!-- BENCH_BUN_LOW_START -->

```txt
$ bun run --expose-gc benchmarks/git.js && bun run --expose-gc benchmarks/npm.js

Running benchmarks\target_git.js
Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~0.91 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.4.0 (x64-win32)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(Git, skipInternal)          4.67 ms/iter   5.31 ms   █
                                         (3.78 ms … 7.54 ms)   6.67 ms ▅██▆         ▂
                                     (  0.00  b …   1.00 mb)  68.22 kb ████▇▆▆▃▄▃▆▃▆█▅▄▁▆▂▂▂

'view-ignored'.browserScan(Git, skipInternal)   4.29 ms/iter   4.68 ms  █
                                         (3.70 ms … 6.33 ms)   5.85 ms  ██▆
                                     (  0.00  b …   2.38 mb)  65.05 kb █████▅▅▂▂▂▂▂▆▇▂▂▄▄▂▂▂

'view-ignored'.scan(Git)                       26.61 ms/iter  28.70 ms    █
                                       (22.55 ms … 33.45 ms)  33.40 ms ▂  █  ▇        ▂
                                     ( 56.00 kb …   6.68 mb) 858.17 kb █▆▆█▆▆█▆▆▁▁▆▁▆▁█▁▁▆▁▆

'view-ignored'.browserScan(Git)                26.45 ms/iter  26.96 ms      █
                                       (23.46 ms … 32.93 ms)  32.81 ms      █
                                     (  0.00  b …   3.60 mb) 675.48 kb ▅██▅██▅█▅▅▅▁▁▅▁▁▁▁▁▁▅

'ignore-walk'.walk(.gitignore)                801.17 ms/iter 830.58 ms   ███            █
                                     (771.18 ms … 843.07 ms) 840.86 ms ▅ ███     ▅      █  ▅
                                     (120.00 kb …   9.61 mb)   6.18 mb █▁███▁▁▁▁▁█▁▁▁▁▁▁█▁▁█

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 4.67 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 4.29 ms
                     'view-ignored'.scan(Git) ┤■ 26.61 ms
              'view-ignored'.browserScan(Git) ┤■ 26.45 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 801.17 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.09x faster than 'view-ignored'.scan(Git, skipInternal)
   6.16x faster than 'view-ignored'.browserScan(Git)
   6.2x faster than 'view-ignored'.scan(Git)
   186.6x faster than 'ignore-walk'.walk(.gitignore)

Running benchmarks\target_npm.js
NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~0.93 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.4.0 (x64-win32)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(NPM, skipInternal)          2.48 ms/iter   2.61 ms  █▆
                                         (1.93 ms … 5.15 ms)   4.51 ms ▃██▅▃
                                     (  0.00  b … 420.00 kb)  29.31 kb █████▄▄▃▂▅▄▄▄▄▁▂▂▁▂▁▂

'view-ignored'.browserScan(NPM, skipInternal)   2.26 ms/iter   2.28 ms  █▆
                                         (1.87 ms … 4.18 ms)   3.51 ms  ██▇
                                     (  0.00  b …   2.70 mb)  25.85 kb ▆████▆▄▃▂▂▁▂▂▂▂▄▃▂▂▃▂

'view-ignored'.scan(NPM)                       23.59 ms/iter  24.10 ms   █
                                       (19.27 ms … 33.34 ms)  31.47 ms   █
                                     (  0.00  b …   2.00 mb) 627.00 kb ███▅▁████▅▁▁▅▁▁▅▁▅▁▅▅

'view-ignored'.browserScan(NPM)                25.30 ms/iter  26.96 ms      █    ▂▂
                                       (19.87 ms … 33.25 ms)  33.00 ms ▅ ▅  █    ██ ▅
                                     ( 32.00 kb …   1.72 mb) 267.27 kb █▁█▇▇█▇▇▇▁██▁█▁▁▇▁▁▁▇

'ignore-walk'.walk(.gitignore, .npmignore)    800.97 ms/iter 799.15 ms               █
                                     (767.98 ms … 941.84 ms) 811.12 ms               █
                                     (  4.20 mb …   9.66 mb)   7.51 mb ██▁███▁▁▁▁█▁▁▁█▁▁█▁▁█

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 2.48 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 2.26 ms
                     'view-ignored'.scan(NPM) ┤■ 23.59 ms
              'view-ignored'.browserScan(NPM) ┤■ 25.30 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 800.97 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.09x faster than 'view-ignored'.scan(NPM, skipInternal)
   10.42x faster than 'view-ignored'.scan(NPM)
   11.17x faster than 'view-ignored'.browserScan(NPM)
   353.74x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```

<!-- BENCH_BUN_LOW_END -->

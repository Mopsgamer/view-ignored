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
clk: ~3.07 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: node 26.7.0 (x64-linux)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(Git, skipInternal)          1.69 ms/iter   1.74 ms  ▂█
                                         (1.44 ms … 4.19 ms)   2.88 ms  ██▇▄
                                     ( 16.20 kb …   3.46 mb) 391.23 kb ▅█████▄▄▃▂▁▁▁▁▁▁▁▁▁▁▁

'view-ignored'.browserScan(Git, skipInternal)   1.62 ms/iter   1.65 ms    ▅█
                                         (1.45 ms … 3.00 ms)   2.14 ms   ████▃
                                     ( 53.21 kb …   1.64 mb) 347.17 kb ▃▇██████▆▃▃▂▂▁▁▁▁▂▁▁▂

'view-ignored'.scan(Git)                        2.64 ms/iter   2.71 ms      █▃
                                         (2.21 ms … 3.97 ms)   3.44 ms    ▅████▃
                                     (322.55 kb …   2.26 mb)   1.20 mb ▁▁▃██████▆▇▄▄▃▁▂▁▁▁▂▂

'view-ignored'.browserScan(Git)                 2.63 ms/iter   2.70 ms     ▄█▅
                                         (2.33 ms … 3.41 ms)   3.20 ms   ▂████▆▆ ▂
                                     (636.94 kb …   1.80 mb)   1.19 mb ▃████████▇█▆▅▃▃▅▃▂▃▁▃

'ignore-walk'.walk(.gitignore)                  8.47 ms/iter   8.70 ms  ▄█
                                        (7.76 ms … 10.53 ms)  10.42 ms  ██▇▃
                                     (  6.16 mb …   9.06 mb)   7.22 mb ▄████▇▇█▇▁▅▄▁▂▁▂▅▂▂▁▂

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 1.69 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 1.62 ms
                     'view-ignored'.scan(Git) ┤■■■■■ 2.64 ms
              'view-ignored'.browserScan(Git) ┤■■■■■ 2.63 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 8.47 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.04x faster than 'view-ignored'.scan(Git, skipInternal)
   1.62x faster than 'view-ignored'.browserScan(Git)
   1.63x faster than 'view-ignored'.scan(Git)
   5.22x faster than 'ignore-walk'.walk(.gitignore)

Git Init benchmark
clk: ~3.02 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: node 26.7.0 (x64-linux)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
'view-ignored'.Git.init      180.97 µs/iter 195.78 µs         ▃█
                    (109.52 µs … 731.70 µs) 262.88 µs      ▃▆▅██▆█▃▄
                    (  1.98 kb … 264.09 kb)   9.40 kb ▁▁▂▃▆█████████▆▄▂▂▂▁▁

                             ┌                                            ┐
     'view-ignored'.Git.init ┤ 180.97 µs
                             └                                            ┘

NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~3.08 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: node 26.7.0 (x64-linux)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(NPM, skipInternal)          1.28 ms/iter   1.34 ms  █▄
                                         (1.05 ms … 2.95 ms)   2.50 ms  ██▇▄
                                     ( 23.67 kb …   2.01 mb) 391.50 kb ▄█████▄▂▂▁▁▁▁▁▁▁▁▁▁▁▁

'view-ignored'.browserScan(NPM, skipInternal)   1.22 ms/iter   1.24 ms     ▆█
                                         (1.07 ms … 3.05 ms)   1.56 ms   ▆▇███▇
                                     ( 50.38 kb …   1.36 mb) 338.99 kb ▂████████▅▆▄▂▂▁▂▁▁▁▁▁

'view-ignored'.scan(NPM)                        3.08 ms/iter   3.09 ms  ▄▇█▂
                                         (2.60 ms … 6.33 ms)   4.92 ms  ████
                                     ( 91.39 kb …   1.74 mb) 848.44 kb ▆█████▆▄▂▁▃▂▂▃▂▂▂▂▁▂▂

'view-ignored'.browserScan(NPM)                 2.91 ms/iter   2.96 ms    █▆▅▃
                                         (2.58 ms … 4.39 ms)   3.82 ms  ▅▆████▃
                                     (192.24 kb …   1.60 mb) 841.01 kb ▂███████▄▂▃▂▃▄▂▂▁▂▁▁▃

'ignore-walk'.walk(.gitignore, .npmignore)      8.49 ms/iter   8.63 ms  █▆▃
                                        (7.85 ms … 10.85 ms)  10.44 ms  ███▃▅▅
                                     (  6.35 mb …   8.16 mb)   7.24 mb ███████▆▄▃▄▄▃▃▁▁▁▁▃▃▄

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 1.28 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 1.22 ms
                     'view-ignored'.scan(NPM) ┤■■■■■■■■■ 3.08 ms
              'view-ignored'.browserScan(NPM) ┤■■■■■■■■ 2.91 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 8.49 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.05x faster than 'view-ignored'.scan(NPM, skipInternal)
   2.39x faster than 'view-ignored'.browserScan(NPM)
   2.53x faster than 'view-ignored'.scan(NPM)
   6.96x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
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
clk: ~1.39 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.2.0 (x64-win32)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(Git, skipInternal)          5.22 ms/iter   5.46 ms   █▃▇ ▄
                                         (4.40 ms … 8.00 ms)   7.43 ms  ▅███▃█▅▃
                                     ( 96.92 kb …   2.09 mb) 505.62 kb ▆████████▅█▂▅▃▃▁▁▂▁▁▂

'view-ignored'.browserScan(Git, skipInternal)   4.92 ms/iter   5.24 ms   █▅▄▅
                                         (4.18 ms … 6.36 ms)   6.22 ms   ████ ▂▇▇▆▆
                                     ( 96.09 kb …   1.43 mb) 442.00 kb ▇▅███████████▅▇▁█▄▂▁▄

'view-ignored'.scan(Git)                       39.50 ms/iter  43.79 ms  █               █
                                       (31.01 ms … 49.30 ms)  46.35 ms ▅█ ▅▅   ▅▅     ▅▅█ ▅▅
                                     (  3.59 mb …  12.01 mb)  10.11 mb ██▁██▁▁▁██▁▁▁▁▁███▁██

'view-ignored'.browserScan(Git)                41.22 ms/iter  44.86 ms      █
                                       (31.68 ms … 57.49 ms)  50.26 ms      █
                                     (  1.72 mb …  11.13 mb)   9.74 mb █▁▁████▁▁█▁▁▁████▁▁▁█

'ignore-walk'.walk(.gitignore)                   1.22 s/iter    1.28 s        █        █
                                           (1.10 s … 1.40 s)    1.32 s ▅▅ ▅  ▅█ ▅  ▅   █   ▅
                                     (  5.67 mb …   7.92 mb)   6.52 mb ██▁█▁▁██▁█▁▁█▁▁▁█▁▁▁█

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 5.22 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 4.92 ms
                     'view-ignored'.scan(Git) ┤■ 39.50 ms
              'view-ignored'.browserScan(Git) ┤■ 41.22 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 1.22 s
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.06x faster than 'view-ignored'.scan(Git, skipInternal)
   8.02x faster than 'view-ignored'.scan(Git)
   8.37x faster than 'view-ignored'.browserScan(Git)
   247.11x faster than 'ignore-walk'.walk(.gitignore)

Running benchmarks\target_npm.js
NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~1.53 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.2.0 (x64-win32)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(NPM, skipInternal)          4.58 ms/iter   5.00 ms     █▇
                                         (3.25 ms … 7.69 ms)   7.40 ms    ▆███▇ ▄
                                     ( 74.91 kb …   2.80 mb) 439.75 kb ▂▄██████▅█▇▅▄▃▅▂▂▁▂▁▂

'view-ignored'.browserScan(NPM, skipInternal)   4.09 ms/iter   4.30 ms  █▂▂   ▂
                                         (3.49 ms … 6.13 ms)   5.81 ms  ███▇▇▆█
                                     ( 17.88 kb …   1.31 mb) 383.06 kb █████████▄▆▅▄▅▁▁▁▂▂▂▂

'view-ignored'.scan(NPM)                       76.62 ms/iter  84.02 ms       █      █  █
                                       (55.36 ms … 92.98 ms)  91.96 ms ▅    ▅█    ▅▅█  █   ▅
                                     ( 14.22 mb …  14.81 mb)  14.40 mb █▁▁▁▁██▁▁▁▁███▁▁█▁▁▁█

'view-ignored'.browserScan(NPM)                86.90 ms/iter  90.46 ms           █
                                       (75.25 ms … 98.25 ms)  95.98 ms    █      █         █
                                     ( 14.04 mb …  14.76 mb)  14.33 mb █▁▁█▁▁▁▁█▁█▁▁▁██▁▁▁▁█

'ignore-walk'.walk(.gitignore, .npmignore)       1.02 s/iter    1.07 s    █
                                        (956.80 ms … 1.13 s)    1.10 s    █ █
                                     (259.88 kb …   7.92 mb)   4.81 mb ██▁█▁█▁█▁▁▁▁▁▁▁▁██▁▁█

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 4.58 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 4.09 ms
                     'view-ignored'.scan(NPM) ┤■■ 76.62 ms
              'view-ignored'.browserScan(NPM) ┤■■■ 86.90 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 1.02 s
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.12x faster than 'view-ignored'.scan(NPM, skipInternal)
   18.75x faster than 'view-ignored'.scan(NPM)
   21.27x faster than 'view-ignored'.browserScan(NPM)
   249.59x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```

<!-- BENCH_NODE_LOW_END -->

### Bun

<!-- BENCH_BUN_START -->

```txt
$ bun run --expose-gc benchmarks/git.js && bun run --expose-gc benchmarks/npm.js
Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~3.09 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: bun 1.3.14 (x64-linux)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(Git, skipInternal)        919.71 µs/iter 947.88 µs  ▃█
                                       (715.79 µs … 2.84 ms)   1.76 ms  ██▇
                                     (  0.00  b … 896.00 kb)  31.52 kb ▃█████▅▃▂▁▁▂▂▂▂▁▁▁▂▁▁

'view-ignored'.browserScan(Git, skipInternal) 832.10 µs/iter 826.79 µs   ▇█
                                       (696.95 µs … 1.52 ms)   1.40 ms   ██▂
                                     (  0.00  b … 640.00 kb)   7.71 kb ▂▇███▄▂▂▂▂▁▁▁▁▁▁▂▂▁▂▁

'view-ignored'.scan(Git)                        1.78 ms/iter   1.80 ms    ██▅
                                         (1.53 ms … 2.49 ms)   2.41 ms   ████▄
                                     (  0.00  b …   1.38 mb)  29.08 kb ▂██████▇▄▂▃▂▂▂▂▃▃▃▅▂▂

'view-ignored'.browserScan(Git)                 1.74 ms/iter   1.75 ms    ▄█▂
                                         (1.48 ms … 2.47 ms)   2.36 ms   ▄███▃
                                     (  0.00  b … 256.00 kb)  11.02 kb ▂▄█████▆▂▃▂▂▂▂▂▁▂▃▃▄▂

'ignore-walk'.walk(.gitignore)                  9.44 ms/iter   9.56 ms  █  ▅▆
                                        (8.51 ms … 14.08 ms)  12.74 ms  █▅▅██
                                     (  0.00  b …   2.25 mb) 132.18 kb ▄█████▆▁▁▃▁▁▁▃▄▁▁▁▃▁▃

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 919.71 µs
'view-ignored'.browserScan(Git, skipInternal) ┤ 832.10 µs
                     'view-ignored'.scan(Git) ┤■■■■ 1.78 ms
              'view-ignored'.browserScan(Git) ┤■■■■ 1.74 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 9.44 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.11x faster than 'view-ignored'.scan(Git, skipInternal)
   2.09x faster than 'view-ignored'.browserScan(Git)
   2.14x faster than 'view-ignored'.scan(Git)
   11.35x faster than 'ignore-walk'.walk(.gitignore)

Git Init benchmark
clk: ~1.57 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: bun 1.3.14 (x64-linux)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
'view-ignored'.Git.init       54.65 µs/iter  53.63 µs     █▆
                     (37.36 µs … 598.85 µs)  98.25 µs     ██
                    (  0.00  b … 128.00 kb) 611.86  b ▁▁▄███▆▄▃▃▂▂▁▁▁▁▁▁▁▁▁

                             ┌                                            ┐
     'view-ignored'.Git.init ┤ 54.65 µs
                             └                                            ┘

NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~3.09 GHz
cpu: AMD EPYC 7763 64-Core Processor
runtime: bun 1.3.14 (x64-linux)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(NPM, skipInternal)        877.67 µs/iter 897.03 µs  █
                                       (662.26 µs … 3.27 ms)   2.14 ms  █▄
                                     (  0.00  b …   1.13 mb)  30.00 kb ▃██▅▄▄▂▂▂▂▂▂▁▁▁▁▁▁▁▁▁

'view-ignored'.browserScan(NPM, skipInternal) 783.67 µs/iter 795.56 µs  ▂█▂
                                       (643.52 µs … 1.70 ms)   1.40 ms  ███▂
                                     (  0.00  b … 768.00 kb)  15.96 kb ▃████▆▅▃▂▁▁▁▁▁▂▂▂▁▂▂▁

'view-ignored'.scan(NPM)                        1.82 ms/iter   1.85 ms    █▃
                                         (1.57 ms … 2.70 ms)   2.47 ms  ▂███▅
                                     (  0.00  b … 768.00 kb)  15.02 kb ▂██████▆▃▂▃▂▁▂▂▅▄▄▂▂▁

'view-ignored'.browserScan(NPM)                 1.78 ms/iter   1.80 ms    ▅██
                                         (1.51 ms … 2.56 ms)   2.40 ms   ▅████
                                     (  0.00  b … 768.00 kb)  15.08 kb ▂▆█████▇▅▂▂▃▃▄▂▃▄▃▃▃▂

'ignore-walk'.walk(.gitignore, .npmignore)      9.39 ms/iter   9.69 ms            █
                                        (8.66 ms … 10.67 ms)  10.53 ms  ▃█▆▃   █  █
                                     (  0.00  b …   1.50 mb)  93.10 kb ▃█████▅▇██▇█▇▅▃▅▁▃▁▅▃

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 877.67 µs
'view-ignored'.browserScan(NPM, skipInternal) ┤ 783.67 µs
                     'view-ignored'.scan(NPM) ┤■■■■ 1.82 ms
              'view-ignored'.browserScan(NPM) ┤■■■■ 1.78 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 9.39 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.12x faster than 'view-ignored'.scan(NPM, skipInternal)
   2.28x faster than 'view-ignored'.browserScan(NPM)
   2.33x faster than 'view-ignored'.scan(NPM)
   11.99x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
Post job cleanup.
Post job cleanup.
Post job cleanup.
[command]/usr/bin/git version
git version 2.54.0
Temporarily overriding HOME='/home/runner/work/_temp/589a42b6-0146-479f-a115-df99bd9e6c21' before making global git config changes
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
/home/runner/work/_temp/git-credentials-fd22dbed-eb3d-422c-995f-5f6063eae797.config
[command]/usr/bin/git config --local --unset includeif.gitdir:/home/runner/work/view-ignored/view-ignored/.git.path /home/runner/work/_temp/git-credentials-fd22dbed-eb3d-422c-995f-5f6063eae797.config
[command]/usr/bin/git config --local --get-all includeif.gitdir:/home/runner/work/view-ignored/view-ignored/.git/worktrees/*.path
/home/runner/work/_temp/git-credentials-fd22dbed-eb3d-422c-995f-5f6063eae797.config
[command]/usr/bin/git config --local --unset includeif.gitdir:/home/runner/work/view-ignored/view-ignored/.git/worktrees/*.path /home/runner/work/_temp/git-credentials-fd22dbed-eb3d-422c-995f-5f6063eae797.config
[command]/usr/bin/git config --local --get-all includeif.gitdir:/github/workspace/.git.path
/github/runner_temp/git-credentials-fd22dbed-eb3d-422c-995f-5f6063eae797.config
[command]/usr/bin/git config --local --unset includeif.gitdir:/github/workspace/.git.path /github/runner_temp/git-credentials-fd22dbed-eb3d-422c-995f-5f6063eae797.config
[command]/usr/bin/git config --local --get-all includeif.gitdir:/github/workspace/.git/worktrees/*.path
/github/runner_temp/git-credentials-fd22dbed-eb3d-422c-995f-5f6063eae797.config
[command]/usr/bin/git config --local --unset includeif.gitdir:/github/workspace/.git/worktrees/*.path /github/runner_temp/git-credentials-fd22dbed-eb3d-422c-995f-5f6063eae797.config
[command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
Removing credentials config '/home/runner/work/_temp/git-credentials-fd22dbed-eb3d-422c-995f-5f6063eae797.config'
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
clk: ~0.70 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.4.0 (x64-win32)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(Git, skipInternal)          8.35 ms/iter   9.80 ms  █ ▆
                                        (4.29 ms … 16.72 ms)  15.97 ms ▂█▇██▂▇▂ ▇        ▅
                                     (  0.00  b …   1.51 mb) 121.73 kb ███████████▁▃▆▁█▃██▁▃

'view-ignored'.browserScan(Git, skipInternal)   6.50 ms/iter   7.36 ms ▆█ ▂    ▄
                                        (4.35 ms … 13.63 ms)  11.34 ms ████▅ ▅▅██
                                     (  0.00  b …   1.29 mb)  53.86 kb ██████████▇█▃▃▅▃▃▇▃▁▃

'view-ignored'.scan(Git)                       50.18 ms/iter  56.54 ms   █
                                       (39.61 ms … 73.29 ms)  59.72 ms   █
                                     ( 72.00 kb …   9.85 mb)   1.22 mb █▁█▁█▁▁▁▁▁▁▁▁▁█▁▁█▁▁█

'view-ignored'.browserScan(Git)                44.01 ms/iter  46.15 ms              █
                                       (32.48 ms … 52.10 ms)  52.02 ms ▅     ▅ ▅▅▅ ▅█▅  ▅  ▅
                                     (120.00 kb … 992.00 kb) 546.55 kb █▁▁▁▁▁█▁███▁███▁▁█▁▁█

'ignore-walk'.walk(.gitignore)                   1.26 s/iter    1.45 s   █               █ █
                                        (986.34 ms … 1.61 s)    1.51 s ▅▅█   ▅▅▅         █ █
                                     (  5.95 mb …   9.35 mb)   7.29 mb ███▁▁▁███▁▁▁▁▁▁▁▁▁█▁█

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 8.35 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 6.50 ms
                     'view-ignored'.scan(Git) ┤■ 50.18 ms
              'view-ignored'.browserScan(Git) ┤■ 44.01 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 1.26 s
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.28x faster than 'view-ignored'.scan(Git, skipInternal)
   6.77x faster than 'view-ignored'.browserScan(Git)
   7.72x faster than 'view-ignored'.scan(Git)
   193.4x faster than 'ignore-walk'.walk(.gitignore)

Running benchmarks\target_npm.js
NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~0.69 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.4.0 (x64-win32)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(NPM, skipInternal)          3.94 ms/iter   4.78 ms  █▄
                                         (2.74 ms … 8.05 ms)   7.04 ms ▂███
                                     (  0.00  b … 524.00 kb)  69.22 kb ██████▄▃▄▆▇█▃▄▄▃▃▂▁▂▂

'view-ignored'.browserScan(NPM, skipInternal)   3.03 ms/iter   3.19 ms  █
                                         (2.35 ms … 5.79 ms)   5.47 ms  █▆
                                     (  0.00  b …   3.26 mb)  38.77 kb ████▆▅▂▂▂▂▄▅▃▂▂▃▁▂▁▁▁

'view-ignored'.scan(NPM)                       44.16 ms/iter  46.33 ms                     █
                                       (41.35 ms … 46.56 ms)  46.36 ms           █         █
                                     (312.00 kb …   1.98 mb) 820.36 kb ███▁█▁█▁▁▁█▁▁▁▁█▁█▁▁█

'view-ignored'.browserScan(NPM)                42.21 ms/iter  43.02 ms   █    █      █
                                       (40.55 ms … 44.05 ms)  43.63 ms ▅ █    █▅▅    █ ▅  ▅▅
                                     ( 52.00 kb …   3.79 mb) 870.91 kb █▁█▁▁▁▁███▁▁▁▁█▁█▁▁██

'ignore-walk'.walk(.gitignore, .npmignore)       1.08 s/iter    1.09 s    ██
                                        (918.48 ms … 1.47 s)    1.34 s ▅▅ ██▅▅ ▅ ▅         ▅
                                     (  3.35 mb …   9.60 mb)   7.61 mb ██▁████▁█▁█▁▁▁▁▁▁▁▁▁█

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 3.94 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 3.03 ms
                     'view-ignored'.scan(NPM) ┤■ 44.16 ms
              'view-ignored'.browserScan(NPM) ┤■ 42.21 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 1.08 s
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.3x faster than 'view-ignored'.scan(NPM, skipInternal)
   13.94x faster than 'view-ignored'.browserScan(NPM)
   14.58x faster than 'view-ignored'.scan(NPM)
   356.38x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```

<!-- BENCH_BUN_LOW_END -->

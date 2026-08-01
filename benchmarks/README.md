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
clk: ~3.63 GHz
cpu: Intel(R) Xeon(R) 6973P-C
runtime: node 26.5.1 (x64-linux)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(Git, skipInternal)        970.64 µs/iter 964.10 µs  █▇
                                       (834.55 µs … 3.25 ms)   1.88 ms  ██
                                     ( 26.02 kb …   3.52 mb) 292.30 kb ▃███▃▃▂▂▂▁▁▁▁▁▁▁▁▁▁▁▁

'view-ignored'.browserScan(Git, skipInternal) 949.55 µs/iter 947.63 µs   █
                                       (842.15 µs … 2.79 ms)   1.61 ms  ▄█▆
                                     ( 90.70 kb …   1.33 mb) 262.41 kb ▂███▄▁▁▂▂▁▁▁▁▁▁▁▁▁▁▁▁

'view-ignored'.scan(Git)                        1.54 ms/iter   1.56 ms   ▃█▂
                                         (1.37 ms … 3.61 ms)   2.13 ms   ███▆
                                     (341.26 kb …   1.63 mb) 934.25 kb ▃▇████▇▅▃▃▁▁▁▁▂▂▂▁▁▁▁

'view-ignored'.browserScan(Git)                 1.55 ms/iter   1.57 ms   ██
                                         (1.39 ms … 2.45 ms)   2.25 ms  ▂███
                                     (325.70 kb …   1.56 mb) 931.21 kb ▄█████▄▂▁▁▁▁▁▁▁▁▁▁▁▁▂

'ignore-walk'.walk(.gitignore)                  5.79 ms/iter   5.96 ms   ██▇▇
                                         (5.22 ms … 7.89 ms)   7.20 ms  ▃████▅▃▂▃
                                     (  5.85 mb …   7.50 mb)   7.04 mb ▇█████████▇▄▄▁▁▄▄▁▁▁▄

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 970.64 µs
'view-ignored'.browserScan(Git, skipInternal) ┤ 949.55 µs
                     'view-ignored'.scan(Git) ┤■■■■ 1.54 ms
              'view-ignored'.browserScan(Git) ┤■■■■ 1.55 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 5.79 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.02x faster than 'view-ignored'.scan(Git, skipInternal)
   1.62x faster than 'view-ignored'.scan(Git)
   1.63x faster than 'view-ignored'.browserScan(Git)
   6.09x faster than 'ignore-walk'.walk(.gitignore)

Git Init benchmark
clk: ~3.88 GHz
cpu: Intel(R) Xeon(R) 6973P-C
runtime: node 26.5.1 (x64-linux)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
'view-ignored'.Git.init      115.63 µs/iter 126.18 µs        ▄█▆
                     (81.25 µs … 301.84 µs) 151.62 µs      ▇█████▆▃▆▅▅
                    (  7.96 kb … 591.38 kb)   9.73 kb ▁▁▃▅█████████████▅▃▂▁

                             ┌                                            ┐
     'view-ignored'.Git.init ┤ 115.63 µs
                             └                                            ┘

NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~3.94 GHz
cpu: Intel(R) Xeon(R) 6973P-C
runtime: node 26.5.1 (x64-linux)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(NPM, skipInternal)        527.86 µs/iter 533.30 µs   █
                                       (425.74 µs … 4.58 ms)   1.12 ms  ██▅
                                     (  1.15 kb …   1.79 mb) 242.95 kb ▂███▆▃▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁

'view-ignored'.browserScan(NPM, skipInternal) 513.49 µs/iter 518.04 µs    ▄██
                                       (430.31 µs … 1.82 ms) 711.30 µs   ▂███▇▂
                                     ( 28.48 kb … 995.74 kb) 229.04 kb ▁▃██████▇▄▂▂▂▂▁▂▂▁▁▁▁

'view-ignored'.scan(NPM)                        1.33 ms/iter   1.34 ms   ▄█▄
                                         (1.19 ms … 2.44 ms)   1.83 ms  ▂███▄
                                     (265.06 kb …   1.81 mb)   1.04 mb ▃█████▇▄▂▂▂▂▂▂▂▁▂▂▁▁▁

'view-ignored'.browserScan(NPM)                 1.32 ms/iter   1.34 ms   ▇█
                                         (1.18 ms … 2.42 ms)   1.90 ms  ▆██▇▄
                                     ( 56.77 kb …   1.87 mb)   1.04 mb ▃██████▃▁▁▁▁▁▁▂▁▁▂▁▁▂

'ignore-walk'.walk(.gitignore, .npmignore)      5.59 ms/iter   5.68 ms    ▃ █
                                         (5.14 ms … 7.73 ms)   6.75 ms  ▃▆█▇█▇ ▅
                                     (  6.07 mb …   7.79 mb)   7.10 mb ▄████████▂▁▂▂▆▁▂▁▁▂▁▂

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 527.86 µs
'view-ignored'.browserScan(NPM, skipInternal) ┤ 513.49 µs
                     'view-ignored'.scan(NPM) ┤■■■■■ 1.33 ms
              'view-ignored'.browserScan(NPM) ┤■■■■■ 1.32 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 5.59 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.03x faster than 'view-ignored'.scan(NPM, skipInternal)
   2.57x faster than 'view-ignored'.browserScan(NPM)
   2.59x faster than 'view-ignored'.scan(NPM)
   10.88x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```

<!-- BENCH_NODE_END -->

#### Low-end

<!-- BENCH_NODE_LOW_START -->

```txt
$ node --expose-gc benchmarks/git.js && node --expose-gc benchmarks/npm.js

Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~3.32 GHz
cpu: Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz
runtime: node 24.14.0 (x64-linux)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(Git, skipInternal)          1.09 ms/iter   1.00 ms  █
                                       (768.02 µs … 7.79 ms)   3.88 ms  █
                                     (  1.58 kb …   1.79 mb) 268.23 kb ▃█▃▃▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁

'view-ignored'.browserScan(Git, skipInternal)   1.02 ms/iter 958.73 µs  █
                                       (840.81 µs … 7.23 ms)   3.13 ms ▂█
                                     (  3.48 kb … 905.86 kb) 232.67 kb ██▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁

'view-ignored'.scan(Git)                        2.49 ms/iter   2.38 ms  █
                                         (2.25 ms … 5.27 ms)   4.84 ms ██
                                     (517.43 kb …   2.38 mb)   1.22 mb ██▃▂▁▂▂▂▁▁▂▁▁▁▁▁▁▁▁▁▂

'view-ignored'.browserScan(Git)                 2.63 ms/iter   2.48 ms █
                                         (2.25 ms … 8.76 ms)   6.62 ms █▆
                                     (358.25 kb …   2.28 mb)   1.21 mb ██▃▃▂▂▁▂▁▂▁▁▁▁▁▁▁▁▁▁▁

'ignore-walk'.walk(.gitignore)                 15.50 ms/iter  15.38 ms  █▅▃
                                       (13.85 ms … 22.43 ms)  20.51 ms  ███
                                     ( 13.28 mb …  14.04 mb)  13.50 mb █████▆▄▁▁▁▄▄▄▄▁▁▁▄▁▁▆

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 1.09 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 1.02 ms
                     'view-ignored'.scan(Git) ┤■■■ 2.49 ms
              'view-ignored'.browserScan(Git) ┤■■■■ 2.63 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 15.50 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.07x faster than 'view-ignored'.scan(Git, skipInternal)
   2.45x faster than 'view-ignored'.scan(Git)
   2.58x faster than 'view-ignored'.browserScan(Git)
   15.25x faster than 'ignore-walk'.walk(.gitignore)

NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~3.26 GHz
cpu: Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz
runtime: node 24.14.0 (x64-linux)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(NPM, skipInternal)        791.36 µs/iter 690.04 µs █
                                       (568.04 µs … 8.75 ms)   3.75 ms █▄
                                     ( 31.41 kb …   1.62 mb) 242.03 kb ██▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁

'view-ignored'.browserScan(NPM, skipInternal) 683.70 µs/iter 642.37 µs  █
                                       (560.91 µs … 6.07 ms)   2.39 ms  █
                                     (  4.21 kb …   1.31 mb) 224.66 kb ▆█▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁

'view-ignored'.scan(NPM)                        2.46 ms/iter   2.39 ms ▇█
                                         (2.31 ms … 5.41 ms)   4.33 ms ██
                                     (718.55 kb …   2.23 mb)   1.54 mb ██▃▂▁▁▂▁▁▁▁▁▁▂▁▁▁▁▁▁▁

'view-ignored'.browserScan(NPM)                 2.67 ms/iter   2.53 ms █
                                         (2.31 ms … 6.89 ms)   6.11 ms █▄
                                     (362.57 kb …   3.34 mb)   1.55 mb ██▃▃▂▂▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁

'ignore-walk'.walk(.gitignore, .npmignore)     15.07 ms/iter  14.90 ms   █
                                       (13.92 ms … 20.48 ms)  20.20 ms ▂▅█▅
                                     ( 13.28 mb …  14.02 mb)  13.43 mb ████▃▆▃▃▁▁▃▁▁▁▁▁▁▁▁▃▃

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 791.36 µs
'view-ignored'.browserScan(NPM, skipInternal) ┤ 683.70 µs
                     'view-ignored'.scan(NPM) ┤■■■■ 2.46 ms
              'view-ignored'.browserScan(NPM) ┤■■■■■ 2.67 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 15.07 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.16x faster than 'view-ignored'.scan(NPM, skipInternal)
   3.6x faster than 'view-ignored'.scan(NPM)
   3.91x faster than 'view-ignored'.browserScan(NPM)
   22.04x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```

<!-- BENCH_NODE_LOW_END -->

### Bun

<!-- BENCH_BUN_START -->

```txt
$ bun run --expose-gc benchmarks/git.js && bun run --expose-gc benchmarks/npm.js
Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~3.93 GHz
cpu: Intel(R) Xeon(R) 6973P-C
runtime: bun 1.3.14 (x64-linux)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(Git, skipInternal)        539.13 µs/iter 535.78 µs   █
                                       (375.41 µs … 2.77 ms)   1.41 ms  ▃█▃
                                     (  0.00  b …   1.63 mb)  22.24 kb ▃███▅▃▂▂▁▁▁▁▂▁▁▁▁▁▁▁▁

'view-ignored'.browserScan(Git, skipInternal) 490.67 µs/iter 494.29 µs    █
                                       (355.22 µs … 1.99 ms)   1.01 ms   ▂██
                                     (  0.00  b … 256.00 kb)   5.78 kb ▂▃███▇▄▂▂▁▁▁▁▁▁▁▁▁▁▂▁

'view-ignored'.scan(Git)                      998.12 µs/iter 998.54 µs   ▅█
                                       (829.07 µs … 2.53 ms)   1.62 ms  ▄██▆
                                     (  0.00  b …   1.00 mb)  26.64 kb ▁█████▄▂▂▂▁▁▁▁▂▂▂▂▂▂▁

'view-ignored'.browserScan(Git)               998.95 µs/iter 994.15 µs   ▄█
                                       (845.69 µs … 2.49 ms)   1.56 ms   ██▇
                                     (  0.00  b … 640.00 kb)   6.36 kb ▂████▇▃▂▂▁▁▁▁▁▁▁▂▃▂▁▁

'ignore-walk'.walk(.gitignore)                  5.81 ms/iter   6.03 ms  ▅█
                                         (5.30 ms … 8.46 ms)   7.73 ms  ██   ▃
                                     (  0.00  b …   1.88 mb)  93.19 kb ▄██▅▆▄██▅▃▄▁▂▁▁▁▁▁▁▁▂

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 539.13 µs
'view-ignored'.browserScan(Git, skipInternal) ┤ 490.67 µs
                     'view-ignored'.scan(Git) ┤■■■ 998.12 µs
              'view-ignored'.browserScan(Git) ┤■■■ 998.95 µs
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 5.81 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.1x faster than 'view-ignored'.scan(Git, skipInternal)
   2.03x faster than 'view-ignored'.scan(Git)
   2.04x faster than 'view-ignored'.browserScan(Git)
   11.83x faster than 'ignore-walk'.walk(.gitignore)

Git Init benchmark
clk: ~3.83 GHz
cpu: Intel(R) Xeon(R) 6973P-C
runtime: bun 1.3.14 (x64-linux)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
'view-ignored'.Git.init       35.28 µs/iter  35.29 µs         █
                     (19.00 µs … 463.52 µs)  55.14 µs        ▄██
                    (  0.00  b …   1.25 mb) 488.57  b ▁▁▁▁▂▂▃███▆▃▂▂▁▁▁▁▁▁▁

                             ┌                                            ┐
     'view-ignored'.Git.init ┤ 35.28 µs
                             └                                            ┘

NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~3.61 GHz
cpu: Intel(R) Xeon(R) 6973P-C
runtime: bun 1.3.14 (x64-linux)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(NPM, skipInternal)        336.35 µs/iter 338.84 µs   █
                                       (248.50 µs … 1.41 ms) 760.53 µs  ██▄
                                     (  0.00  b … 896.00 kb)  11.90 kb ▂███▆▅▃▂▂▂▂▂▁▁▁▁▁▁▁▁▁

'view-ignored'.browserScan(NPM, skipInternal) 305.45 µs/iter 305.62 µs  ▄█
                                       (250.91 µs … 1.05 ms) 725.36 µs  ██
                                     (  0.00  b … 384.00 kb)   4.62 kb ▃███▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁

'view-ignored'.scan(NPM)                      939.06 µs/iter 930.55 µs   █▄
                                       (811.97 µs … 1.63 ms)   1.47 ms   ██
                                     (  0.00  b …   1.13 mb)  22.53 kb ▂████▄▂▁▂▁▂▁▁▁▁▁▁▂▂▂▂

'view-ignored'.browserScan(NPM)               960.91 µs/iter 973.35 µs   ▄█▃
                                       (783.42 µs … 1.85 ms)   1.55 ms  ▂███▅
                                     (  0.00  b … 640.00 kb)   5.01 kb ▂█████▅▄▂▂▂▂▂▂▂▂▂▂▂▂▁

'ignore-walk'.walk(.gitignore, .npmignore)      5.90 ms/iter   6.16 ms   █
                                         (5.39 ms … 7.70 ms)   6.89 ms  ▅███▂  ▄ ▄
                                     (  0.00  b …   2.38 mb) 102.63 kb ██████▅▆█▅███▅▁▅▄▄▄▁▂

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 336.35 µs
'view-ignored'.browserScan(NPM, skipInternal) ┤ 305.45 µs
                     'view-ignored'.scan(NPM) ┤■■■■ 939.06 µs
              'view-ignored'.browserScan(NPM) ┤■■■■ 960.91 µs
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 5.90 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.1x faster than 'view-ignored'.scan(NPM, skipInternal)
   3.07x faster than 'view-ignored'.scan(NPM)
   3.15x faster than 'view-ignored'.browserScan(NPM)
   19.32x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
Post job cleanup.
Post job cleanup.
[command]/usr/bin/tar --posix -cf cache.tzst --exclude cache.tzst -P -C /home/runner/work/view-ignored/view-ignored --files-from manifest.txt --use-compress-program zstdmt
Sent 33843768 of 33843768 (100.0%), 39.7 MBs/sec
Post job cleanup.
[command]/usr/bin/git version
git version 2.54.0
Temporarily overriding HOME='/home/runner/work/_temp/e0cadfcd-9a01-4504-aaf0-8758d389cd27' before making global git config changes
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
/home/runner/work/_temp/git-credentials-4d72563b-b5cf-432b-95e8-4f902e58792a.config
[command]/usr/bin/git config --local --unset includeif.gitdir:/home/runner/work/view-ignored/view-ignored/.git.path /home/runner/work/_temp/git-credentials-4d72563b-b5cf-432b-95e8-4f902e58792a.config
[command]/usr/bin/git config --local --get-all includeif.gitdir:/home/runner/work/view-ignored/view-ignored/.git/worktrees/*.path
/home/runner/work/_temp/git-credentials-4d72563b-b5cf-432b-95e8-4f902e58792a.config
[command]/usr/bin/git config --local --unset includeif.gitdir:/home/runner/work/view-ignored/view-ignored/.git/worktrees/*.path /home/runner/work/_temp/git-credentials-4d72563b-b5cf-432b-95e8-4f902e58792a.config
[command]/usr/bin/git config --local --get-all includeif.gitdir:/github/workspace/.git.path
/github/runner_temp/git-credentials-4d72563b-b5cf-432b-95e8-4f902e58792a.config
[command]/usr/bin/git config --local --unset includeif.gitdir:/github/workspace/.git.path /github/runner_temp/git-credentials-4d72563b-b5cf-432b-95e8-4f902e58792a.config
[command]/usr/bin/git config --local --get-all includeif.gitdir:/github/workspace/.git/worktrees/*.path
/github/runner_temp/git-credentials-4d72563b-b5cf-432b-95e8-4f902e58792a.config
[command]/usr/bin/git config --local --unset includeif.gitdir:/github/workspace/.git/worktrees/*.path /github/runner_temp/git-credentials-4d72563b-b5cf-432b-95e8-4f902e58792a.config
[command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
Removing credentials config '/home/runner/work/_temp/git-credentials-4d72563b-b5cf-432b-95e8-4f902e58792a.config'
Cleaning up orphan processes
```

<!-- BENCH_BUN_END -->

#### Low-end

<!-- BENCH_BUN_LOW_START -->

```txt
$ bun run --expose-gc benchmarks/git.js && bun run --expose-gc benchmarks/npm.js

Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~3.25 GHz
cpu: Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz
runtime: bun 1.3.14 (x64-linux)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(Git, skipInternal)        764.70 µs/iter 763.63 µs █▂
                                       (515.88 µs … 4.56 ms)   2.78 ms ██
                                     (  0.00  b …   3.63 mb)  25.25 kb ██▅▅▄▂▃▂▁▁▂▁▁▁▁▁▁▁▁▂▁

'view-ignored'.browserScan(Git, skipInternal) 693.89 µs/iter 620.02 µs █▇
                                       (501.77 µs … 3.45 ms)   2.37 ms ██
                                     (  0.00  b … 384.00 kb)   4.31 kb ██▂▂▄▃▃▃▂▁▁▁▁▁▁▁▁▁▁▁▁

'view-ignored'.scan(Git)                        2.44 ms/iter   2.55 ms █
                                         (1.80 ms … 6.75 ms)   5.35 ms █▇
                                     (  0.00  b …   1.50 mb)  54.99 kb ██▃▂▅▃▂▂▂▂▂▃▂▂▁▁▁▁▂▁▂

'view-ignored'.browserScan(Git)                 2.00 ms/iter   1.93 ms  █
                                         (1.75 ms … 4.14 ms)   3.61 ms  █
                                     (  0.00  b … 512.00 kb)  16.79 kb ▅██▂▁▂▂▃▃▂▁▁▁▁▁▁▁▁▁▁▁

'ignore-walk'.walk(.gitignore)                 19.42 ms/iter  20.02 ms  ▄ █
                                       (17.60 ms … 26.01 ms)  24.16 ms ████
                                     (  0.00  b …   2.38 mb) 256.00 kb █████▅▁█▅▁▅▅▁▅▁▅▅▁▁▁▅

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 764.70 µs
'view-ignored'.browserScan(Git, skipInternal) ┤ 693.89 µs
                     'view-ignored'.scan(Git) ┤■■■ 2.44 ms
              'view-ignored'.browserScan(Git) ┤■■ 2.00 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 19.42 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.1x faster than 'view-ignored'.scan(Git, skipInternal)
   2.88x faster than 'view-ignored'.browserScan(Git)
   3.52x faster than 'view-ignored'.scan(Git)
   27.99x faster than 'ignore-walk'.walk(.gitignore)

NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~1.66 GHz
cpu: Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz
runtime: bun 1.3.14 (x64-linux)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(NPM, skipInternal)        561.57 µs/iter 535.54 µs █▃
                                       (383.81 µs … 3.62 ms)   2.26 ms ██
                                     (  0.00  b … 896.00 kb)  13.81 kb ██▅▄▃▂▂▂▂▂▁▁▁▁▁▁▁▁▁▁▁

'view-ignored'.browserScan(NPM, skipInternal) 471.55 µs/iter 439.64 µs  █
                                       (374.07 µs … 3.25 ms)   1.57 ms ▂█
                                     (  0.00  b … 640.00 kb)   5.01 kb ██▃▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁

'view-ignored'.scan(NPM)                        2.22 ms/iter   2.30 ms  █
                                         (1.82 ms … 5.16 ms)   4.73 ms ▇█
                                     (  0.00  b …   1.50 mb)  42.25 kb ██▃▂▅▃▂▂▂▁▁▁▂▁▁▁▁▁▁▁▂

'view-ignored'.browserScan(NPM)                 2.02 ms/iter   1.99 ms  █
                                         (1.80 ms … 4.09 ms)   3.26 ms  █▄
                                     (  0.00  b … 256.00 kb)  15.86 kb ▆██▄▂▁▁▂▃▃▂▁▁▁▁▁▁▁▁▁▁

'ignore-walk'.walk(.gitignore, .npmignore)     18.95 ms/iter  19.39 ms  █
                                       (17.68 ms … 23.65 ms)  23.26 ms  █▃
                                     (  0.00  b …   1.88 mb) 217.60 kb ▇██▃▃▅▅▃▃▁▅▁▃▁▃▁▁▁▁▁▃

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 561.57 µs
'view-ignored'.browserScan(NPM, skipInternal) ┤ 471.55 µs
                     'view-ignored'.scan(NPM) ┤■■■ 2.22 ms
              'view-ignored'.browserScan(NPM) ┤■■■ 2.02 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 18.95 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.19x faster than 'view-ignored'.scan(NPM, skipInternal)
   4.28x faster than 'view-ignored'.browserScan(NPM)
   4.71x faster than 'view-ignored'.scan(NPM)
   40.19x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```

<!-- BENCH_BUN_LOW_END -->

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

Running benchmarks\target_git.js
Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~1.99 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.2.0 (x64-win32)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(Git, skipInternal)          3.00 ms/iter   3.20 ms  █
                                         (2.52 ms … 5.64 ms)   4.80 ms  █▆▃
                                     ( 86.26 kb …   2.23 mb) 405.10 kb ▄███▇▅█▅▅▃▂▂▃▁▁▁▁▁▁▂▂

'view-ignored'.browserScan(Git, skipInternal)   2.78 ms/iter   2.80 ms   █
                                         (2.48 ms … 4.84 ms)   4.35 ms  ▄█▂
                                     (269.14 kb …   1.00 mb) 337.08 kb ▂███▄▄▄▂▁▂▂▁▁▁▁▁▁▁▁▁▁

'view-ignored'.scan(Git)                       22.49 ms/iter  25.96 ms                    █
                                       (17.25 ms … 27.36 ms)  27.06 ms ▇▂▇  ▇         ▂ ▇ █
                                     (  8.44 mb …   9.56 mb)   8.73 mb ███▁▁█▁▆▁▆▁▁▆▆▁█▁█▆█▆

'view-ignored'.browserScan(Git)                18.89 ms/iter  21.48 ms  █   ▃
                                       (14.79 ms … 26.45 ms)  26.45 ms ▂█▂▇▇█   ▇    ▂    ▂
                                     (435.21 kb …   9.53 mb)   8.34 mb ██████▁▆▁█▆▆▆▆█▁▁▁▁█▆

'ignore-walk'.walk(.gitignore)                771.48 ms/iter 801.72 ms █
                                     (718.05 ms … 829.00 ms) 818.72 ms █  ▅▅▅   ▅    ▅ ▅▅▅ ▅
                                     (  2.33 mb …   6.98 mb)   4.49 mb █▁▁███▁▁▁█▁▁▁▁█▁███▁█

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 3.00 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 2.78 ms
                     'view-ignored'.scan(Git) ┤■ 22.49 ms
              'view-ignored'.browserScan(Git) ┤■ 18.89 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 771.48 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.08x faster than 'view-ignored'.scan(Git, skipInternal)
   6.78x faster than 'view-ignored'.browserScan(Git)
   8.08x faster than 'view-ignored'.scan(Git)
   277.11x faster than 'ignore-walk'.walk(.gitignore)

Running benchmarks\target_npm.js
NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~1.96 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: node 26.2.0 (x64-win32)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(NPM, skipInternal)          2.05 ms/iter   2.25 ms   ▂▇█
                                         (1.56 ms … 4.59 ms)   3.54 ms █▅███ ▄▄▂
                                     ( 40.55 kb …   1.59 mb) 274.28 kb █████████▅▃▅▃▃▃▂▁▂▁▁▁

'view-ignored'.browserScan(NPM, skipInternal)   1.74 ms/iter   1.77 ms  █
                                         (1.54 ms … 4.70 ms)   2.85 ms  █▄
                                     (113.59 kb … 594.15 kb) 230.33 kb ████▅▃▃▃▂▁▂▁▁▁▁▁▁▁▁▁▁

'view-ignored'.scan(NPM)                       32.22 ms/iter  34.63 ms            █   █  █
                                       (24.81 ms … 42.13 ms)  38.16 ms ▅ ▅▅▅▅ ▅ ▅ █▅▅ █  █ ▅
                                     ( 10.19 mb …  12.31 mb)  11.95 mb █▁████▁█▁█▁███▁█▁▁█▁█

'view-ignored'.browserScan(NPM)                31.05 ms/iter  33.20 ms █             ██
                                       (23.40 ms … 44.10 ms)  36.12 ms █   █        ████
                                     ( 11.38 mb …  12.88 mb)  12.10 mb █▁▁██▁▁▁▁▁▁▁▁████▁█▁█

'ignore-walk'.walk(.gitignore, .npmignore)    724.94 ms/iter 725.70 ms   █
                                     (702.29 ms … 792.73 ms) 754.14 ms   █
                                     (  1.50 mb …   8.29 mb)   4.72 mb █▁██▁█▁████▁▁▁▁▁▁▁▁▁█

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 2.05 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 1.74 ms
                     'view-ignored'.scan(NPM) ┤■ 32.22 ms
              'view-ignored'.browserScan(NPM) ┤■ 31.05 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 724.94 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.18x faster than 'view-ignored'.scan(NPM, skipInternal)
   17.86x faster than 'view-ignored'.browserScan(NPM)
   18.54x faster than 'view-ignored'.scan(NPM)
   417.04x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
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

Running benchmarks\target_git.js
Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~0.92 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.4.0 (x64-win32)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(Git, skipInternal)          3.15 ms/iter   3.46 ms  █▃
                                         (2.45 ms … 5.48 ms)   5.23 ms ▂██▃
                                     (  0.00  b … 436.00 kb)  41.16 kb █████▇▃▁▃▃▅▄▂▁▅▁▃▂▄▁▂

'view-ignored'.browserScan(Git, skipInternal)   2.88 ms/iter   2.87 ms  ██
                                         (2.31 ms … 5.66 ms)   5.06 ms  ██▂
                                     (  0.00  b … 840.00 kb)  26.37 kb ▂███▆▅▁▁▁▁▂▆▃▃▂▁▁▂▁▁▂

'view-ignored'.scan(Git)                       23.18 ms/iter  23.82 ms  ▂    █
                                       (20.09 ms … 28.56 ms)  28.50 ms ▅█▅  ▅█▅▅ ▅   ▅
                                     (120.00 kb …   2.56 mb) 662.00 kb ███▁▇████▇█▁▁▁█▁▁▁▁▇▇

'view-ignored'.browserScan(Git)                22.58 ms/iter  23.85 ms     ███
                                       (18.79 ms … 28.76 ms)  28.35 ms   ▅ ███       ▅
                                     (  4.00 kb …   6.52 mb) 665.28 kb ▇▁█▇███▇▁▇▁▇▇▇█▁▁▇▁▁▇

'ignore-walk'.walk(.gitignore)                785.22 ms/iter 784.85 ms       █
                                     (767.47 ms … 832.27 ms) 806.67 ms █     █
                                     (880.00 kb …   8.98 mb)   6.43 mb █▁▁█▁███▁█▁▁▁▁█▁▁▁▁▁█

                                              ┌                                            ┐
       'view-ignored'.scan(Git, skipInternal) ┤ 3.15 ms
'view-ignored'.browserScan(Git, skipInternal) ┤ 2.88 ms
                     'view-ignored'.scan(Git) ┤■ 23.18 ms
              'view-ignored'.browserScan(Git) ┤■ 22.58 ms
               'ignore-walk'.walk(.gitignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 785.22 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(Git, skipInternal)
   1.09x faster than 'view-ignored'.scan(Git, skipInternal)
   7.85x faster than 'view-ignored'.browserScan(Git)
   8.05x faster than 'view-ignored'.scan(Git)
   272.86x faster than 'ignore-walk'.walk(.gitignore)

Running benchmarks\target_npm.js
NPM target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~0.99 GHz
cpu: Intel(R) Pentium(R) Silver N6000 @ 1.10GHz
runtime: bun 1.4.0 (x64-win32)

benchmark                                    avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------------------ -------------------------------
'view-ignored'.scan(NPM, skipInternal)          1.84 ms/iter   1.92 ms   █
                                         (1.31 ms … 4.14 ms)   3.61 ms  ▇██▄▂
                                     (  0.00  b …   1.05 mb)  32.17 kb ▃█████▆▃▄▃▃▃▂▂▂▁▂▂▂▂▂

'view-ignored'.browserScan(NPM, skipInternal)   1.58 ms/iter   1.58 ms  █
                                         (1.26 ms … 3.05 ms)   2.90 ms  ██▆▂
                                     (  0.00  b … 156.00 kb)   7.26 kb ▄████▆▂▃▂▁▁▁▁▁▃▂▂▂▁▁▁

'view-ignored'.scan(NPM)                       22.53 ms/iter  25.45 ms      █
                                       (17.50 ms … 28.61 ms)  27.48 ms   ▅ ▅█▅       ▅▅▅▅
                                     ( 56.00 kb …   2.74 mb) 481.50 kb ▇▇█▇███▁▁▇▁▇▇▁████▇▇▇

'view-ignored'.browserScan(NPM)                21.99 ms/iter  24.14 ms  █  ▃
                                       (18.96 ms … 27.70 ms)  27.07 ms ▂█▇ █  ▇  ▂  ▂
                                     ( 28.00 kb … 532.00 kb) 195.00 kb ███▁█▆▁█▁▁█▁▁█▁▆▆▆▁▆▆

'ignore-walk'.walk(.gitignore, .npmignore)    789.52 ms/iter 791.47 ms             █  █
                                        (733.61 ms … 1.00 s) 810.20 ms ▅▅▅ ▅  ▅    █  █  ▅ ▅
                                     (  2.86 mb …   8.38 mb)   6.45 mb ███▁█▁▁█▁▁▁▁█▁▁█▁▁█▁█

                                              ┌                                            ┐
       'view-ignored'.scan(NPM, skipInternal) ┤ 1.84 ms
'view-ignored'.browserScan(NPM, skipInternal) ┤ 1.58 ms
                     'view-ignored'.scan(NPM) ┤■ 22.53 ms
              'view-ignored'.browserScan(NPM) ┤■ 21.99 ms
   'ignore-walk'.walk(.gitignore, .npmignore) ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 789.52 ms
                                              └                                            ┘

summary
  'view-ignored'.browserScan(NPM, skipInternal)
   1.16x faster than 'view-ignored'.scan(NPM, skipInternal)
   13.93x faster than 'view-ignored'.browserScan(NPM)
   14.27x faster than 'view-ignored'.scan(NPM)
   500.21x faster than 'ignore-walk'.walk(.gitignore, .npmignore)
```

<!-- BENCH_BUN_LOW_END -->

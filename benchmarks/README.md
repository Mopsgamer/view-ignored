# `view-ignored` benchmarks

## `view-ignored` Git vs `ignore-walk`

```txt
$ node --expose-gc benchmarks/*.js
Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~2.75 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: node 25.9.0 (x64-linux)
benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
scan (fast)                    2.53 ms/iter   2.55 ms   ▄█
                        (2.28 ms … 4.26 ms)   3.52 ms  ▃███
                    (145.77 kb …   2.10 mb) 559.41 kb ▁█████▅▂▂▂▃▂▂▁▁▁▂▁▁▁▁
browserScan (fast)             2.47 ms/iter   2.51 ms      ▂█▆ ▄
                        (2.30 ms … 4.24 ms)   2.76 ms   ▃▇████▅█▇
                    (264.35 kb … 753.07 kb) 503.55 kb ▃▅██████████▃▃▃▃▂▂▁▂▂
scan                         217.58 ms/iter 217.14 ms   █
                    (204.22 ms … 243.15 ms) 242.02 ms   █ █  █
                    ( 42.02 mb …  43.03 mb)  42.43 mb █▁███▁▁█▁▁▁▁▁▁█▁▁▁▁▁█
browserScan                  214.18 ms/iter 220.49 ms       █            █
                    (202.83 ms … 222.41 ms) 221.42 ms ▅     █▅ ▅▅  ▅  ▅  █▅
                    ( 42.09 mb …  42.22 mb)  42.15 mb █▁▁▁▁▁██▁██▁▁█▁▁█▁▁██
ignoreWalk                     4.99 ms/iter   5.52 ms  █
                        (4.28 ms … 7.28 ms)   7.19 ms  █▃
                    (  2.81 mb …   4.82 mb)   4.06 mb ▄██▃▅▂▃▁▂▁▁▃▆▃▃▃▂▁▁▁▁
                             ┌                                            ┐
                 scan (fast) ┤ 2.53 ms
          browserScan (fast) ┤ 2.47 ms
                        scan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 217.58 ms
                 browserScan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 214.18 ms
                  ignoreWalk ┤ 4.99 ms
                             └                                            ┘
summary
  browserScan (fast)
   1.02x faster than scan (fast)
   2.02x faster than ignoreWalk
   86.75x faster than browserScan
   88.12x faster than scan
```

```txt
$ bun run --expose-gc benchmarks/*.js
Git target benchmark
You can use --igw to test ignore-walk separately
You can use --vign to test view-ignored separately
clk: ~2.70 GHz
cpu: AMD EPYC 9V74 80-Core Processor
runtime: bun 1.3.14 (x64-linux)
benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
scan (fast)                    1.81 ms/iter   1.85 ms   ▇█
                        (1.52 ms … 3.19 ms)   2.72 ms  ███▄
                    (  0.00  b …   3.00 mb)  49.70 kb ▃████▇▃▂▃▃▅▅▅▂▂▂▂▂▂▁▂
browserScan (fast)             1.86 ms/iter   1.96 ms   ▆▅█▇▅ ▆
                        (1.52 ms … 2.70 ms)   2.57 ms  █████████
                    (  0.00  b … 512.00 kb)   8.33 kb ▃█████████▆▃▇▃▆▃▂▄▄▃▂
scan                         113.13 ms/iter 120.27 ms     █
                    (101.20 ms … 124.51 ms) 123.77 ms     █     █
                    (  1.00 mb …  11.33 mb)   3.13 mb █▁▁▁█▁▁▁█▁██▁▁▁▁▁█▁██
browserScan                  111.00 ms/iter 112.56 ms         █
                    (101.91 ms … 124.95 ms) 120.29 ms ▅ ▅ ▅▅▅ █  ▅▅     ▅ ▅
                    (128.00 kb …   4.88 mb)   1.04 mb █▁█▁███▁█▁▁██▁▁▁▁▁█▁█
ignoreWalk                     6.72 ms/iter   6.96 ms  █ ▃
                        (5.77 ms … 9.93 ms)   9.69 ms ▃█ █
                    (  0.00  b …   1.25 mb)  86.93 kb ██▇█▇▅▃▂▄▃▃▁▅▂▄▁▃▂▄▁▃
                             ┌                                            ┐
                 scan (fast) ┤ 1.81 ms
          browserScan (fast) ┤ 1.86 ms
                        scan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 113.13 ms
                 browserScan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 111.00 ms
                  ignoreWalk ┤■ 6.72 ms
                             └                                            ┘
summary
  scan (fast)
   1.02x faster than browserScan (fast)
   3.7x faster than ignoreWalk
   61.16x faster than browserScan
   62.33x faster than scan
```

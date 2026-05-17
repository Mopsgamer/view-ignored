# `view-ignored` benchmarks

## Git + `ignore-walk`

```txt
$ node --expose-gc scripts/benchmark.js
clk: ~3.36 GHz
cpu: Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz
runtime: node 25.9.0 (x64-linux)
benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
scan (fast)                    2.24 ms/iter   2.28 ms    █                 
                        (1.99 ms … 4.26 ms)   3.25 ms  ▇██▇▃               
                    ( 72.98 kb …   1.44 mb) 527.95 kb ▄█████▅▄▂▂▂▁▁▂▂▁▁▁▁▁▂
browserScan (fast)             2.14 ms/iter   2.21 ms     ▅▄▄▇ █▇▃         
                        (1.92 ms … 2.62 ms)   2.46 ms    ▃████████▆        
                    (116.73 kb …   1.19 mb) 483.28 kb ▃▃▆███████████▅▅▄▄▁▂▂
scan                         199.45 ms/iter 204.04 ms  █                   
                    (194.32 ms … 210.11 ms) 204.59 ms  █           ▅      ▅
                    ( 42.18 mb …  43.03 mb)  42.50 mb ▇█▇▁▁▁▁▁▁▁▁▁▁█▁▁▁▁▁▇█
browserScan                  194.47 ms/iter 203.85 ms ███   █ ███    █  ███
                    (178.91 ms … 214.02 ms) 207.28 ms ███   █ ███    █  ███
                    ( 42.10 mb …  42.15 mb)  42.12 mb ███▁▁▁█▁███▁▁▁▁█▁▁███
ignoreWalk                     5.76 ms/iter   6.66 ms  █                   
                        (4.63 ms … 8.70 ms)   7.70 ms ██           ▅▄      
                    (  3.22 mb …   4.80 mb)   4.00 mb ███▂▆▄▂▄▃▂▅▁███▃▄▅▃▁▂
                             ┌                                            ┐
                 scan (fast) ┤ 2.24 ms
          browserScan (fast) ┤ 2.14 ms
                        scan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 199.45 ms
                 browserScan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 194.47 ms
                  ignoreWalk ┤■ 5.76 ms
                             └                                            ┘
summary
  browserScan (fast)
   1.05x faster than scan (fast)
   2.68x faster than ignoreWalk
   90.67x faster than browserScan
   92.99x faster than scan
```

```txt
$ bun run --expose-gc scripts/benchmark.js
clk: ~1.70 GHz
cpu: Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz
runtime: bun 1.3.10 (x64-linux)
benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
scan (fast)                    1.83 ms/iter   1.86 ms   █                  
                        (1.50 ms … 3.81 ms)   3.16 ms  ██▅                 
                    (  0.00  b …   2.13 mb)  48.11 kb ▃███▅▃▂▂▄▄▃▂▃▁▁▁▁▁▁▂▁
browserScan (fast)             1.75 ms/iter   1.89 ms    █▇                
                        (1.45 ms … 2.68 ms)   2.55 ms  ▂▇██▂               
                    (  0.00  b … 256.00 kb)   5.54 kb ▄█████▅▃▅▅▇▅▄▄▃▃▂▂▁▁▂
scan                         123.32 ms/iter 125.36 ms █   █                
                    (115.13 ms … 137.07 ms) 134.03 ms █ ▅ █  ▅ ▅▅▅   ▅    ▅
                    (676.00 kb …   5.12 mb)   1.62 mb █▁█▁█▁▁█▁███▁▁▁█▁▁▁▁█
browserScan                  116.95 ms/iter 122.18 ms              █       
                     (97.35 ms … 126.21 ms) 124.32 ms              █       
                    (  0.00  b …   1.38 mb) 805.82 kb █▁▁▁▁▁▁▁▁▁▁█▁███▁████
ignoreWalk                     6.81 ms/iter   6.98 ms  █  ▃                
                       (6.02 ms … 11.14 ms)  10.45 ms ██ ██▂               
                    (  0.00  b …   2.00 mb) 100.94 kb ██▆███▅▃▄▂▁▂▁▁▁▁▂▁▁▂▂
                             ┌                                            ┐
                 scan (fast) ┤ 1.83 ms
          browserScan (fast) ┤ 1.75 ms
                        scan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 123.32 ms
                 browserScan ┤■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 116.95 ms
                  ignoreWalk ┤■ 6.81 ms
                             └                                            ┘
summary
  browserScan (fast)
   1.04x faster than scan (fast)
   3.89x faster than ignoreWalk
   66.81x faster than browserScan
   70.45x faster than scan
```
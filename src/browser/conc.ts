export async function conc<E>(arr: (() => Promise<E>)[], n: number): Promise<E[]> {
  // for (const elemProc of arr) {
  //   await elemProc()
  // }
  // return
  const clusters: (() => Promise<E>)[][] = Array.from({ length: n }, () => [])
  for (let i = 0; i < arr.length; i++) {
    clusters[i % n]!.push(arr[i]!)
  }

  const results: E[] = []
  const promises = clusters.map(proc => (async () => {
    for (const elemProc of proc) {
      results.push(await elemProc())
    }
  })())
  await Promise.all(promises)
  return results
}

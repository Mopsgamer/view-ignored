import walk from "ignore-walk"

console.log(`ignore-walking "${process.cwd()}"`)
const start = performance.now()
walk.sync({ ignoreFiles: [".gitignore"] })
const end = performance.now()
console.log(`- Time: ${(end - start).toFixed(2)}ms`)

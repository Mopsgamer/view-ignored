import { bench, run } from "mitata"

const path = "C:\\Users\\Jules\\Projects\\view-ignored\\src\\unixify.ts"
let sink;

bench("replaceAll", () => {
    sink = path.replaceAll("\\", "/")
})

function manualReplace(s) {
    if (s.indexOf("\\") === -1) return s
    let res = "", start = 0
    const len = s.length
    for (let i = 0; i < len; i++) {
        if (s.charCodeAt(i) === 92) {
            res += s.slice(start, i) + "/"
            start = i + 1
        }
    }
    return res + s.slice(start)
}

bench("manual concat with strings", () => {
    sink = manualReplace(path)
})

await run()

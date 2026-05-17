# Improvements
- **Functional Streams**: Eliminate the `MatcherStream` class and `EventEmitter` to strictly adhere to the "no classes" rule and reduce bundle size.
- **Node.js 18 Compatibility**: Replace `Promise.withResolvers` with a manual implementation to support the project's minimum Node.js version.
- **API Simplification**: Remove `Target.isIgnoreFile` as it can be easily derived from `Target.extractors`, reducing the surface area for target implementations.
- **RuleMatch Flattening**: Replace the complex 9-interface hierarchy for `RuleMatch` with a single, efficient object type to reduce GC pressure and complexity.
- **Refactor `scanParallel`**: Flatten the callback-hell in `scanParallel.ts` and use a unified task-tracking mechanism instead of manual `activeTasks` counters.
- **Streamline `resolveSources`**: Simplify the absolute path resolution logic to be more linear and less recursive.

# Stats

## Public API
**Files:** `src/scan.ts`, `src/scanCb.ts`, `src/stream.ts`, `src/patterns/matcherStream.ts`, `src/types.ts`

Bloat: 58%
Refactor difficulty: 30% Human, 5% AI
Symbols:
- `MatcherStream` - Class usage is prohibited by project guidelines.
- `Promise.withResolvers` - Requires Node.js 22+, violating Node 18 compatibility.
- `EventEmitter` - Overly heavy for the required "dirent" and "end" events.
- `FsAdapter` - The interface is ambiguous about whether it requires callback or promise-based methods.
Recommended changes:
- Replace `MatcherStream` with a functional event emitter:
```typescript
export function createStream() {
    const subs = { dirent: [], end: [] };
    return {
        on: (evt, cb) => subs[evt].push(cb),
        emit: (evt, data) => subs[evt].forEach(cb => cb(data))
    };
}
```
- Replace `Promise.withResolvers` with standard Promise:
```typescript
const withResolvers = () => {
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
};
```

## Target API
**Files:** `src/targets/target.ts`, `src/patterns/rule.ts`, `src/patterns/resource.ts`, `src/patterns/extractor.ts`

Bloat: 89%
Refactor difficulty: 55% Human, 8% AI
Symbols:
- `Target.isIgnoreFile` - Redundant; can be replaced with `target.extractors.some(...)`.
- `RuleMatchBase*` (8+ interfaces) - Massive bloat in type definitions for a simple result.
- `RuleMatchKind` - Numeric enums add unnecessary complexity compared to string literals.
Recommended changes:
- Replace `Target.isIgnoreFile` with a generic check:
```typescript
const isIgnore = (target, path) => target.extractors.some(e => e.path === path);
```
- Flatten `RuleMatch` into a single interface:
```typescript
export interface RuleMatch {
    kind: 'none' | 'missingSource' | 'noMatch' | 'invalid' | 'external' | 'internal';
    ignored: boolean;
    source?: Source;
    pattern?: string;
    error?: Error;
}
```

## Internal API
**Files:** `src/scanParallel.ts`, `src/patterns/resolveSources.ts`, `src/walk.ts`, `src/patterns/matcherContextPatch.ts`

Bloat: 72%
Refactor difficulty: 78% Human, 18% AI
Symbols:
- `activeTasks` - Fragile manual counter management.
- `promiseCb` - Manual bridge between callbacks and promises is repeated in multiple files.
- `findSourceForAbsoluteDirsCb` - Deeply recursive callback logic is hard to maintain.
Recommended changes:
- Replace manual task counting with a unified scan state:
```typescript
type ScanState = { pending: number; results: WalkResult[]; cb: Callback };
function done(state) {
    if (--state.pending === 0) state.cb(null, state.results);
}
```
- Consolidate `matcherContextAddPath` and `matcherContextRemovePath` to share path normalization and parent traversal logic.
- Replace the complex absolute path search in `resolveSources` with a simple array-based segment iterator.

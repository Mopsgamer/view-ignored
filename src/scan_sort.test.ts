/**
 * Creates new array.
 * Files and folders are sorted by their names.
 * Folders are displayed before files.
 */
export function sortFirstFolders(iterable: Iterable<string>): string[] {
  return Array.from(iterable).sort(cmpFirstFolders);
}

/**
 * Files and folders are sorted by their names.
 * Folders are displayed before files.
 */
export function cmpFirstFolders(a: string, b: string): number {
  if (a === b) return 0;
  let comp = 0;
  while (comp === 0) {
    const { next: next1, other: post1, isLast: last1 } = shiftPath(a);
    a = post1;
    const { next: next2, other: post2, isLast: last2 } = shiftPath(b);
    b = post2;

    comp = cmpMixed(next1, next2);

    if (last1 === last2) {
      if (last1) break;
      continue;
    }
    if (next1 === "") return -1;
    if (next2 === "") return +1;
    if (last2) return -1;
    return +1;
  }

  return comp;
}

/**
 * Files and folders are sorted by their names.
 * Files are interwoven with folders.
 */
function cmpMixed(a: string, b: string): number {
  return a.localeCompare(b, undefined, { ignorePunctuation: false });
}

type ShiftResult = {
  next: string;
  other: string;
  isLast: boolean;
};

/**
 * @example
 * "path/to/the/file" -> ["path", "to/the/file", false]
 * "file" -> ["file", "file", true]
 * "file/" -> ["file", "", false]
 */
function shiftPath(p: string): ShiftResult {
  const slashIndex = p.search(/[/\\]/);
  const next = p.slice(0, Math.max(0, slashIndex));
  const other = p.slice(Math.max(0, slashIndex + 1));
  const r: ShiftResult = {
    next: next,
    other: other,
    isLast: next == "",
  };
  if (slashIndex < 0) {
    r.next = r.other;
  }
  return r;
}

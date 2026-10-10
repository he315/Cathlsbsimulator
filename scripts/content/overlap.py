#!/usr/bin/env python3
"""Flag copied wording: word runs shared between content files and the source books.

Usage:
  python3 scripts/content/overlap.py --books <dir with *.txt> [--n 8] <file.ts> [<file.ts> ...]

The books are plain-text extracts kept outside the repository (they are copyrighted and never
committed). Every string literal in the given TypeScript files is compared with the books, n words
at a time (except the `citation:` strings of reference entries, which must reproduce authors and
titles exactly and are skipped), after normalising case, punctuation and line-break hyphenation.
Each shared run of n or more words is printed with its file, line and the longest matching stretch. Exit status 1 when
anything is found, so authors rewrite the passage in their own words.

Runs made only of names, numbers and standard terms (trial names, classification labels) can
appear by chance; the report shows them so a person can judge, but authors should rephrase anything
that reads like a sentence from the book.
"""
import argparse
import glob
import os
import re
import sys

WORD = re.compile(r"[a-z0-9]+(?:'[a-z]+)?")


def norm_words(text: str) -> list[str]:
    text = text.replace("’", "'").replace("‘", "'")
    text = re.sub(r"-\s*\n\s*", "", text)  # join hyphenated line breaks
    return WORD.findall(text.lower())


def book_shingles(paths: list[str], n: int) -> set[int]:
    out: set[int] = set()
    for p in paths:
        w = norm_words(open(p, encoding="utf-8", errors="ignore").read())
        for i in range(len(w) - n + 1):
            out.add(hash(" ".join(w[i : i + n])))
    return out


STRING = re.compile(r'"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`')


def literals(path: str):
    src = open(path, encoding="utf-8").read()
    for m in STRING.finditer(src):
        s = m.group(1) if m.group(1) is not None else m.group(2)
        if s is None or len(s.split()) < 4:
            continue
        # bibliographic citations (authors, article titles) must stay verbatim; skip them
        if re.search(r"citation:\s*$", src[max(0, m.start() - 40) : m.start()]):
            continue
        line = src.count("\n", 0, m.start()) + 1
        yield line, s.encode("utf-8").decode("unicode_escape", errors="ignore") if "\\u" in s else s


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--books", required=True, help="directory holding the book text extracts (*.txt, searched recursively)")
    ap.add_argument("--n", type=int, default=8)
    ap.add_argument("files", nargs="+")
    a = ap.parse_args()
    paths = sorted(glob.glob(os.path.join(a.books, "**", "*.txt"), recursive=True))
    if not paths:
        print(f"no book text found under {a.books}", file=sys.stderr)
        return 2
    sh = book_shingles(paths, a.n)
    found = 0
    for f in a.files:
        for line, s in literals(f):
            w = norm_words(s)
            hits = [i for i in range(len(w) - a.n + 1) if hash(" ".join(w[i : i + a.n])) in sh]
            if not hits:
                continue
            # merge consecutive hits into stretches
            stretches = []
            start = prev = hits[0]
            for i in hits[1:]:
                if i == prev + 1:
                    prev = i
                    continue
                stretches.append((start, prev))
                start = prev = i
            stretches.append((start, prev))
            for st, en in stretches:
                found += 1
                print(f"{f}:{line}: {en - st + a.n} words shared: \"{' '.join(w[st : en + a.n])}\"")
    print(f"{found} shared run(s) of {a.n}+ words", file=sys.stderr)
    return 1 if found else 0


if __name__ == "__main__":
    sys.exit(main())

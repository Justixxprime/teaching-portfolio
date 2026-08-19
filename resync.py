#!/usr/bin/env python3
"""
resync.py
Propagates partials/nav.html and partials/footer.html into every *.html
page in this folder, replacing whatever sits between the matching
NAV:START/END and FOOTER:START/END marker comments.

How to use it:
1. Edit partials/nav.html or partials/footer.html
2. Run: python3 resync.py
3. Every page's nav/footer updates to match, automatically.

This keeps navigation and footer identical across all 23 pages without
copy-pasting by hand.
"""
import re
import pathlib

ROOT = pathlib.Path(__file__).parent
PARTIALS = ROOT / "partials"

def read(path):
    return path.read_text(encoding="utf-8")

def resync_block(page_text, block_text, marker):
    start, end = f"<!-- {marker}:START -->", f"<!-- {marker}:END -->"
    pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.DOTALL)
    if not pattern.search(page_text):
        return page_text, False
    return pattern.sub(block_text.strip(), page_text), True

def main():
    nav = read(PARTIALS / "nav.html")
    footer = read(PARTIALS / "footer.html")

    changed = []
    for page in sorted(ROOT.glob("*.html")):
        text = read(page)
        original = text
        text, hit_nav = resync_block(text, nav, "NAV")
        text, hit_footer = resync_block(text, footer, "FOOTER")
        if text != original:
            page.write_text(text, encoding="utf-8")
            changed.append(page.name)

    if changed:
        print("Resynced nav/footer in:")
        for name in changed:
            print(f"  - {name}")
    else:
        print("No pages needed updating (or no marker comments found yet).")

if __name__ == "__main__":
    main()

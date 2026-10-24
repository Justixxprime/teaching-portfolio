#!/usr/bin/env python3
"""
download-images.py — saves every Unsplash photo used on the site into
assets/images/unsplash/ and rewrites the pages to use the local copies,
so the site no longer depends on Unsplash being reachable.

Run from the project folder (needs internet, Python 3, no extra packages):
    python3 scripts/download-images.py            # download + rewrite
    python3 scripts/download-images.py --dry-run  # just list what it would do

Safe to run twice: files already downloaded are skipped.
Also saves assets/images/social-share.jpg (the link-preview image).
"""
import re, sys, pathlib, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "images" / "unsplash"
DRY = "--dry-run" in sys.argv
PAT = re.compile(r'https://images\.unsplash\.com/photo-([0-9a-f]+-[0-9a-f]+)\?[^"\s)\']*?w=(\d+)[^"\s)\']*')
FILES = list(ROOT.glob("*.html")) + [ROOT / "js" / "articles-render.js"]

def fetch(url, dest):
    if dest.exists() and dest.stat().st_size > 1000:
        return
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        dest.write_bytes(r.read())

def main():
    found = {}
    for f in FILES:
        for m in PAT.finditer(f.read_text(encoding="utf-8")):
            found[m.group(0)] = f"{m.group(1)}-w{m.group(2)}.jpg"
    print(f"{len(found)} distinct images across {len(FILES)} files")
    if DRY:
        for url, name in found.items():
            print("  would save", name)
        return
    OUT.mkdir(parents=True, exist_ok=True)
    for url, name in found.items():
        print("  downloading", name)
        fetch(url, OUT / name)
    for f in FILES:
        t = f.read_text(encoding="utf-8")
        n = PAT.sub(lambda m: f"assets/images/unsplash/{m.group(1)}-w{m.group(2)}.jpg", t)
        if n != t:
            f.write_text(n, encoding="utf-8")
    # link-preview image: the first wide classroom photo
    share = next((u for u in found if "1757192420362" in u), None)
    if share:
        wide = re.sub(r"w=\d+", "w=1200", share)
        fetch(wide, ROOT / "assets" / "images" / "social-share.jpg")
        print("  saved social-share.jpg")
    print("Done. Commit assets/images/ and the changed files.")

main()

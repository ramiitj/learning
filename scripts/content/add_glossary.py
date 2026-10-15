"""Merge glossary entries into content/glossary/{en,hi,te}.json.

Usage: python3 scripts/content/add_glossary.py entries.json

entries.json maps a term id to one entry per locale:
  {"dataset": {"en": {"term": "dataset", "definition": "..."}, "hi": {...}, "te": {...}}}

An existing id is never overwritten (a clash is reported and skipped), so
several authors can add terms at the same time. Files are locked while they
are rewritten.
"""
import fcntl
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / "content" / "glossary"


def main(src: str) -> None:
    entries = json.loads(Path(src).read_text(encoding="utf8"))
    with open(ROOT / ".lock", "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        for locale in ("en", "hi", "te"):
            path = ROOT / f"{locale}.json"
            glossary = json.loads(path.read_text(encoding="utf8"))
            for term_id, per_locale in entries.items():
                if locale not in per_locale:
                    continue
                if term_id in glossary:
                    if glossary[term_id] != per_locale[locale]:
                        print(f"skipped {locale}/{term_id}: already defined as {glossary[term_id]['definition']!r}")
                    continue
                glossary[term_id] = per_locale[locale]
            path.write_text(json.dumps(glossary, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print(f"merged {len(entries)} terms")


if __name__ == "__main__":
    main(sys.argv[1])

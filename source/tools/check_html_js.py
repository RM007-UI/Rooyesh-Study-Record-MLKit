#!/usr/bin/env python3
"""Extract and syntax-check inline JavaScript, plus listed JS files, using Node."""
from __future__ import annotations
import re, subprocess, sys, tempfile
from pathlib import Path

if len(sys.argv) < 2:
    raise SystemExit("Usage: check_html_js.py index.html [script.js ...]")
node = subprocess.run(["node", "--version"], capture_output=True, text=True)
if node.returncode != 0:
    raise SystemExit("Node.js is required for syntax checks.")
inputs = [Path(x) for x in sys.argv[1:]]
js_blobs: list[tuple[str, str]] = []
for path in inputs:
    text = path.read_text(encoding="utf-8")
    if path.suffix.lower() == ".html":
        for index, match in enumerate(re.finditer(r"<script\b([^>]*)>(.*?)</script\s*>", text, re.I | re.S), 1):
            attrs, body = match.group(1), match.group(2)
            if re.search(r"\bsrc\s*=", attrs, re.I) or not body.strip():
                continue
            js_blobs.append((f"{path} inline script #{index}", body))
    elif path.suffix.lower() == ".js":
        js_blobs.append((str(path), text))
if not js_blobs:
    raise SystemExit("No JavaScript code found to check.")
for label, body in js_blobs:
    with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8", delete=False) as f:
        f.write(body)
        tmp = Path(f.name)
    result = subprocess.run(["node", "--check", str(tmp)], capture_output=True, text=True)
    tmp.unlink(missing_ok=True)
    if result.returncode:
        print(f"FAIL: {label}\n{result.stderr}", file=sys.stderr)
        raise SystemExit(result.returncode)
    print(f"OK: {label}")
print(f"Checked {len(js_blobs)} JavaScript source(s) with {node.stdout.strip()}.")

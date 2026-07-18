from pathlib import Path
import re

path = Path("index.html")
html = path.read_text(encoding="utf-8")
original = html

html = html.replace(
    '<meta name="all-alpha-version" content="10.4">',
    '<meta name="all-alpha-version" content="10.5">',
    1,
)

v105_css = r'''
/* V10.5 · CHECKOUT RECOVERY */
.form-input.is-invalid{border-color:#b43b3b;box-shadow:0 0 0 1px rgba(180,59,59,.3)}
.form-error{min-height:1.25em;margin-top:6px;color:#e
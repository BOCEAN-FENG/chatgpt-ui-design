#!/usr/bin/env python3
"""Check bundled token contrast, mirror consistency, and export validity."""
from pathlib import Path
import json
import re
import sys
import xml.etree.ElementTree as ET

from export_theme import TOKEN_FILE, color_tokens, declarations, export, read_tokens


def luminance(h):
    rgb = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in rgb]
    return sum(x * weight for x, weight in zip(linear, (0.2126, 0.7152, 0.0722)))


def contrast(a, b):
    lo, hi = sorted((luminance(a), luminance(b)))
    return (hi + 0.05) / (lo + 0.05)


def main():
    failures, counts, worst = [], 0, (100.0, '')
    for theme in ('light', 'dark'):
        t = read_tokens(theme)
        pairs = []
        for bg in ('canvas', 'sidebar', 'surface', 'overlay', 'hover', 'selected'):
            for fg in ('text', 'secondary', 'muted'):
                pairs.append((fg, bg, 4.5))
            pairs.append(('focus', bg, 3.0))
        for bg in ('canvas', 'surface', 'overlay'):
            pairs.append(('border-strong', bg, 3.0))
            pairs.append(('link', bg, 4.5))
        for bg in ('action', 'action-hover', 'action-pressed'):
            pairs.append(('on-action', bg, 4.5))
        for state in ('danger', 'success', 'warning'):
            pairs.append((state, state + '-surface', 4.5))
        for fg, bg, threshold in pairs:
            ratio = contrast(t[fg], t[bg]); counts += 1
            if ratio < worst[0]:
                worst = ratio, f'{theme}:{fg}/{bg} (target {threshold}:1)'
            if ratio < threshold:
                failures.append(f'{theme}: {fg}/{bg} {ratio:.2f}:1 < {threshold}:1')
        colors = color_tokens(t)
        if json.loads(export(theme, 'json'))['colors'] != colors:
            failures.append(f'{theme}: JSON export differs from source')
        ET.fromstring(export(theme, 'xaml'))
        qss = export(theme, 'qss')
        if qss.count('{') != qss.count('}') or 'var(--' in qss:
            failures.append(f'{theme}: invalid QSS braces or unresolved variable')
    css = TOKEN_FILE.read_text(encoding='utf-8')
    explicit = declarations(re.search(r':root\[data-theme="dark"\]\s*\{([^}]+)\}', css).group(1))
    automatic = declarations(re.search(r':root:not\(\[data-theme\]\)\s*\{([^}]+)\}', css).group(1))
    if explicit != automatic:
        failures.append('Automatic dark theme and explicit dark theme differ')
    root = Path(__file__).resolve().parents[1]
    for md in [root / 'SKILL.md', *sorted((root / 'references').glob('*.md'))]:
        for target in re.findall(r'\]\(([^)]+)\)', md.read_text(encoding='utf-8')):
            if not target.startswith(('https:', 'http:', '#')) and not (md.parent / target.split('#')[0]).exists():
                failures.append(f'Broken relative resource: {md.name}: {target}')
    if failures:
        print('\n'.join(f'FAIL {x}' for x in failures)); return 1
    print(f'PASS {counts} bundled contrast pairs, both theme exports, dark-theme mirror, and linked resources.')
    print(f'Lowest tested ratio: {worst[0]:.2f}:1 — {worst[1]}')
    print('This checks bundled resources only; inspect the running application separately.')
    return 0


if __name__ == '__main__':
    sys.exit(main())

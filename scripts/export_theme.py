#!/usr/bin/env python3
"""Export semantic CSS tokens as JSON, Qt QSS, or WPF resources (stdlib only)."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import sys
from xml.sax.saxutils import escape

TOKEN_FILE = Path(__file__).resolve().parents[1] / 'assets' / 'tokens.css'


def declarations(block: str) -> dict[str, str]:
    return dict(re.findall(r'--cg-([\w-]+)\s*:\s*([^;]+);', block))


def read_tokens(theme: str, token_file: Path = TOKEN_FILE) -> dict[str, str]:
    css = token_file.read_text(encoding='utf-8')
    base = re.search(r':root\s*\{([^}]+)\}', css)
    dark = re.search(r':root\[data-theme="dark"\]\s*\{([^}]+)\}', css)
    if not base or not dark:
        raise ValueError('Missing base or explicit dark token block')
    tokens = declarations(base.group(1))
    if theme == 'dark':
        tokens.update(declarations(dark.group(1)))
    elif theme != 'light':
        raise ValueError(f'Unknown theme: {theme}')
    return {key: value.strip() for key, value in tokens.items()}


def color_tokens(tokens: dict[str, str]) -> dict[str, str]:
    return {k: v for k, v in tokens.items() if re.fullmatch(r'#[0-9a-fA-F]{6}', v)}


def to_qss(tokens: dict[str, str]) -> str:
    c = color_tokens(tokens)
    # Geometry stays in the native layout. QWidget backgrounds remain transparent
    # so child labels do not turn into canvas-coloured rectangles on the sidebar.
    return f'''/* Generated from ChatGPT UI Design tokens. Qt logical pixels. */
QWidget {{ color: {c['text']}; font-size: 14px; }}
QMainWindow, QDialog, QWidget#cgRoot {{ background-color: {c['canvas']}; }}
QWidget#cgSidebar {{ background-color: {c['sidebar']}; }}
QWidget#cgComposer {{ background-color: {c['surface']}; border-radius: 24px; }}
QLabel {{ background-color: transparent; }}
QLabel[cgRole="secondary"] {{ color: {c['secondary']}; }}
QLabel[cgRole="muted"] {{ color: {c['muted']}; }}
QPushButton, QToolButton {{
  color: {c['text']}; background-color: transparent;
  border: 2px solid transparent; border-radius: 10px;
  padding: 6px 12px; min-height: 24px;
}}
QToolButton {{ min-width: 24px; padding: 6px; }}
QPushButton:hover, QToolButton:hover {{ background-color: {c['hover']}; }}
QPushButton:pressed, QToolButton:pressed {{ background-color: {c['pressed']}; }}
QPushButton:focus, QToolButton:focus {{ border-color: {c['focus']}; }}
QPushButton[cgRole="primary"] {{ background-color: {c['action']}; color: {c['on-action']}; }}
QPushButton[cgRole="primary"]:hover {{ background-color: {c['action-hover']}; }}
QPushButton[cgRole="primary"]:pressed {{ background-color: {c['action-pressed']}; }}
QPushButton[cgRole="secondary"] {{ border: 1px solid {c['border-strong']}; }}
QPushButton[cgRole="secondary"]:focus {{ border-color: {c['focus']}; }}
QPushButton[cgRole="danger"] {{ color: {c['danger']}; }}
QPushButton[cgRole="danger"]:hover {{ background-color: {c['danger-surface']}; }}
QPushButton:disabled, QToolButton:disabled {{ background-color: {c['surface']}; color: {c['disabled']}; }}
QLineEdit, QTextEdit, QPlainTextEdit, QComboBox, QSpinBox {{
  color: {c['text']}; background-color: {c['canvas']};
  selection-color: {c['on-action']}; selection-background-color: {c['action']};
  border: 2px solid {c['border-strong']}; border-radius: 10px; padding: 7px 10px; min-height: 22px;
}}
QLineEdit:focus, QTextEdit:focus, QPlainTextEdit:focus, QComboBox:focus, QSpinBox:focus {{ border-color: {c['focus']}; }}
QLineEdit:disabled, QTextEdit:disabled, QPlainTextEdit:disabled, QComboBox:disabled, QSpinBox:disabled {{ color: {c['disabled']}; background-color: {c['surface']}; }}
QLineEdit[cgInvalid="true"] {{ border-color: {c['danger']}; }}
QAbstractItemView {{
  color: {c['text']}; background-color: {c['canvas']}; alternate-background-color: {c['surface']};
  border: none; selection-background-color: {c['selected']}; selection-color: {c['text']};
}}
QAbstractItemView::item {{ padding: 8px; border-radius: 8px; }}
QAbstractItemView::item:hover {{ background-color: {c['hover']}; }}
QAbstractItemView::item:selected {{ background-color: {c['selected']}; }}
QHeaderView::section {{ background-color: {c['sidebar']}; color: {c['secondary']}; padding: 8px; border: none; border-bottom: 1px solid {c['border']}; }}
QMenu, QToolTip {{ background-color: {c['overlay']}; color: {c['text']}; border: 1px solid {c['border']}; border-radius: 8px; padding: 6px; }}
QMenu::item {{ padding: 8px 24px 8px 12px; border-radius: 6px; }}
QMenu::item:selected {{ background-color: {c['hover']}; }}
QMenu::item:disabled {{ color: {c['disabled']}; }}
QScrollArea {{ background-color: {c['canvas']}; border: none; }}
QCheckBox, QRadioButton {{ spacing: 8px; background-color: transparent; }}
QCheckBox::indicator, QRadioButton::indicator {{ width: 16px; height: 16px; }}
/* Preserve native indicator glyphs and combo arrows; implement custom ones only
   with theme-aware assets. Add styles for project-specific complex controls. */
'''


def to_xaml(tokens: dict[str, str]) -> str:
    lines = [
        '<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"',
        '                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">',
        '  <!-- WPF resources. Bind control styles through DynamicResource. -->',
    ]
    for key, color in color_tokens(tokens).items():
        name = 'CG' + ''.join(part.capitalize() for part in key.split('-'))
        lines.append(f'  <Color x:Key="{escape(name)}">{color.upper()}</Color>')
        lines.append(f'  <SolidColorBrush x:Key="{escape(name)}Brush" Color="{{DynamicResource {name}}}" />')
    lines.append('</ResourceDictionary>')
    return '\n'.join(lines) + '\n'


def export(theme: str, fmt: str) -> str:
    t = read_tokens(theme)
    if fmt == 'qss':
        return to_qss(t)
    if fmt == 'xaml':
        return to_xaml(t)
    colors = color_tokens(t)
    data = {'theme': theme, 'colors': colors,
            'css_metrics': {k: v for k, v in t.items() if k not in colors}}
    return json.dumps(data, ensure_ascii=False, indent=2) + '\n'


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--theme', choices=['light', 'dark'], default='light')
    p.add_argument('--format', choices=['json', 'qss', 'xaml'], default='json')
    p.add_argument('--out', type=Path, help='Explicit output file; otherwise write to stdout')
    a = p.parse_args()
    try:
        output = export(a.theme, a.format)
        if a.out:
            a.out.parent.mkdir(parents=True, exist_ok=True)
            a.out.write_text(output, encoding='utf-8')
        else:
            sys.stdout.write(output)
    except (OSError, ValueError, KeyError) as e:
        p.exit(1, f'Export failed: {e}\n')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

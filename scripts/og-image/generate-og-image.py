#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ppy-Blog 默认社交分享图（og:image）生成器
=========================================

产出：public/og-default.png —— 1200x630，PNG24，体积硬上限 200KB。

设计依据
--------
docs/04-design-system.md §2.2 / §2.3（方向 B · 墨蓝极简）。本图**只用该文档的原始层色板**，
不引入任何外部素材、不下载任何字体；文字使用系统字体栈里的 Segoe UI
（即 tokens.css 中 --font-body 在 Windows 上的实际落点），与站点「零 Web Font」策略一致。

版式（1200x630，左右留白 96px，内容宽 1008px）
    顶部  logomark（靛蓝圆角方 + 白 p，与 public/favicon.svg 同构）+ 站点名
    中部  副标题（自动折行，垂直居中于中部带）
    右侧  放大的圆角方描边，呼应 logomark 的几何母题（仅用 border 色，纯装饰）
    底部  1px 分隔线 + 域名

文案来源：src/consts.ts（SITE.title / SITE.description）——**单一真相源**，
改完 consts.ts 重跑本脚本即可，不要在这里硬编码文案。
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

# --------------------------------------------------------------------------
# 路径
# --------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parents[2]          # <repo>/scripts/og-image/x.py -> <repo>
CONSTS_TS = ROOT / "src" / "consts.ts"
DEFAULT_OUT = ROOT / "public" / "og-default.png"

# --------------------------------------------------------------------------
# 设计令牌 —— 逐字取自 docs/04-design-system.md §2.2 原始层色板
# 改色请先改设计系统文档，再改这里，最后重跑本脚本。
# --------------------------------------------------------------------------
TOKENS = {
    "paper-50":   "#FCFCFD",   # 页面底（近白，非纯白）
    "paper-200":  "#E3E5EA",   # 描边（纯装饰）
    "ink-900":    "#16181D",   # 正文 / 标题（近黑，非纯黑）
    "ink-600":    "#5B6270",   # 次文字
    "indigo-600": "#3B4CE0",   # 主强调色
    "paper-0":    "#FFFFFF",   # logomark 内的字形（强调色之上的文字色）
}

# 画布与版式常量
W, H = 1200, 630
MARGIN_X = 96
CONTENT_W = W - 2 * MARGIN_X          # 1008

MARK_SIZE = 72                        # logomark 边长
MARK_RADIUS = 16
MARK_GLYPH_SIZE = 46                  # logomark 内的 "p"
LOCKUP_Y = 88                         # logomark 顶边

NAME_SIZE = 56
LOCKUP_GAP = 24                       # logomark 与站点名的间距

BODY_SIZE = 36
BODY_LINE_H = 52                      # 36 * 1.45
BAND_TOP = 196                        # 副标题垂直居中带的上界
DIVIDER_Y = 510
DOMAIN_SIZE = 26
DOMAIN_Y = DIVIDER_Y + 24

# 右上角几何母题：与 logomark 完全同尺寸、同圆角的描边回声
# （放在顶部行内与品牌锁定对齐，避免与中部正文发生碰撞）
GHOST_SIZE = 72
GHOST_RADIUS = 16

SS = 4                                # 超采样倍数，消除圆角/斜线锯齿


# --------------------------------------------------------------------------
# 文案：从 src/consts.ts 读取，避免文案双写
# --------------------------------------------------------------------------
def read_site_consts() -> tuple[str, str]:
    if not CONSTS_TS.exists():
        sys.exit(f"[FAIL] 找不到 {CONSTS_TS}")

    text = CONSTS_TS.read_text(encoding="utf-8")

    def field(name: str) -> str:
        # 匹配 SITE 里的 name: '...'（支持 \' 转义）
        m = re.search(rf"^\s*{name}:\s*'((?:[^'\\]|\\.)*)'", text, re.M)
        if not m:
            sys.exit(f"[FAIL] 在 consts.ts 中找不到 SITE.{name}")
        return m.group(1).replace("\\'", "'").replace("\\\\", "\\")

    return field("title"), field("description")


def pick_fonts() -> tuple[str, str]:
    """系统字体栈里的 Segoe UI；缺失则回落 Arial。均为系统自带，不下载任何字体。"""
    windir = Path("C:/Windows/Fonts")
    candidates = [
        (windir / "segoeuib.ttf", windir / "segoeui.ttf"),
        (windir / "arialbd.ttf", windir / "arial.ttf"),
    ]
    for bold, regular in candidates:
        if bold.exists() and regular.exists():
            return str(bold), str(regular)
    sys.exit("[FAIL] 未找到可用的系统字体（Segoe UI / Arial）")


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font, max_width: float) -> list[str]:
    """按词贪心折行；单个超长词不切断。"""
    lines: list[str] = []
    current = ""
    for word in text.split(" "):
        trial = word if not current else f"{current} {word}"
        if not current or draw.textlength(trial, font=font) <= max_width:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_text_ink_centered(draw, box, glyph: str, font, fill) -> None:
    """把字形的**墨迹包围盒**居中到 box（不用 anchor=mm，那是按 em 盒居中的）。"""
    left, top, size = box
    bbox = draw.textbbox((0, 0), glyph, font=font)
    gw, gh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = left + (size - gw) / 2 - bbox[0]
    y = top + (size - gh) / 2 - bbox[1]
    draw.text((x, y), glyph, font=font, fill=fill)


def render(title: str, description: str, scale: int = SS) -> Image.Image:
    s = scale
    px = lambda v: int(round(v * s))  # noqa: E731

    img = Image.new("RGB", (W * s, H * s), TOKENS["paper-50"])
    draw = ImageDraw.Draw(img)

    font_bold_path, font_regular_path = pick_fonts()
    f_mark = ImageFont.truetype(font_bold_path, px(MARK_GLYPH_SIZE))
    f_name = ImageFont.truetype(font_bold_path, px(NAME_SIZE))
    f_body = ImageFont.truetype(font_regular_path, px(BODY_SIZE))
    f_domain = ImageFont.truetype(font_regular_path, px(DOMAIN_SIZE))

    # ---------- 右上角几何母题 ----------
    ghost_right = px(W - MARGIN_X)
    ghost_left = ghost_right - px(GHOST_SIZE)
    ghost_top = px(LOCKUP_Y)
    draw.rounded_rectangle(
        [ghost_left, ghost_top, ghost_right, ghost_top + px(GHOST_SIZE)],
        radius=px(GHOST_RADIUS),
        outline=TOKENS["paper-200"],
        width=max(1, px(1.5)),
    )

    # ---------- 中部副标题（先折行，再据行数垂直居中）----------
    body_lines = wrap_text(draw, description, f_body, px(CONTENT_W))
    block_h = len(body_lines) * px(BODY_LINE_H)
    band_bottom = px(DIVIDER_Y - 48)
    block_top = (px(BAND_TOP) + band_bottom) / 2 - block_h / 2

    # ---------- 顶部品牌锁定 ----------
    mark_top = px(LOCKUP_Y)
    draw.rounded_rectangle(
        [px(MARGIN_X), mark_top, px(MARGIN_X) + px(MARK_SIZE), mark_top + px(MARK_SIZE)],
        radius=px(MARK_RADIUS),
        fill=TOKENS["indigo-600"],
    )
    draw_text_ink_centered(
        draw,
        (px(MARGIN_X), mark_top, px(MARK_SIZE)),
        "p",
        f_mark,
        TOKENS["paper-0"],
    )

    name_x = px(MARGIN_X + MARK_SIZE + LOCKUP_GAP)
    name_bbox = draw.textbbox((0, 0), title, font=f_name)
    name_h = name_bbox[3] - name_bbox[1]
    name_y = mark_top + (px(MARK_SIZE) - name_h) / 2 - name_bbox[1]
    draw.text((name_x, name_y), title, font=f_name, fill=TOKENS["ink-900"])

    # ---------- 中部副标题 ----------
    y = block_top
    for line in body_lines:
        draw.text((px(MARGIN_X), y), line, font=f_body, fill=TOKENS["ink-600"])
        y += px(BODY_LINE_H)

    # ---------- 底部分隔线 + 域名 ----------
    draw.rectangle(
        [px(MARGIN_X), px(DIVIDER_Y), px(W - MARGIN_X), px(DIVIDER_Y) + max(1, px(1))],
        fill=TOKENS["paper-200"],
    )
    draw.text((px(MARGIN_X), px(DOMAIN_Y)), "ppywww.github.io", font=f_domain, fill=TOKENS["ink-600"])

    return img.resize((W, H), Image.LANCZOS)


def main() -> int:
    parser = argparse.ArgumentParser(description="生成 ppy-Blog 默认 og:image")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="输出路径")
    parser.add_argument("--scale", type=int, default=SS, help="超采样倍数（默认 4）")
    parser.add_argument("--max-kb", type=int, default=200, help="体积上限 KB（默认 200）")
    args = parser.parse_args()

    title, description = read_site_consts()
    img = render(title, description, args.scale)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    img.save(args.out, format="PNG", optimize=True)

    size = args.out.stat().st_size
    print(f"站点名   : {title}")
    print(f"副标题   : {description}")
    print(f"尺寸     : {img.width}x{img.height}")
    print(f"输出     : {args.out}")
    print(f"体积     : {size} B ({size / 1024:.1f} KiB)")

    if size > args.max_kb * 1024:
        print(f"[FAIL] 体积超过 {args.max_kb}KB 上限")
        return 1
    print(f"[OK] 体积在 {args.max_kb}KB 上限内")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

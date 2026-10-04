"""源泉圓體子集化：把 fonts-src/ 的完整字型（每個約 6 MB）裁成常用字子集，輸出到 src/assets/fonts/。

保留的字元：
  - ASCII、常見標點、全形符號、注音
  - Big5 常用字（0xA440–0xC67E，共 5401 字）與 Big5 符號區
  - src/ 與 index.html 裡實際出現過的所有字（確保介面文字、縣市鄉鎮名一定有）
沒收錄的罕見字會落到 --font-round 後面的 Chiron GoRound TC（Google Fonts 圓體）顯示。

用法（在 diula-outter/ 底下）：python3 scripts/subset-fonts.py
需要：pip install fonttools brotli
"""
from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "fonts-src"
OUT_DIR = ROOT / "src" / "assets" / "fonts"
WEIGHTS = ["400", "500", "700"]


def big5_range(lead_start, lead_end, last_lead_end_trail=0xFE):
    chars = set()
    for lead in range(lead_start, lead_end + 1):
        trails = list(range(0x40, 0x7F)) + list(range(0xA1, 0xFF))
        if lead == lead_end:
            trails = [t for t in trails if t <= last_lead_end_trail]
        for trail in trails:
            try:
                chars.add(bytes([lead, trail]).decode("big5"))
            except UnicodeDecodeError:
                pass
    return chars


def collect_chars():
    chars = set(chr(c) for c in range(0x20, 0x7F))
    for start, end in [
        (0x00A0, 0x00FF),  # Latin-1 標點
        (0x2000, 0x206F),  # 一般標點（— … ‧ 等）
        (0x2190, 0x21FF),  # 箭頭
        (0x3000, 0x303F),  # CJK 標點（、。「」『』【】）
        (0x3100, 0x312F),  # 注音
        (0xFF00, 0xFFEF),  # 全形符號
    ]:
        chars.update(chr(c) for c in range(start, end + 1))
    chars |= big5_range(0xA1, 0xA3, 0xBF)  # Big5 符號區
    chars |= big5_range(0xA4, 0xC6, 0x7E)  # Big5 常用字
    for path in [ROOT / "index.html", *(ROOT / "src").rglob("*")]:
        if path.is_file() and path.suffix in {".html", ".js", ".jsx", ".css", ".json"}:
            chars.update(path.read_text(encoding="utf-8", errors="ignore"))
    return "".join(sorted(c for c in chars if c.isprintable() or c == " "))


def main():
    text = collect_chars()
    print(f"保留 {len(text)} 個字元")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for w in WEIGHTS:
        src = SRC_DIR / f"gensen-tw-{w}.woff2"
        out = OUT_DIR / f"gensen-tw-{w}.woff2"
        options = subset.Options()
        options.flavor = "woff2"
        options.layout_features = ["*"]
        options.name_IDs = ["*"]
        options.notdef_outline = True
        font = subset.load_font(str(src), options)
        subsetter = subset.Subsetter(options)
        subsetter.populate(text=text)
        subsetter.subset(font)
        subset.save_font(font, str(out), options)
        print(f"{out.name}: {src.stat().st_size / 1e6:.2f} MB → {out.stat().st_size / 1e6:.2f} MB")


if __name__ == "__main__":
    main()

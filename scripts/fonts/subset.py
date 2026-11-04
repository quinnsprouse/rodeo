# /// script
# requires-python = ">=3.12"
# dependencies = ["fonttools[woff]==4.68.0", "uharfbuzz==0.57.0"]
# ///
from __future__ import annotations

import argparse
import io
import itertools
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

import uharfbuzz as hb
from fontTools import subset
from fontTools.pens.recordingPen import RecordingPen
from fontTools.ttLib import TTFont
from fontTools.ttLib.woff2 import WOFF2FlavorData
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parents[2]
SOURCES = ROOT / "scripts" / "fonts" / "sources"
USAGE = ROOT / "scripts" / "fonts" / "usage.json"
CONFIG = ROOT / "scripts" / "fonts" / "config.json"
OUTPUT = ROOT / "src" / "assets" / "fonts"
STYLESHEET = ROOT / "src" / "styles" / "fonts.gen.css"
STYLESHEET_TO_OUTPUT = "../assets/fonts"
PRINT_WIDTH = 100

ASCII = set(range(0x20, 0x7F))
LATIN_1 = set(range(0xA0, 0x100))
LATIN_EXTENDED_A = set(range(0x100, 0x180))
INVISIBLE = {0xA0, 0xAD}
CORE_PUNCTUATION = {0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2026}
FRACTION_SLASH = 0x2044
NAME_IDS = [0, 1, 2, 3, 4, 5, 6, 13, 14]

ALWAYS_APPLIED = {
    "abvm",
    "blwm",
    "calt",
    "ccmp",
    "clig",
    "curs",
    "dist",
    "kern",
    "liga",
    "ltra",
    "ltrm",
    "mark",
    "mkmk",
    "rand",
    "rclt",
    "rlig",
    "rvrn",
}
FRACTION_FEATURES = {"frac", "numr", "dnom"}
VERTICAL_FEATURES = {"vert", "vrt2", "vkrn", "vpal", "valt", "vhal"}
ALTERNATE_FEATURES = re.compile(r"^(salt|ss\d\d|cv\d\d|swsh|cswh|ornm|nalt)$")
VARIANT_FEATURES = {
    "fontVariantLigatures": {
        "common-ligatures": {"liga", "clig"},
        "discretionary-ligatures": {"dlig"},
        "historical-ligatures": {"hlig"},
        "contextual": {"calt"},
    },
    "fontVariantNumeric": {
        "lining-nums": {"lnum"},
        "oldstyle-nums": {"onum"},
        "proportional-nums": {"pnum"},
        "tabular-nums": {"tnum"},
        "diagonal-fractions": {"frac"},
        "stacked-fractions": {"afrc"},
        "ordinal": {"ordn"},
        "slashed-zero": {"zero"},
    },
    "fontVariantCaps": {
        "small-caps": {"smcp"},
        "all-small-caps": {"smcp", "c2sc"},
        "petite-caps": {"pcap"},
        "all-petite-caps": {"pcap", "c2pc"},
        "unicase": {"unic"},
        "titling-caps": {"titl"},
    },
    "fontVariantPosition": {"sub": {"subs"}, "super": {"sups"}},
    "fontVariantEastAsian": {
        "jis78": {"jp78"},
        "jis83": {"jp83"},
        "jis90": {"jp90"},
        "jis04": {"jp04"},
        "simplified": {"smpl"},
        "traditional": {"trad"},
        "full-width": {"fwid"},
        "proportional-width": {"pwid"},
        "ruby": {"ruby"},
    },
    "fontVariantAlternates": {"historical-forms": {"hist"}},
}


@dataclass(frozen=True)
class Face:
    family: str
    source: str
    output: str
    weight: int | tuple[int, int]
    license: str
    style: str = "normal"
    rename_to: str | None = None
    coverage: frozenset[int] | None = None

    @property
    def weight_range(self) -> tuple[int, int]:
        return (self.weight, self.weight) if isinstance(self.weight, int) else self.weight


def parse_unicode_range(text: str) -> frozenset[int]:
    codepoints = set()
    for part in text.split(","):
        low, _, high = part.strip().removeprefix("U+").partition("-")
        codepoints |= set(range(int(low, 16), int(high or low, 16) + 1))
    return frozenset(codepoints)


def configured_face(entry: dict) -> Face:
    weight = entry["weight"]
    return Face(
        family=entry["family"],
        source=entry["source"],
        output=entry["output"],
        weight=tuple(weight) if isinstance(weight, list) else weight,
        license=entry["license"],
        style=entry.get("style", "normal"),
        rename_to=entry.get("renameTo"),
        coverage=parse_unicode_range(entry["coverage"]) if "coverage" in entry else None,
    )


FACES = [
    configured_face(entry) for entry in json.loads(CONFIG.read_text(encoding="utf-8"))["faces"]
]


@dataclass
class Usage:
    characters: set[int] = field(default_factory=set)
    content: set[int] = field(default_factory=set)
    axis_values: dict[str, set[float]] = field(default_factory=dict)
    overridden_axes: set[str] = field(default_factory=set)
    features: set[str] = field(default_factory=set)
    alternates: bool = False
    languages: set[str] = field(default_factory=set)
    vertical: bool = False


@dataclass
class Piece:
    name: str
    codepoints: set[int]
    data: bytes = b""


@dataclass
class Result:
    face: Face
    usage: Usage
    axis_limits: dict[str, float | tuple[float, float]]
    features: list[str]
    pieces: list[Piece]
    css_weight: str


def style_class(style: str) -> str:
    return (
        "italic"
        if style.startswith("italic")
        else "oblique"
        if style.startswith("oblique")
        else "normal"
    )


def match_face(faces: list[Face], weight: float, style: str) -> Face:
    wanted = style_class(style)
    preference = {
        "italic": ["italic", "oblique", "normal"],
        "oblique": ["oblique", "italic", "normal"],
        "normal": ["normal", "oblique", "italic"],
    }[wanted]
    available = {face.style for face in faces}
    chosen_style = next(s for s in preference if s in available)
    candidates = [face for face in faces if face.style == chosen_style]

    def distance(face: Face) -> tuple[int, float]:
        low, high = face.weight_range
        if low <= weight <= high:
            return (0, 0)
        if 400 <= weight <= 500:
            if weight < low <= 500:
                return (1, low - weight)
            if high < weight:
                return (2, weight - high)
            return (3, low - weight)
        if weight < 400:
            return (1, weight - high) if high < weight else (2, low - weight)
        return (1, low - weight) if low > weight else (2, weight - high)

    return min(candidates, key=distance)


def parse_tags(value: str, pattern: str) -> list[tuple[str, str]]:
    return re.findall(pattern, value) if value and value != "normal" else []


def collect_usage(groups: list[dict]) -> dict[Face, Usage]:
    usage = {face: Usage() for face in FACES}
    for group in groups:
        faces = [face for face in FACES if face.family == group["family"]]
        if not faces:
            continue
        weight = float(group["fontWeight"])
        face = match_face(faces, weight, group["fontStyle"])
        entry = usage[face]
        entry.characters |= {ord(c) for c in group["characters"]}
        entry.languages.add(group["language"].split("-")[0].lower())
        if group["writingMode"].startswith("vertical") or group["writingMode"].startswith(
            "sideways"
        ):
            entry.vertical = True
        for tag, value in parse_tags(group["fontFeatureSettings"], r'"(\w{4})"\s*(on|off|\d+)?'):
            if value not in ("off", "0"):
                entry.features.add(tag)
        for prop, tokens in VARIANT_FEATURES.items():
            for token in group[prop].split():
                entry.features |= tokens.get(token, set())
        if "(" in group["fontVariantAlternates"]:
            entry.alternates = True
        low, high = face.weight_range
        variations = dict(parse_tags(group["fontVariationSettings"], r'"(\w{4})"\s*(-?[\d.]+)'))
        entry.axis_values.setdefault("wght", set()).add(min(max(weight, low), high))
        for tag, value in variations.items():
            entry.axis_values.setdefault(tag, set()).add(float(value))
            entry.overridden_axes.add(tag)
    return usage


def sfnt_bytes(font: TTFont) -> bytes:
    flavor = font.flavor
    font.flavor = None
    buffer = io.BytesIO()
    font.save(buffer)
    font.flavor = flavor
    return buffer.getvalue()


def font_features(font: TTFont) -> set[str]:
    tags = set()
    for table in ("GSUB", "GPOS"):
        if table in font and font[table].table.FeatureList:
            tags |= {record.FeatureTag for record in font[table].table.FeatureList.FeatureRecord}
    return tags


def locl_languages(font: TTFont) -> tuple[bool, set[str]]:
    everywhere, languages = False, set()
    for table in ("GSUB", "GPOS"):
        if table not in font:
            continue
        records = font[table].table.FeatureList.FeatureRecord
        for script in font[table].table.ScriptList.ScriptRecord:
            default = script.Script.DefaultLangSys
            if default and any(records[i].FeatureTag == "locl" for i in default.FeatureIndex):
                everywhere = True
            for lang in script.Script.LangSysRecord:
                if any(records[i].FeatureTag == "locl" for i in lang.LangSys.FeatureIndex):
                    languages.add(hb.ot_tag_to_language(str(lang.LangSysTag)).split("-")[0].lower())
    return everywhere, languages


def kept_features(font: TTFont, usage: Usage, codepoints: set[int]) -> list[str]:
    available = font_features(font)
    wanted = ALWAYS_APPLIED | usage.features
    if FRACTION_SLASH in codepoints:
        wanted |= FRACTION_FEATURES
    if usage.vertical:
        wanted |= VERTICAL_FEATURES
    if usage.alternates:
        wanted |= {tag for tag in available if ALTERNATE_FEATURES.match(tag)}
    everywhere, languages = locl_languages(font)
    if everywhere or languages & usage.languages:
        wanted.add("locl")
    return sorted(wanted & available)


def axis_limits(font: TTFont, usage: Usage) -> dict[str, float | tuple[float, float]]:
    if "fvar" not in font:
        return {}
    limits: dict[str, float | tuple[float, float]] = {}
    for axis in font["fvar"].axes:
        values = {
            min(max(v, axis.minValue), axis.maxValue)
            for v in usage.axis_values.get(axis.axisTag, set())
        }
        default = axis.defaultValue
        if not values:
            continue
        if values == {default} and axis.axisTag not in usage.overridden_axes:
            limits[axis.axisTag] = default
        elif min(values) >= default:
            limits[axis.axisTag] = (default, axis.maxValue)
        elif max(values) <= default:
            limits[axis.axisTag] = (axis.minValue, default)
    return limits


def reserved_font_names(face: Face) -> list[str]:
    text = (SOURCES / face.license).read_text(encoding="utf-8")
    notice = text.split("This Font Software is licensed")[0]
    return re.findall(r'Reserved Font Names?\s+"?([^".\n]+)"?', notice)


def trim_axis_to_default(font: TTFont, tag: str, low: float, high: float) -> None:
    axis = next(axis for axis in font["fvar"].axes if axis.axisTag == tag)
    keep_above = low >= axis.defaultValue
    variations = font["gvar"].variations
    for name in list(variations.keys()):
        variations[name] = [
            variation
            for variation in variations[name]
            if tag not in variation.axes or (variation.axes[tag][1] > 0) == keep_above
        ]
    axis.minValue, axis.maxValue = low, high
    font["fvar"].instances = [
        instance for instance in font["fvar"].instances if low <= instance.coordinates[tag] <= high
    ]


def apply_axis_limits(font: TTFont, limits: dict) -> TTFont:
    pins = {tag: value for tag, value in limits.items() if not isinstance(value, tuple)}
    for tag, (low, high) in (
        (tag, value) for tag, value in limits.items() if isinstance(value, tuple)
    ):
        trim_axis_to_default(font, tag, low, high)
    if pins:
        font = instancer.instantiateVariableFont(
            font, pins, overlap=instancer.OverlapMode.KEEP_AND_SET_FLAGS
        )
    if "fvar" not in font and "STAT" in font:
        del font["STAT"]
    return font


def rename(font: TTFont, family: str) -> None:
    name = font["name"]
    style = name.getDebugName(2) or "Regular"
    postscript = f"{family}-{style}".replace(" ", "")
    for record in list(name.names):
        if record.nameID in (16, 17, 21, 22):
            name.removeNames(nameID=record.nameID)
    for name_id, value in {1: family, 3: postscript, 4: f"{family} {style}", 6: postscript}.items():
        name.setName(value, name_id, 3, 1, 0x409)


def restrict_cmap(font: TTFont, codepoints: set[int]) -> None:
    # why: fontTools 4.68's subsetter can map characters it was not asked for, such as U+2264 in
    # JetBrains Mono, so the file would cover characters its unicode-range doesn't list.
    for table in font["cmap"].tables:
        if table.isUnicode():
            table.cmap = {u: g for u, g in table.cmap.items() if u in codepoints}


def drop_empty_tables(font: TTFont) -> None:
    for table in ("GSUB", "GPOS"):
        if table in font and not font[table].table.FeatureList.FeatureRecord:
            del font[table]
    if "GDEF" in font and "GSUB" not in font and "GPOS" not in font:
        del font["GDEF"]


def build_font(
    face: Face, limits: dict, codepoints: set[int], features: list[str], hinting: bool
) -> bytes:
    candidates = []
    for desubroutinize in (False, True):
        font = TTFont(SOURCES / face.source, recalcBBoxes=False, recalcTimestamp=False)
        if limits:
            font = apply_axis_limits(font, limits)
        options = subset.Options()
        options.layout_features = features
        options.hinting = hinting
        options.desubroutinize = desubroutinize
        options.name_IDs = NAME_IDS
        options.name_languages = [0x0409]
        options.name_legacy = False
        options.glyph_names = False
        options.notdef_outline = False
        options.recalc_bounds = False
        options.recalc_timestamp = False
        options.drop_tables = sorted(set(options.drop_tables) | {"meta", "DSIG"})
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=codepoints)
        subsetter.subset(font)
        restrict_cmap(font, codepoints)
        drop_empty_tables(font)
        if face.rename_to:
            rename(font, face.rename_to)
        font.flavor = "woff2"
        if "glyf" in font:
            font.flavorData = WOFF2FlavorData(transformedTables={"glyf", "loca", "hmtx"})
        buffer = io.BytesIO()
        font.save(buffer)
        candidates.append(buffer.getvalue())
        if "CFF " not in font:
            break
    return min(candidates, key=len)


class Shaper:
    def __init__(self, data: bytes, variations: dict[str, float]):
        self.font = hb.Font(hb.Face(data))
        if variations:
            self.font.set_variations(variations)
        self.outlines: dict[int, str] = {}

    def outline(self, glyph: int) -> str:
        if glyph not in self.outlines:
            pen = RecordingPen()
            self.font.draw_glyph_with_pen(glyph, pen)
            self.outlines[glyph] = repr(pen.value)
        return self.outlines[glyph]

    def shape(self, text: str, features: dict[str, bool], language: str) -> list[tuple]:
        buffer = hb.Buffer()
        buffer.add_str(text)
        buffer.guess_segment_properties()
        buffer.language = language
        hb.shape(self.font, buffer, features)
        return [
            (
                info.cluster,
                self.outline(info.codepoint),
                pos.x_advance,
                pos.y_advance,
                pos.x_offset,
                pos.y_offset,
            )
            for info, pos in zip(buffer.glyph_infos, buffer.glyph_positions, strict=True)
        ]


METRICS = [
    ("head", "unitsPerEm"),
    ("hhea", "ascent"),
    ("hhea", "descent"),
    ("hhea", "lineGap"),
    ("OS/2", "sTypoAscender"),
    ("OS/2", "sTypoDescender"),
    ("OS/2", "sTypoLineGap"),
    ("OS/2", "usWinAscent"),
    ("OS/2", "usWinDescent"),
    ("OS/2", "sxHeight"),
    ("OS/2", "sCapHeight"),
    ("OS/2", "yStrikeoutSize"),
    ("OS/2", "yStrikeoutPosition"),
    ("post", "underlinePosition"),
    ("post", "underlineThickness"),
    ("post", "isFixedPitch"),
]


def metrics(font: TTFont) -> dict:
    values = {f"{table}.{name}": getattr(font[table], name, None) for table, name in METRICS}
    values["OS/2.USE_TYPO_METRICS"] = bool(font["OS/2"].fsSelection & 1 << 7)
    return values


def verify_piece(
    face: Face, piece: Piece, result: Result, source: TTFont, hinting: bool
) -> list[str]:
    problems = []
    font = TTFont(io.BytesIO(piece.data))
    mapped = set(font.getBestCmap())
    if mapped != piece.codepoints:
        problems.append(f"cmap has {sorted(mapped ^ piece.codepoints)} beyond what was asked for")
    if metrics(font) != metrics(source):
        problems.append(f"metrics changed: {metrics(font)} vs {metrics(source)}")
    stray = font_features(font) - set(result.features)
    if stray:
        problems.append(f"kept features that were not asked for: {sorted(stray)}")
    if not hinting:
        tables = {"fpgm", "prep", "cvt ", "hdmx", "VDMX", "LTSH"} & set(font.keys())
        if tables:
            problems.append(f"hinting tables left: {sorted(tables)}")
    pinned = {
        tag: value for tag, value in result.axis_limits.items() if not isinstance(value, tuple)
    }
    if pinned and "fvar" in font and set(pinned) >= {axis.axisTag for axis in font["fvar"].axes}:
        problems.append("fvar left after pinning every axis")
    rfn = reserved_font_names(face)
    family = font["name"].getDebugName(1) or ""
    if any(name.lower() in family.lower() for name in rfn):
        problems.append(f"internal family {family!r} still uses the Reserved Font Name {rfn}")

    weights = sorted(result.usage.axis_values.get("wght", set())) or [None]
    if isinstance(result.axis_limits.get("wght"), tuple):
        low, high = result.axis_limits["wght"]
        weights = sorted({low, high, *weights})
    extra = {tag: True for tag in sorted(result.usage.features)}
    languages = sorted(result.usage.languages - {""}) or ["en"]
    source_data, subset_data = sfnt_bytes(source), sfnt_bytes(font)
    texts = [chr(c) for c in sorted(piece.codepoints)]
    texts += [a + b for a, b in itertools.product(texts, repeat=2)]
    for weight in weights:
        variations = {"wght": weight} if weight is not None and "fvar" in source else {}
        reference = Shaper(source_data, variations)
        candidate = Shaper(subset_data, variations if "fvar" in font else {})
        for features, language in itertools.product(({}, extra) if extra else ({},), languages):
            for text in texts:
                if reference.shape(text, features, language) != candidate.shape(
                    text, features, language
                ):
                    problems.append(
                        f"shaping differs for {text!r} at wght={weight} features={features}"
                    )
                    if len(problems) > 20:
                        return problems
    return problems


def unicode_ranges(codepoints: set[int]) -> list[str]:
    ranges, ordered = [], sorted(codepoints)
    for _, run in itertools.groupby(enumerate(ordered), lambda pair: pair[1] - pair[0]):
        values = [value for _, value in run]
        low, high = values[0], values[-1]
        ranges.append(f"U+{low:X}" if low == high else f"U+{low:X}-{high:X}")
    return ranges


def css_weight(face: Face, limits: dict) -> str:
    wght = limits.get("wght")
    if wght is None:
        low, high = face.weight_range
        return str(low) if low == high else f"{low} {high}"
    if isinstance(wght, tuple):
        low, high = max(wght[0], face.weight_range[0]), min(wght[1], face.weight_range[1])
        return f"{low:g}" if low == high else f"{low:g} {high:g}"
    return f"{wght:g}"


def plan(face: Face, usage: Usage) -> Result:
    source = TTFont(SOURCES / face.source)
    available = set(source.getBestCmap()) & (face.coverage or set(source.getBestCmap()))
    keep = (
        ASCII
        | INVISIBLE
        | CORE_PUNCTUATION
        | LATIN_1
        | LATIN_EXTENDED_A
        | usage.characters
        | usage.content
    ) & available
    core = (ASCII | INVISIBLE | CORE_PUNCTUATION | usage.characters) & keep
    pieces = [Piece(f"{face.output}-core", core), Piece(f"{face.output}-extended", keep - core)]
    limits = axis_limits(source, usage)
    return Result(
        face=face,
        usage=usage,
        axis_limits=limits,
        features=kept_features(source, usage, keep),
        pieces=[piece for piece in pieces if piece.codepoints],
        css_weight=css_weight(face, limits),
    )


def declaration(name: str, items: list[str]) -> str:
    single = f"  {name}: {', '.join(items)};"
    if len(single) <= PRINT_WIDTH:
        return single + "\n"
    lines, line = [], f"    {items[0]}"
    for item in items[1:]:
        if len(f"{line}, {item},") <= PRINT_WIDTH:
            line = f"{line}, {item}"
        else:
            lines.append(f"{line},")
            line = f"    {item}"
    return f"  {name}:\n" + "\n".join([*lines, f"{line};"]) + "\n"


def stylesheet(results: list[Result]) -> str:
    rules = []
    for result in results:
        for piece in result.pieces:
            rules.append(
                "@font-face {\n"
                f'  font-family: "{result.face.family}";\n'
                f"  font-style: {result.face.style};\n"
                "  font-display: swap;\n"
                f"  font-weight: {result.css_weight};\n"
                f'  src: url("{STYLESHEET_TO_OUTPUT}/{piece.name}.woff2") format("woff2");\n'
                + declaration("unicode-range", unicode_ranges(piece.codepoints))
                + "}\n"
            )
    return "\n".join(rules)


def describe(result: Result, source_size: int) -> str:
    parts = [
        f"{piece.name}.woff2 {len(piece.data):,} B ({len(piece.codepoints)} chars)"
        for piece in result.pieces
    ]
    used = "".join(chr(c) for c in sorted(result.usage.characters) if c > 0x7E)
    shipped = sorted(
        set().union(*(font_features(TTFont(io.BytesIO(piece.data))) for piece in result.pieces))
    )
    return (
        f"{result.face.family} {result.css_weight}: {source_size:,} B -> {' + '.join(parts)}\n"
        f"    axes {result.axis_limits or 'static'}, features {shipped or 'none'}, "
        f"non-ASCII in use {used!r}"
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Cut the site's fonts to the characters, weights, and features its pages use."
    )
    parser.add_argument(
        "--keep-hinting", action="store_true", help="keep TrueType instructions and CFF hints"
    )
    args = parser.parse_args()

    recorded = json.loads(USAGE.read_text(encoding="utf-8")) if USAGE.exists() else {"groups": []}
    usage = collect_usage(recorded["groups"])
    content = recorded.get("contentCharacters", {})
    for face, entry in usage.items():
        entry.content = {ord(c) for c in content.get(face.family, "")}
    results = [plan(face, usage[face]) for face in FACES]
    failures = []
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for stale in OUTPUT.glob("*.woff2"):
        stale.unlink()
    for result in results:
        face = result.face
        reserved = reserved_font_names(face)
        if reserved and not face.rename_to:
            failures.append(
                f"{face.output}: the OFL reserves {reserved}; set rename_to on its Face"
            )
        source = TTFont(SOURCES / face.source)
        for piece in result.pieces:
            piece.data = build_font(
                face, result.axis_limits, piece.codepoints, result.features, args.keep_hinting
            )
            problems = verify_piece(face, piece, result, source, args.keep_hinting)
            failures += [f"{piece.name}: {problem}" for problem in problems]
            (OUTPUT / f"{piece.name}.woff2").write_bytes(piece.data)
        print(describe(result, (SOURCES / face.source).stat().st_size))
    STYLESHEET.write_text(stylesheet(results), encoding="utf-8")
    for failure in failures:
        print(f"FAILED {failure}", file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())

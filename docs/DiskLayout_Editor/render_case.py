import json, argparse, os, sys, stat
from html import escape
from typing import Tuple, Dict, List

##### V 0.16
##### Stand alone script to generate the html render for disklayout_config.json

__version__ = "0.16"
__script_directory__ = os.getcwd()
__script_path__ = os.path.abspath(__file__)
__script_name__ = os.path.basename(__script_path__)
__input_default__ = os.path.join(__script_directory__, "disklayout_config.json")
__output_render__ = os.path.join(__script_directory__, "case_render.html")
__output_render_snipplet__ = os.path.join(__script_directory__, "case_email_snippet.html")

# --- COLORS AND OTHER VARIABLE ---
__c_placeholder_slot__ = "#7E57C2"
__c_placeholder_slot_2__ = "#4527A0"
__c_HC_placeholder_slot__ = "#9FA6B2"
__c_notfilled_slot__ = "#E8F5E9"
__cols__ = 4 # just a fallback
__cols_n_limit__ = 5 # used to determine the max limit to decrease cols width to 200
__rows_n_limit__ = 10 # used to determine the max number to decrease gap
__cols_breakout__ = 8 #8 used to determine the max limit to auto rotate the web rich version
__cols_w__ = 275 # standard cols width
__cols_wR__ = 200 # reduced cols width
__row_h__ = 58 # standard rows height
__row_hR__ = 70 # increased rows height

def assert_outputs_secure_or_abort() -> bool:
    """
    Security check
    """
    append_log("testing symlink - size on output files")
    max_output_size = 100 * 1024
    for out_path in (__output_render__, __output_render_snipplet__):
        if os.path.lexists(out_path) and os.path.islink(out_path):
            process_output(True, f"[SECURITY ERROR]: output file '{out_path}' is a symlink; refusing to write.", 1)
        if os.path.exists(out_path):
            try:
                st = os.stat(out_path, follow_symlinks=False)
            except Exception as e:
                process_output(True, f"[ERROR]: cannot stat output file '{out_path}': {e}", 1)
            if st.st_size > max_output_size:
                process_output( True, f"[SECURITY ERROR]: output file '{out_path}' is too large ({st.st_size} bytes > {max_output_size}); refusing to write.", 1, )
    append_log("test pass, checking directory")
    dirs = {
        os.path.dirname(os.path.abspath(__output_render__)) or __script_directory__,
        os.path.dirname(os.path.abspath(__output_render_snipplet__)) or __script_directory__,
    }
    for d in dirs:
        try:
            st = os.stat(d, follow_symlinks=True)
        except Exception as e:
            process_output(True, f"[ERROR]: cannot stat directory '{d}': {e}", 1)

        append_log("test pass, checking permission")
        if bool(st.st_mode & stat.S_IWOTH):
            print(f"[SECURITY ERROR]: directory '{d}' is writable by non-privileged users; operation will not be aborted, until script is in BETA test .")
#            process_output(True, f"[SECURITY ERROR]: directory '{d}' is writable by non-privileged users; operation aborted.", 1)
    return True

def append_log(content):
    if DEBUG_ENABLED:
        print(content)

def process_output(error, detail="", exit_code=None):
    """
        Centralized output response
        - version str error bool detail string exit_code 0 (ok) 1 (ko) or None (ignore)
    """
    response = json.dumps({"version": __version__,"error": error, "detail": detail}, ensure_ascii=False)
    append_log(f"{detail}")
    print(response)
    if exit_code is not None:
        sys.exit(exit_code)

# ---------- IO ----------
def load_json(path: str):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        process_output(True, f"Can't load json file: {e}", 1)


# ---------- Config helpers ----------
def get_cols(case: dict) -> int:
    """Return number of columns from case.layout.cols or fallback."""
    try:
        cols = int(case.get("layout", {}).get("cols") or __cols__)
        return cols if cols > 0 else __cols__
    except (TypeError, ValueError):
        return __cols__


def rows_from_case(case: dict, cols: int) -> int:
    """Use explicit 'rows' if provided; otherwise compute from the highest active slot."""
    layout = case.get("layout", {})
    rows = layout.get("rows")
    if isinstance(rows, int) and rows > 0:
        return rows
    active = layout.get("activeSlots") or []
    if not active:
        return 1
    try:
        max_slot = max(int(x) for x in active)
    except ValueError:
        return 1
    return max(1, ((max_slot - 1) // cols) + 1)

def handle_rotate_layout(case: dict) -> bool:
    """ new property to rotate the layout vertically -> true horizontal -> false default """
    try:
        rotate = case.get("layout", {}).get("rotate")
        is_rotate_enabled = str(rotate).lower() in ("true", "1", "yes")
        cols = get_cols(case)
        return is_rotate_enabled or cols > __cols_breakout__
    except Exception:
        return False

def validate_case(original_case: dict | None) -> Tuple[dict, bool]:
    """
    Ensure a valid case dict. If missing or invalid activeSlots, return a
    minimal structure and a flag False to indicate it's not a real case.
    """
    if not isinstance(original_case, dict):
        return (
            {"id": "no-case", "name": "No case selected", "layout": {"activeSlots": [], "rows": 1, "cols": __cols__}},
            False,
        )
    layout = original_case.get("layout") or {}
    active = layout.get("activeSlots")
    if not isinstance(active, list) or len(active) == 0:
        c = dict(original_case)
        c.setdefault("name", original_case.get("id", "No case selected"))
        c["layout"] = {"activeSlots": [], "rows": layout.get("rows", 1), "cols": layout.get("cols", __cols__)}
        return (c, False)
    return (original_case, True)

def is_real_drive(b: dict) -> bool:
    return isinstance(b, dict) and str(b.get("status", "")).strip().lower() != "empty"

def build_pos_map_from_bays(bays_list: list) -> Tuple[Dict[int, dict], List[int]]:
    """
    Map absolute slot -> info (serial, bay_index) and collect unplaced drives.
    Returns (pos_to_info, unplaced_indices)
    """
    pos_to_info: Dict[int, dict] = {}
    unplaced: List[int] = []
    for idx, b in enumerate(bays_list or []):
        if not isinstance(b, dict):
            continue
        status = str(b.get("status", "")).strip().lower() # ?? TO ASK why empty bays?
        if status == "empty":
            continue
        slot = b.get("slot", None)
        try:
            pos = int(slot)
            if pos <= 0:
                raise ValueError
        except (TypeError, ValueError):
            unplaced.append(idx)
            continue
        serial = (b.get("serial") or "").strip()
        pos_to_info[pos] = {"serial": serial, "bay_index": idx}
    return pos_to_info, unplaced


def normalize_drives_from_bays(bays_list: list) -> Dict[str, dict]:
    """Build serial -> drive fields lookup (for color/labels/extra)."""
    lookup: Dict[str, dict] = {}
    for b in bays_list or []:
        if not isinstance(b, dict):
            continue
        status = str(b.get("status", "")).strip().lower()
        if status == "empty":
            continue
        serial = (b.get("serial") or "").strip()
        if serial:
            lookup[serial] = b
    return lookup

def get_placeholder_map(case: dict) -> Dict[int, str]:
    """Return {slot_id: title} for placeholderSlots."""
    layout = (case or {}).get("layout", {}) or {}
    placeholders = layout.get("placeholderSlots") or []
    out: Dict[int, str] = {}
    for it in placeholders:
        if not isinstance(it, dict):
            continue
        try:
            sid = int(it.get("id"))
        except (TypeError, ValueError):
            continue
        title = (it.get("title") or "").strip()
        if sid > 0 and title:
            out[sid] = title
    return out

def get_sep_slots(case: dict) -> List[int]:
    """Return list of sepSlots (as integers)."""
    layout = (case or {}).get("layout", {}) or {}
    raw = layout.get("sepSlots") or []
    out = []
    for it in raw:
        try:
            out.append(int(it))
        except (TypeError, ValueError):
            continue
    return out

def get_cols_width(cols: int) -> int:
    """ centralize the calc of the cols width """
    return __cols_w__ if cols <= __cols_n_limit__ else __cols_wR__

def get_rows_height(vertical_rotation: bool) -> int:
    """ centralize the calc of the rows height """
    return __row_h__ if not vertical_rotation else __row_hR__

def get_gap(cols: int, rows: int) -> int:
    """ centralize the calc of the gap width """
    return 22 if cols <= __cols_n_limit__ and rows <= __rows_n_limit__ else 10

def slot_rotation(vertical_rotation: bool):
    """ centralize the rotation of the active slot on hover """
    return " transform: rotate(-90deg) scale(1.50); transform-origin: center; z-index: 10; transition: transform 0.15s ease-in-out;" if vertical_rotation else ""

# ---------- Domain ----------
def get_field(d: dict, key: str, default: str = "–", fmt_temp: bool = False) -> str:
    """
    Generic safe getter for drive fields.
    """
    if not isinstance(d, dict):
        return default
    val = d.get(key, "")
    if val is None or val == "":
        return default
    if fmt_temp:
        if isinstance(val, (int, float)) and not str(val).endswith("°C"):
            return f"{val}°C"
        return str(val)
    return str(val).strip()

def drive_led_color(d: dict) -> str:
    c = get_field(d, "drive_color", "").lower()
    return c if c in ("green", "yellow", "red", "orange") else "blank"

def drive_led_icon(color: str) -> tuple[str, str]:
    icons = {
        "green":  ("✅", "OK"),
        "yellow": ("⚠️", "WARNING"),
        "orange": ("⚠️", "WARNING"),
        "red":    ("❌", "CRITICAL"),
    }
    return icons.get(color, ("❔", "UNKNOWN"))

def drive_label(d: dict) -> str:
    return get_field(d, "serial", "") or get_field(d, "drive_id", "disk")

def drive_pool(d: dict) -> str:
    return get_field(d, "pool", "--SPARE--")

def drive_temp(d: dict) -> str:
    t = d.get("drive_temp")
    if t is None or t == "":
        return "–"
    return f"{t}°C" if isinstance(t, (int, float)) and not str(t).endswith("°C") else str(t)

def drive_capacity(d: dict) -> str:
    return get_field(d, "capacity")

def drive_id(d: dict) -> str:
    return get_field(d, "drive_id")

def render_drive_line(d: dict, bay_idx, high_contrast_switch: bool = False) -> str:
    label = escape(drive_label(d))
    pool = escape(drive_pool(d))
    temp = escape(drive_temp(d))
    led = drive_led_color(d)
    led_render = f'  <div class="led {led}"></div>'
    if high_contrast_switch:
        ic, lb = drive_led_icon(led)
        led_render = f'  <div class="led-hc">{ic} {lb} </div>'
    did = escape(drive_id(d))
    cap = escape(drive_capacity(d))
    return (
        f'<div class="slot filled box-{led}" data-bay="{bay_idx}">'
        '  <div class="text">'
        f'    <div class="line-1">{label}</div>'
        f'    <div class="line-2">{pool if pool else "&nbsp;"}</div>'
        f'    <div class="line-3">Drive: {did} / {cap} / Temp: {temp}</div>'
        '  </div>'
        f'  {led_render}'
        '</div>'
    )

def render_placeholder_slot(title: str) -> str:
    t = escape(title)
    return (
        '<div class="slot placeholder box-blank">'
        f'  <div class="text"><div class="line-1">{t}</div></div>'
        '</div>'
    )

def render_sep_slot() -> str:
    return (
        '<div class="slot separator box-blank">'
        '  <div class="text"><div class="line-1">&nbsp;</div></div>'
        '</div>'
    )

def led_dot(color: str, high_contrast_switch: bool = False) -> str:
    """Return led element color or the icon if high_contrast switch is enabled"""
    if high_contrast_switch:
        ic, lb = drive_led_icon(color)
        return f'<span style="text-transform:uppercase; font-weight:700">{ic} {lb}</span>'
    colors = {
        "green": "#00ff55",
        "yellow": "#ffd100",
        "red": "#ff3b3b",
        "orange": "#E4A11B",
        "blank": "#9e9e9e",
        }
    c = colors.get(color, "#9e9e9e")
    return f'<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:{c}; border:2px solid #ffffff"></span>'

def led_background_color(color: str, high_contrast_switch: bool = False) -> str:
    """Return a light cell background color based on LED color."""
    color = (color or "blank").lower()
    if high_contrast_switch:
        return "#F0F0F0"
    else:
        colors = {
            "green": "#3da94f",
            "yellow": "#d6a31e",
            "red": "#b32121",
            "orange": "#D87904",
            "blank": "#9e9e9e",
        }
        c = colors.get(color, "#9e9e9e")
        return c

def render_row_break(pos: int, cols: int, total_slots: int) -> str:
    """
    add on need a row break to accomplish the css rule of the web rich version to work properly
    """
    if cols > 0 and pos % cols == 0 and pos < total_slots:
        return '<div class="row-break" aria-hidden="true">&nbsp;</div>'
    return ""

def break_string(val: str) -> str:
    if not val:
        return ""
    return "<br/>".join(val)

# ------------------------------------------------------------------
# ------------------------- HTML BUILDING --------------------------
# ------------------------------------------------------------------

# ---------- WEB: rich document with modal and all detail ----------
def render_web_html(
    case: dict,
    rows: int,
    cols: int,
    pos_to_info: dict,
    drive_lookup: dict,
    bays_list: list,
    unplaced_indices: List[int],
    has_real_case: bool,
    high_contrast_switch: bool
) -> str:
    append_log("getting active slots")
    active = [int(x) for x in case["layout"]["activeSlots"]]
    append_log("getting case name")
    name = case.get("name", case.get("id", "Case"))
    total_slots = cols * rows
    append_log("getting bays")
    bays_json = json.dumps(bays_list, ensure_ascii=False)
    append_log("check for the case orientation")
    vertical_rotation = handle_rotate_layout(case)
    append_log(f"need rotation? {vertical_rotation}")
    append_log("calculating css variables")
    gap = get_gap(cols, rows)
    colswidth = get_cols_width(cols)
    rowsheight = get_rows_height(vertical_rotation) #__row_h__
    unpl_colswidth, unpl_rowsheight = colswidth, rowsheight
    if vertical_rotation:
        append_log("swapping col-row")
        colswidth, rowsheight = rowsheight, colswidth
    rotate_slot = slot_rotation(vertical_rotation)

    append_log("set main colors")
    colors_block = f"""
.box-red{{background:linear-gradient(180deg,#b32121,#7a1414);border:1px solid #a32020}}
.box-yellow{{background:linear-gradient(180deg,#d6a31e,#927213);border:1px solid #c59616}}
.box-green{{background:linear-gradient(180deg,#3da94f,#237a33);border:1px solid #166b2d}}
.box-orange{{background:linear-gradient(180deg,#e97822,#a34f0c);border:1px solid #d26510}}
.box-blank{{background:linear-gradient(180deg,#7b7b7b,#4f4f4f);border:1px solid #5e5e5e}}
.slot.placeholder.box-blank{{opacity:1; background: linear-gradient(180deg, {__c_placeholder_slot__}, {__c_placeholder_slot_2__});}}
.slot.separator.box-blank{{opacity:1; background: linear-gradient(180deg, {__c_placeholder_slot__}, {__c_placeholder_slot_2__});}}
.slot .line-1{{font-weight:800;color:#fff;font-size:13px;letter-spacing:.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}}
.slot .line-2{{font-weight:600;color:#cfe7ff;font-size:11px;opacity:.95;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}}
.slot .line-3{{font-weight:600;color:#cccccc;font-size:9px;opacity:.9}}
    """

    if high_contrast_switch:
        append_log("colors swapped for the high contrast version")
        colors_block = f"""
.box-red{{background:#f0f0f0;border:1px solid #1E3A5F}}
.box-yellow{{background:#f0f0f0;border:1px solid #9A4F15}}
.box-green{{background:#f0f0f0;border:1px solid #234F22}}
.box-orange{{background:#f0f0f0;border:1px solid #802828}}
.box-blank{{background:#f0f0f0;border:1px solid #4A4A4A}}
.slot.placeholder.box-blank{{opacity:1; background: {__c_HC_placeholder_slot__};}}
.slot.separator.box-blank{{opacity:1; background: {__c_HC_placeholder_slot__};}}
.slot .line-1{{font-weight:800;color:#000000;font-size:13px;letter-spacing:.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}}
.slot .line-2{{font-weight:600;color:#000000;font-size:11px;opacity:.95;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}}
.slot .line-3{{font-weight:600;color:#000000;font-size:9px;opacity:.9}}
        """
    append_log("set the main structure")
    head = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>{escape(name)}</title>
<style>
:root {{
  --bg:#181818; --border:#0d0d0d; --text:#ddd;
}}
* {{ box-sizing: border-box; }}
body {{ margin:0; background:#0f0f0f; }}
.wrapper{{color:var(--text);font-family:ui-monospace, Menlo, Consolas, monospace;
display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:24px;gap:18px}}
.notice{{background:#241f00;border:1px solid #5a4d00;color:#ffec9c;padding:8px 12px;border-radius:8px;font-size:12px}}
.case{{display:grid;grid-template-columns:repeat({cols},{colswidth}px);grid-template-rows:repeat({rows},{rowsheight}px);
gap:{gap}px;padding:18px;background:var(--bg);border-radius:12px;border:3px solid var(--border);
box-shadow:inset 0 0 15px rgba(255,255,255,.05),inset 0 0 30px rgba(0,0,0,.8)}}
.slot{{border-radius:8px;display:flex;align-items:center;justify-content:flex-start;position:relative;padding:10px 12px;}}
.slot .text{{display:flex;flex-direction:column;gap:3px}}
.slot .led{{width:8px;height:8px;border-radius:50%;position:absolute;top:8px;right:10px;box-shadow:0 0 6px rgba(0,0,0,.4); border: 1px solid #ffffff}}
.slot .led-hc{{position:absolute;top:8px;right:10px;font-weight:700;text-transform: uppercase; color: #000000}}
.slot .led.green{{background:#00ff55;box-shadow:0 0 8px rgba(0,255,85,.55)}}
.slot .led.yellow{{background:#ffd100;box-shadow:0 0 8px rgba(255,209,0,.55)}}
.slot .led.red{{background:#ff3b3b;box-shadow:0 0 8px rgba(255,60,60,.55)}}
.slot .led.orange{{background:#E4A11B;box-shadow:0 0 8px rgba(255,150,60,.55)}}
.slot .led.blank{{background:#9e9e9e;box-shadow:0 0 6px rgba(150,150,150,.45)}}
.slot.empty{{border:1px dashed #333;opacity:.5}}
.slot.empty.not-filled {{background: {__c_notfilled_slot__}; opacity: 1;}}
.slot.filled{{cursor:pointer;transition:transform .06s ease-out, box-shadow .06s ease-out}}
.slot.filled:hover{{transform:translateY(-1px);box-shadow:0 6px 18px rgba(0,0,0,.35);{rotate_slot}}}
{('.case .slot.filled .text { transform: rotate(90deg) translate(5%, 0%); transform-origin: top center; }' if vertical_rotation else '')}
.badge{{position:fixed;top:16px;left:16px;color:#aaa;font-size:12px;letter-spacing:.3px}}
/* right side block before */
.slot.placeholder.box-blank:has(+ .slot.placeholder.box-blank),
.slot.placeholder.box-blank:has(+ .slot.separator.box-blank),
.slot.separator.box-blank:has(+ .slot.placeholder.box-blank),
.slot.separator.box-blank:has(+ .slot.separator.box-blank) {{
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  margin-right: -16px;
  border: none!important;
}}
/* left side block after */
.slot.placeholder.box-blank + .slot.placeholder.box-blank,
.slot.placeholder.box-blank + .slot.separator.box-blank,
.slot.separator.box-blank + .slot.placeholder.box-blank,
.slot.separator.box-blank + .slot.separator.box-blank {{
  margin-left: -16px;
  border-top-left-radius: 0;
  border: none!important;
}}
.row-break{{display:none;}}


/* Modal (animated) */
.modal-backdrop{{position:fixed;inset:0;background:rgba(0,0,0,.6);
display:flex;align-items:center;justify-content:center;z-index:50;
opacity:0;visibility:hidden;pointer-events:none;
transition:opacity .25s ease,visibility 0s linear .25s}}
.modal{{width:min(720px,90vw);max-height:80vh;overflow:auto;
background:#121212;border:1px solid #333;border-radius:12px;
box-shadow:0 10px 40px rgba(0,0,0,.5);
transform:translateY(8px) scale(.97);opacity:0;
transition:transform .28s cubic-bezier(.2,.65,.25,1),opacity .28s ease}}
.modal-backdrop.is-open{{opacity:1;visibility:visible;pointer-events:auto;
transition:opacity .28s ease}}
.modal-backdrop.is-open .modal{{transform:translateY(0) scale(1);opacity:1}}
.modal header{{display:flex;align-items:center;justify-content:space-between;
padding:12px 16px;border-bottom:1px solid #2a2a2a}}
.modal header h3{{margin:0;font-size:14px;color:#eee}}
.modal header button{{background:#222;border:1px solid #444;border-radius:8px;
color:#ddd;padding:6px 10px;cursor:pointer}}
.modal .content{{padding:8px 16px 16px}}
.kv{{display:grid;grid-template-columns:180px 1fr;gap:8px 14px;align-items:start}}
.kv .k{{color:#a8a8a8}}
.kv .v{{color:#e6e6e6;word-break:break-word;white-space:pre-wrap}}
.rotation-wrapper{{ display: inline-block; width: fit-content;}}
/* Unplaced panel */
.unplaced{{width:min(900px,92vw);background:#151515;border:1px dashed #3a3a3a;border-radius:10px;padding:12px}}
.unplaced h4{{margin:0 0 10px 0;color:#cfcfcf;font-size:13px}}
.unplaced .slots{{display:flex;flex-wrap:wrap;gap:22px}}
.unplaced .slot{{width:{unpl_colswidth}px;height:{unpl_rowsheight}px;padding:10px 12px;border-radius:8px;position:relative;
  display:flex;align-items:center;justify-content:flex-start;cursor:pointer;transition:transform .06s ease-out, box-shadow .06s ease-out}}
.unplaced .slot:hover{{transform:translateY(-1px);box-shadow:0 6px 18px rgba(0,0,0,.35)}}
.unplaced .text{{display:flex;flex-direction:column;gap:3px}}
.unplaced .line-1{{font-weight:800;color:#fff;font-size:13px;letter-spacing:.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}}
.unplaced .line-2{{font-weight:600;color:#cfe7ff;font-size:11px;opacity:.95;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}}
.unplaced .line-3{{font-weight:600;color:#cccccc;font-size:11px;opacity:.9}}
.unplaced .led{{width:8px;height:8px;border-radius:50%;position:absolute;top:8px;right:10px}}
{colors_block}
</style></head><body>
{(f'<div class="badge">{escape(name)}</div>' if has_real_case else '')}
<div class="wrapper">
{("<div class='notice'>No case selected — some drives are unplaced.</div>" if (unplaced_indices and not has_real_case) else "")}
{("<div class='case'>" if has_real_case else '')}"""
    parts = [head]

    total_slots = cols * rows
    append_log("mapping placeholder slots")
    placeholder_map = get_placeholder_map(case)
    append_log("mapping active slots")
    active = [int(x) for x in case["layout"]["activeSlots"]]
    active_set = set(active) | set(placeholder_map.keys())
    append_log("mapping separator slots")
    sep_slots = set(get_sep_slots(case))
    active_set |= sep_slots
    append_log("all slots have been merged. Start cycling")

    for pos in range(1, total_slots + 1):
        append_log(f">> {pos}")
        if pos not in active_set:
            append_log("empty bay")
            hide_empty_bay = ' style="display:none;"' if not has_real_case else ''
            parts.append(f'<div class="slot empty"{hide_empty_bay}></div>')
            continue

        if pos in placeholder_map:
            append_log("placeholder bay")
            parts.append(render_placeholder_slot(placeholder_map[pos]))
            parts.append(render_row_break(pos, cols, total_slots))
            continue

        if pos in sep_slots:
            append_log("separator bay")
            parts.append(render_sep_slot())
            parts.append(render_row_break(pos, cols, total_slots))
            continue

        append_log("active slot")
        info = pos_to_info.get(pos)
        serial = info.get("serial") if info else None
        bay_idx = info.get("bay_index") if info else None
        append_log(f"{serial}")
        if serial and serial in drive_lookup:
            d = drive_lookup[serial]
            parts.append(render_drive_line(d, bay_idx, high_contrast_switch))
            append_log("drive generated")
        else:
            hide_empty_bay = ' style="display:none;"' if not has_real_case else ''
            parts.append(f'<div class="slot empty not-filled"{hide_empty_bay}> {"⭕" if high_contrast_switch else "&nbsp;"} </div>')
            append_log("drive not correctly generated or slot not filled")

    # Unplaced drives panel (only if present and not hidden)
    if has_real_case:
        parts.append("</div>")  # close .case
    if unplaced_indices:
        append_log("some drive are not placed, generating unplaced code")
        parts.append('<div class="unplaced">')
        parts.append('<h4>Unplaced drives</h4>')
        parts.append('<div class="slots">')
        for idx in unplaced_indices:
            append_log(f"generating {idx}")
            b = bays_list[idx] or {}
            parts.append(render_drive_line(b, idx, high_contrast_switch))
            append_log("drive generated")
        parts.append('</div></div>')


    append_log("building modal and script")
    # Modal + script
    parts.append(f"""</div>

<div class="modal-backdrop" id="modalBackdrop">
  <div class="modal" role="dialog" aria-modal="true">
    <header>
      <h3 id="modalTitle">Drive details</h3>
      <button type="button" id="modalClose">Close</button>
    </header>
    <div class="content">
      <div class="kv" id="kvList"></div>
    </div>
  </div>
</div>

<script>
const BAYS = {bays_json};
const backdrop = document.getElementById('modalBackdrop');
const kvList = document.getElementById('kvList');
const title = document.getElementById('modalTitle');
const btnClose = document.getElementById('modalClose');

let lastFocus = null;

function openModal(bay) {{
  title.textContent = (bay.serial || bay.drive_id || 'Drive details');
  kvList.innerHTML = '';
  Object.keys(bay).forEach(k => {{
    const kEl = document.createElement('div'); kEl.className='k'; kEl.textContent = k;
    const vEl = document.createElement('div'); vEl.className='v';
    let val = bay[k];
    if (val === null || val === undefined || val === '') val = '—';
    vEl.textContent = String(val);
    kvList.appendChild(kEl);
    kvList.appendChild(vEl);
  }});
  lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  backdrop.classList.add('is-open');
  setTimeout(() => btnClose.focus(), 0);
}}

function closeModal() {{
  backdrop.classList.remove('is-open');
  if (lastFocus) lastFocus.focus();
}}

document.addEventListener('click', (e) => {{
  const slot = e.target.closest('.slot.filled[data-bay]');
  if (slot) {{
    const idx = Number(slot.getAttribute('data-bay'));
    if (!Number.isNaN(idx) && BAYS[idx]) return openModal(BAYS[idx]);
  }}
  const row = e.target.closest('.unplaced .slot[data-bay]');
  if (row) {{
    const idx = Number(row.getAttribute('data-bay'));
    if (!Number.isNaN(idx) && BAYS[idx]) return openModal(BAYS[idx]);
  }}
}});

btnClose.addEventListener('click', closeModal);
backdrop.addEventListener('click', (e) => {{ if (e.target === backdrop) closeModal(); }});
document.addEventListener('keydown', (e) => {{ if (e.key === 'Escape') closeModal(); }});
</script>

</body></html>""")
    append_log("got the snipplet")
    return "\n".join(parts)

# -----------------------------------------------------------
# ---------- EMAIL: second improved inline version ----------
def render_table_email_snippet(
    case: dict,
    rows: int,
    cols: int,
    pos_to_info: dict,
    drive_lookup: dict,
    bays_list: list,
    unplaced_indices: list[int],
    has_real_case: bool,
    high_contrast_switch: bool,
) -> str:
    """
    Table-based email snippet inline version
    """
    append_log("mapping placeholder slots")
    placeholder_map = get_placeholder_map(case)
    append_log("mapping separator slots")
    sep_slots = set(get_sep_slots(case))
    append_log("getting active slots")
    active = set(int(x) for x in case["layout"].get("activeSlots", []))
    active_set = active | set(placeholder_map.keys()) | sep_slots
    append_log("all slots have been merged. Start cycling")

    append_log("calculating inline style variables")
    vertical_rotation = handle_rotate_layout(case)
    colswidth = get_cols_width(cols)
    colsheight = get_rows_height(cols)
    cellpadding = 0 if not vertical_rotation else 10
    unpl_colswidth, unpl_rowsheight = colswidth+30, colsheight
    if vertical_rotation:
        append_log("swapping col-row")
        colswidth, colsheight = colsheight, colswidth

    parts: list[str] = []

    append_log("building main table")
    parts.append(
        f"""
        <table align="center" border="0" cellpadding="{cellpadding}" cellspacing="0"
        style="border-collapse:separate;border-spacing:5px;
        background-color:#181818;border:1px solid #282828;
        border-radius:12px;padding:5px;">
        """
    )

    if has_real_case:
        append_log("start cycling")
        for r in range(rows):
            parts.append("<tr>")
            colspan = 0
            for c in range(cols):
                pos = r * cols + c + 1
                append_log(f">> {pos}")

                if pos not in active_set:
                    append_log("empty bay")
                    parts.append(
                        f'<td style="width:{colswidth}px; min-width:{colswidth}px; height:{colsheight}px; min-height:{colsheight}px;'
                        'border:1px dashed #444444;border-radius:8px;'
                        'text-align:center;vertical-align:middle;">&nbsp;</td>'
                    )
                    continue

                if pos in placeholder_map:
                    append_log("placeholder bay")
                    title = escape(placeholder_map[pos])
                    # if vertical_rotation:
                    #    title = break_string(title)
                    bg = border = __c_HC_placeholder_slot__ if high_contrast_switch else __c_placeholder_slot__
                    text_color = "#000000" if high_contrast_switch else "#FFFFFF"
                    i = c
                    for i in range(c+1, cols):
                        test = r * cols + i + 1
                        if (
                            test in placeholder_map or
                            test not in sep_slots
                        ):
                            break
                    else:
                        i += 1
                    colspan = i - c
                    parts.append(
                        f'<td style="width:{colswidth}px; min-width:{colswidth}px; height:{colsheight}px; min-height:{colsheight}px;'
                        f'border:1px solid {border};border-radius:8px;'
                        f'background-color:{bg};padding:8px 12px;vertical-align:middle;"'
                        f'colspan={colspan}>'
                        f'<div style="font-weight:800;font-size:{"10" if vertical_rotation else "13"}px;'
                        f'color:{text_color};white-space:nowrap;overflow:hidden;'
                        f'text-overflow:ellipsis;">{title}</div>'
                        '</td>'
                    )
                    colspan -= 1    # We don't need to skip the existing cell
                    continue

                if pos in sep_slots:
                    if colspan:
                        append_log("skipping spanned separator bay")
                        colspan -= 1
                        continue

                    append_log("separator bay")
                    bg = __c_HC_placeholder_slot__ if high_contrast_switch else __c_placeholder_slot__
                    parts.append(
                        f'<td style="width:{colswidth}px; min-width:{colswidth}px; height:{colsheight}px; min-height:{colsheight}px;'
                        f'border:1px solid {bg};border-radius:8px;'
                        f'background-color:{bg};">&nbsp;</td>'
                    )
                    continue

                append_log("active slot")
                info = pos_to_info.get(pos)
                serial = info.get("serial") if info else None
                if serial and serial in drive_lookup:
                    d = drive_lookup[serial]
                    append_log(f"{drive_label(d)}")
                    line1 = escape(drive_label(d))
                    if vertical_rotation:
                        line1 = break_string(line1)
                    line2 = escape(drive_pool(d))
                    line3 = escape(drive_id(d))
                    line4 = escape(drive_capacity(d))
                    line5 = escape(drive_temp(d))

                    led_color = (d.get("led") or d.get("drive_color") or "blank")
                    led_color = led_color.lower() if isinstance(led_color, str) else "blank"

                    bg = border = led_background_color(led_color, high_contrast_switch)
                    text_color_1 = "#000000" if high_contrast_switch else "#FFFFFF"
                    text_color_2 = "#000000" if high_contrast_switch else "#FFFFFF"

                    parts.append(
                        f'<td style="width:{colswidth}px; min-width:{colswidth}px; height:{colsheight}px; min-height:{colsheight}px;'
                        f'border:1px solid {border};border-radius:8px;'
                        f'background-color:{bg};padding:8px 12px;vertical-align:middle;">'
                        '<table border="0" cellpadding="0" cellspacing="0" width="100%">'
                        '<tr>'
                        '<td style="vertical-align:top;">'
                        f'<div style="font-weight:800;font-size:{11 if vertical_rotation else 10}px;'
                        f'color:{text_color_1};white-space:nowrap;overflow:hidden;'
                        f'text-overflow:ellipsis;">{line1}</div>'
                        f'<div style="font-weight:600;'
                        f'color:{text_color_2};white-space:nowrap;overflow:hidden;'
                        f'text-overflow:ellipsis;{" font-size:9px;" if vertical_rotation else "font-size:11px;"}">{"</br>" if vertical_rotation else ""}{line2}</div>'
                        f'<div style="font-weight:600;font-size:9px; '
                        f'color:{text_color_2};">Drive: {line3} {"</br>" if vertical_rotation else "/"} {line4} {"</br>" if vertical_rotation else "/"} Temp: {line5}</div>'
                        '</td>'
                        '<td style="width:40px;text-align:right;vertical-align:top;">'
                        f'{led_dot(led_color, high_contrast_switch)}'
                        '</td>'
                        '</tr>'
                        '</table>'
                        '</td>'
                    )
                    append_log("drive generated")
                else:
                    parts.append(
                        f'<td style="width:{colswidth}px;height:{colsheight}px;background:{__c_notfilled_slot__};'
                        'border:1px dashed #444444;border-radius:8px;'
                        f'text-align:center;vertical-align:middle;color:gray;">{"⭕" if high_contrast_switch else "Empty"}</td>'
                    )
                    append_log("drive not correctly generated or slot not filled")
            parts.append("</tr>")

    parts.append("</table>")
    append_log("first table generated")

    # Unplaced drives
    if unplaced_indices:
        append_log("some drive are not placed, generating unplaced table")
        parts.append(
            '<table border="0" cellpadding="0" cellspacing="0" align="center" '
            'style="margin-top:10px;border-collapse:separate;border-spacing:8px;">'
        )
        for i, idx in enumerate(unplaced_indices):
            append_log(f"generating {idx}")
            if i % 2 == 0:
                parts.append("<tr>")
            b = bays_list[idx] or {}
            line1 = escape(drive_label(b))
            line2 = escape(drive_pool(b))
            line3 = escape(drive_id(b))
            line4 = escape(drive_capacity(b))
            line5 = escape(drive_temp(b))

            led_color = (b.get("led") or b.get("drive_color") or "blank")
            led_color = led_color.lower() if isinstance(led_color, str) else "blank"

            bg = border = led_background_color(led_color, high_contrast_switch)
            text_color = "#000000" if high_contrast_switch else "#FFFFFF"

            parts.append(
                f'<td style="width:{unpl_colswidth}px;height:{unpl_rowsheight}px;'
                f'border:1px solid {border};border-radius:8px;'
                f'background-color:{bg};padding:8px 12px;vertical-align:middle;">'
                '<table border="0" cellpadding="0" cellspacing="0" width="100%">'
                '<tr>'
                '<td style="vertical-align:top;">'
                f'<div style="font-weight:800;font-size:13px;color:{text_color};'
                'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'
                f'{line1}</div>'
                f'<div style="font-weight:600;font-size:11px;color:{text_color};'
                'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'
                f'{line2}</div>'
                f'<div style="font-weight:600;font-size:11px;color:{text_color};">'
                f'Drive: {line3} / {line4} / Temp: {line5}</div>'
                '</td>'
                '<td style="width:40px;text-align:right;vertical-align:top;">'
                f'{led_dot(led_color, high_contrast_switch)}'
                '</td>'
                '</tr>'
                '</table>'
                '</td>'
            )
            append_log("drive generated")
            if i % 2 == 1:
                parts.append("</tr>")
        if len(unplaced_indices) % 2 == 1:
            parts.append("</tr>")
        parts.append("</table>")
        append_log("unplaced table generated")
    append_log("got the snipplet")
    return "\n".join(parts)

# ---------- CLI ----------
def main():
    parser = argparse.ArgumentParser(description="Render case layout: output a rich web page plus a smaller snipplet")
    parser.add_argument("--config", default=__input_default__, help=f"Path to unified JSON configuration. Default: {__input_default__}")
    parser.add_argument("--debug_enabled", help="OPTIONAL use to let the script debug all steps into log files. Usefull for troubleshooting", action="store_true")

    args = parser.parse_args()
    global DEBUG_ENABLED
    DEBUG_ENABLED = args.debug_enabled

    append_log(f"## script version {__version__} ##")
    append_log(f"start preliminary security check")
    assert_outputs_secure_or_abort()

    append_log(f"loading configuration file")
    cfg = load_json(args.config)

    if "bays" not in cfg:
        process_output(True, "[ERROR] Config JSON must contain 'bays'", 1)

    append_log(f"preparing data...")
    # Safe case selection (handles missing/empty activeSlots)
    case_raw = cfg.get("case")
    case, has_real_case = validate_case(case_raw)

    cols = get_cols(case)
    rows = rows_from_case(case, cols)
    bays_list = cfg.get("bays", []) or []

    pos_to_info, unplaced_indices = build_pos_map_from_bays(bays_list)
    drive_lookup = normalize_drives_from_bays(bays_list)

    if not has_real_case:
        unplaced_indices = [i for i, b in enumerate(bays_list) if is_real_drive(b)]
        pos_to_info = {}

    # check for high contrast swtich - unused from case defintion bool(cfg.get("case", {}).get("high_contrast", False))
    high_contrast_switch = str(cfg.get("high_contrast", "false")).lower() == "true"

    append_log(f"rendering rich text file")
    try:
        web_html = render_web_html(
            case, rows, cols, pos_to_info, drive_lookup, bays_list, unplaced_indices, has_real_case, high_contrast_switch)
        with open(__output_render__, "w", encoding="utf-8") as f:
            f.write(web_html)
    except Exception as e:
        process_output(True, f"Something wrong on rendering richt text file {e}", 1)

    append_log(f"rendering table-based email snipplet")
    try:
        table_email_html = render_table_email_snippet(
            case, rows, cols, pos_to_info, drive_lookup, bays_list, unplaced_indices, has_real_case, high_contrast_switch)
        with open(__output_render_snipplet__, "w", encoding="utf-8") as f:
            f.write(table_email_html)
    except Exception as e:
        process_output(True, f"Something wrong on rendering table-based email snipplet file {e}", 1)

    process_output(False, "Operation completed", 0)

if __name__ == "__main__":
    main()

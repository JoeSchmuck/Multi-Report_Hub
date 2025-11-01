import json, argparse, os, sys, stat
from html import escape
from typing import Tuple, Dict, List

##### V 0.01
##### Stand alone script to generate the html render for config.json

__version__ = "0.01"
__cols__ = 4
__script_directory__ = os.getcwd()
__script_path__ = os.path.abspath(__file__)
__script_name__ = os.path.basename(__script_path__)
__input_default__ = os.path.join(__script_directory__, "config.json")
__output_render__ = os.path.join(__script_directory__, "case_render.html")
__output_render_snipplet__ = os.path.join(__script_directory__, "case_email_snippet.html")


def assert_outputs_secure_or_abort() -> bool:
    """
    Security check 
    """
    append_log("testing symlink on output")
    for out_path in (__output_render__, __output_render_snipplet__):
        if os.path.lexists(out_path) and os.path.islink(out_path):
            process_output(True, f"[SECURITY ERROR]: output file '{out_path}' is a symlink; refusing to write.", 1)

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
            process_output(True, f"[SECURITY ERROR]: directory '{d}' is writable by non-privileged users; operation aborted.", 1)

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


def safe_case(original_case: dict | None) -> Tuple[dict, bool]:
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


def drive_label(d: dict) -> str:
    return get_field(d, "serial", "") or get_field(d, "drive_id", "disk")

def drive_pool(d: dict) -> str:
    return get_field(d, "pool", "--SPARE-")

def drive_address(d: dict) -> str:
    return str(d.get("address") or "").strip()

def drive_temp(d: dict) -> str:
    t = d.get("drive_temp")
    if t is None or t == "":
        return "–"
    return f"{t}°C" if isinstance(t, (int, float)) and not str(t).endswith("°C") else str(t)

def drive_capacity(d: dict) -> str:
    return get_field(d, "capacity")

def drive_id(d: dict) -> str:
    return get_field(d, "drive_id")

def render_drive_line(d: dict, bay_idx) -> str:
    label = escape(drive_label(d))
    pool = escape(drive_pool(d))
    temp = escape(drive_temp(d))
    led = drive_led_color(d)
    did = escape(drive_id(d))
    cap = escape(drive_capacity(d))   
    return (
        f'<div class="slot filled box-{led}" data-bay="{bay_idx}">'
        f'  <div class="text">'
        f'    <div class="line-1">{label}</div>'
        f'    <div class="line-2">{pool if pool else "&nbsp;"}</div>'
        f'    <div class="line-3">Drive: {did} / {cap} / Temp: {temp}</div>'
        f'  </div>'
        f'  <div class="led {led}"></div>'
        f'</div>'
    )

# ---------- WEB: rich document with modal (+ Unplaced when applicable) ----------
def render_web_html(
    case: dict,
    rows: int,
    cols: int,
    pos_to_info: dict,
    drive_lookup: dict,
    bays_list: list,
    unplaced_indices: List[int],
    has_real_case: bool,
) -> str:
    active = [int(x) for x in case["layout"]["activeSlots"]]
    name = case.get("name", case.get("id", "Case"))
    total_slots = cols * rows
    bays_json = json.dumps(bays_list, ensure_ascii=False)

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
.case{{display:grid;grid-template-columns:repeat({cols},275px);grid-template-rows:repeat({rows},58px);
gap:22px;padding:18px;background:var(--bg);border-radius:12px;border:3px solid var(--border);
box-shadow:inset 0 0 15px rgba(255,255,255,.05),inset 0 0 30px rgba(0,0,0,.8)}}
.slot{{border-radius:8px;display:flex;align-items:center;justify-content:flex-start;position:relative;padding:10px 12px;}}
.slot .text{{display:flex;flex-direction:column;gap:3px}}
.slot .line-1{{font-weight:800;color:#fff;font-size:13px;letter-spacing:.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}}
.slot .line-2{{font-weight:600;color:#cfe7ff;font-size:11px;opacity:.95;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}}
.slot .line-3{{font-weight:600;color:#cccccc;font-size:11px;opacity:.9}}
.slot .led{{width:8px;height:8px;border-radius:50%;position:absolute;top:8px;right:10px;box-shadow:0 0 6px rgba(0,0,0,.4)}}
.slot .led.green{{background:#00ff55;box-shadow:0 0 8px rgba(0,255,85,.55)}}
.slot .led.yellow{{background:#ffd100;box-shadow:0 0 8px rgba(255,209,0,.55)}}
.slot .led.red{{background:#ff3b3b;box-shadow:0 0 8px rgba(255,60,60,.55)}}
.slot .led.orange{{background:#E4A11B;box-shadow:0 0 8px rgba(255,150,60,.55)}}
.slot .led.blank{{background:#9e9e9e;box-shadow:0 0 6px rgba(150,150,150,.45)}}
.box-red{{background:linear-gradient(180deg,#b32121,#7a1414);border:1px solid #a32020}}
.box-yellow{{background:linear-gradient(180deg,#d6a31e,#927213);border:1px solid #c59616}}
.box-green{{background:linear-gradient(180deg,#3da94f,#237a33);border:1px solid #166b2d}}
.box-orange{{background:linear-gradient(180deg,#e97822,#a34f0c);border:1px solid #d26510}}
.box-blank{{background:linear-gradient(180deg,#7b7b7b,#4f4f4f);border:1px solid #5e5e5e}}
.slot.empty{{border:1px dashed #333;opacity:.5}}
.slot.filled{{cursor:pointer;transition:transform .06s ease-out, box-shadow .06s ease-out}}
.slot.filled:hover{{transform:translateY(-1px);box-shadow:0 6px 18px rgba(0,0,0,.35)}}
.badge{{position:fixed;top:16px;left:16px;color:#aaa;font-size:12px;letter-spacing:.3px}}

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

/* Unplaced panel */
.unplaced{{width:min(900px,92vw);background:#151515;border:1px dashed #3a3a3a;border-radius:10px;padding:12px}}
.unplaced h4{{margin:0 0 10px 0;color:#cfcfcf;font-size:13px}}
.unplaced .slots{{display:flex;flex-wrap:wrap;gap:22px}}
.unplaced .slot{{width:200px;height:58px;padding:10px 12px;border-radius:8px;position:relative;
  display:flex;align-items:center;justify-content:flex-start;cursor:pointer;transition:transform .06s ease-out, box-shadow .06s ease-out}}
.unplaced .slot:hover{{transform:translateY(-1px);box-shadow:0 6px 18px rgba(0,0,0,.35)}}
.unplaced .text{{display:flex;flex-direction:column;gap:3px}}
.unplaced .line-1{{font-weight:800;color:#fff;font-size:13px;letter-spacing:.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}}
.unplaced .line-2{{font-weight:600;color:#cfe7ff;font-size:11px;opacity:.95;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}}
.unplaced .line-3{{font-weight:600;color:#cccccc;font-size:11px;opacity:.9}}
.unplaced .led{{width:8px;height:8px;border-radius:50%;position:absolute;top:8px;right:10px}}

</style></head><body>
{(f'<div class="badge">{escape(name)}</div>' if has_real_case else '')}
<div class="wrapper">
{("<div class='notice'>No case selected — some drives are unplaced.</div>" if (unplaced_indices and not has_real_case) else "")}
{("<div class='case'>" if has_real_case else '')}"""
    parts = [head]

    total_slots = cols * rows
    active = [int(x) for x in case["layout"]["activeSlots"]]

    for pos in range(1, total_slots + 1):
        if pos not in active:
            hide_empty_bay = ' style="display:none;"' if not has_real_case else ''
            parts.append(f'<div class="slot empty"{hide_empty_bay}></div>')
            continue

        info = pos_to_info.get(pos)
        serial = info.get("serial") if info else None
        bay_idx = info.get("bay_index") if info else None

        if serial and serial in drive_lookup:
            d = drive_lookup[serial]
            parts.append(render_drive_line(d, bay_idx))

        else:
            hide_empty_bay = ' style="display:none;"' if not has_real_case else ''
            parts.append(f'<div class="slot empty"{hide_empty_bay}></div>')

    # Unplaced drives panel (only if present and not hidden)
    if has_real_case:
        parts.append("</div>")  # close .case
    if unplaced_indices:
        parts.append('<div class="unplaced">')
        parts.append('<h4>Unplaced drives</h4>')
        parts.append('<div class="slots">')
        for idx in unplaced_indices:
            b = bays_list[idx] or {}
            parts.append(render_drive_line(b, idx))
        parts.append('</div></div>')


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
    return "\n".join(parts)


# ---------- EMAIL: safe snippet (no title, no global selectors) + Unplaced when applicable ----------
def build_email_css(namespace: str = ".case-email") -> str:
    ns = namespace
    return f"""
{ns} {{ color:#ddd; font-family:ui-monospace, Menlo, Consolas, monospace; }}
{ns} .case {{
  display:grid;
  grid-template-columns:repeat(var(--cols,{__cols__}), 275px);
  grid-auto-rows:58px;
  gap:16px;
  padding:10px;
  background:#181818;
  border-radius:12px;
  border:1px solid #282828;
  width: fit-content;
  margin: 0 auto;
}}
{ns} .slot {{ border-radius:8px; display:flex; align-items:center; justify-content:flex-start; position:relative; padding:10px 12px; }}
{ns} .text {{ display:flex; flex-direction:column; gap:3px }}
{ns} .line-1 {{ font-weight:800; color:#fff; font-size:13px; letter-spacing:.2px; max-width:160px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }}
{ns} .line-2 {{ font-weight:600; color:#cfe7ff; font-size:11px; opacity:.95; max-width:160px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }}
{ns} .line-3 {{ font-weight:600; color:#cccccc; font-size:11px; opacity:.9 }}
{ns} .led {{ width:8px; height:8px; border-radius:50%; position:absolute; top:8px; right:10px; }}
{ns} .led.green  {{ background:#00ff55 }}
{ns} .led.yellow {{ background:#ffd100 }}
{ns} .led.red    {{ background:#ff3b3b }}
{ns} .led.orange {{ background:#E4A11B }}
{ns} .led.blank  {{ background:#9e9e9e }}
{ns} .box-red    {{ background:linear-gradient(180deg,#b32121,#7a1414); border:1px solid #a32020 }}
{ns} .box-yellow {{ background:linear-gradient(180deg,#d6a31e,#927213); border:1px solid #c59616 }}
{ns} .box-green  {{ background:linear-gradient(180deg,#3da94f,#237a33); border:1px solid #166b2d }}
{ns} .box-orange {{ background:linear-gradient(180deg,#e97822,#a34f0c); border:1px solid #d26510 }}
{ns} .box-blank  {{ background:linear-gradient(180deg,#7b7b7b,#4f4f4f); border:1px solid #5e5e5e }}
{ns} .slot.empty {{ border:1px dashed #444; opacity:.55 }}
{ns} .unplaced{{margin-top:10px;text-align:center;}}
{ns} .unplaced .row{{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;}}
{ns} .unplaced .slot{{width:200px;height:58px;padding:10px 12px;border-radius:8px;position:relative;
  display:flex;align-items:center;justify-content:flex-start;}}
{ns} .unplaced .text{{display:flex;flex-direction:column;gap:3px}}
{ns} .unplaced .line-1{{font-weight:800;color:#fff;font-size:13px;letter-spacing:.2px;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}
{ns} .unplaced .line-2{{font-weight:600;color:#cfe7ff;font-size:11px;opacity:.95;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}
{ns} .unplaced .line-3{{font-weight:600;color:#cccccc;font-size:11px;opacity:.9}}
{ns} .unplaced .led{{width:8px;height:8px;border-radius:50%;position:absolute;top:8px;right:10px;}}

""".strip()


def render_email_snippet(
    case: dict,
    rows: int,
    cols: int,
    pos_to_info: dict,
    drive_lookup: dict,
    bays_list: list,
    unplaced_indices: List[int],
    has_real_case: bool,
) -> str:
    active = set(int(x) for x in case["layout"]["activeSlots"])
    total_slots = rows * cols
    css = build_email_css(".case-email")

    parts = [f"<style>{css}</style>"]
    parts.append(f'<div class="case-email" style="--cols:{cols};">')
    if has_real_case:
        parts.append('  <div class="case">')

        for pos in range(1, total_slots + 1):
            if pos not in active:
                parts.append('    <div class="slot empty"></div>')
                continue

            info = pos_to_info.get(pos)
            serial = info.get("serial") if info else None

            if serial and serial in drive_lookup:
                d = drive_lookup[serial]
                parts.append(render_drive_line(d, -1))
            else:
                parts.append('    <div class="slot empty"></div>')
    if has_real_case:
        parts.append('  </div>')  # close .case

    # Unplaced table (only if present and not hidden)
    if unplaced_indices:
        parts.append('<div class="unplaced">')
        parts.append('<div class="row">')
        for idx in unplaced_indices:
            b = bays_list[idx] or {}
            parts.append(render_drive_line(b, -1))
        parts.append('</div></div>')
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
    case, has_real_case = safe_case(case_raw)

    cols = get_cols(case)
    rows = rows_from_case(case, cols)
    bays_list = cfg.get("bays", []) or []

    pos_to_info, unplaced_indices = build_pos_map_from_bays(bays_list)
    drive_lookup = normalize_drives_from_bays(bays_list)
    
    if not has_real_case:
        unplaced_indices = [i for i, b in enumerate(bays_list) if is_real_drive(b)]
        pos_to_info = {}

    append_log(f"rendering rich text file")
    try:
        web_html = render_web_html(
            case, rows, cols, pos_to_info, drive_lookup, bays_list, unplaced_indices, has_real_case)
        with open(__output_render__, "w", encoding="utf-8") as f:
            f.write(web_html)
    except Exception as e:
        process_output(True, f"Something wrong on rendering richt text file {e}", 1)  
        
    append_log(f"rendering snipplet file")
    try:
        email_html = render_email_snippet(
            case, rows, cols, pos_to_info, drive_lookup, bays_list, unplaced_indices, has_real_case)
        with open(__output_render_snipplet__, "w", encoding="utf-8") as f:
            f.write(email_html)
    except Exception as e:
        process_output(True, f"Something wrong on rendering snipplet file {e}", 1)              

    process_output(False, "Operation completed", 0)

if __name__ == "__main__":
    main()

// === Theme & Locale Bootstrap ===
(function(){
  const storageKey = 'theme-preference';
  const getPref = () => localStorage.getItem(storageKey) || 'auto';
  const setPref = (v) => { localStorage.setItem(storageKey, v); applyTheme(); };

  function systemIsDark(){ return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; }
  function currentTheme(){
    const pref = getPref();
    if (pref === 'auto') return systemIsDark() ? 'dark' : 'light';
    return (pref === 'dark') ? 'dark' : 'light';
  }
  function applyTheme(){
    const theme = currentTheme();
    document.documentElement.setAttribute('data-bs-theme', theme);
    // reflect active button
    document.querySelectorAll('[data-theme-value]').forEach(btn => {
      const active = btn.getAttribute('data-theme-value') === getPref();
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
  // init
  applyTheme();
  // watch system changes if auto
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (getPref() === 'auto') applyTheme();
    });
  } catch {}
  // wire buttons
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-theme-value]');
    if (!btn) return;
    setPref(btn.getAttribute('data-theme-value'));
  });
  // footer year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
  // expose (optional)
  window.ThemePref = {get:getPref,set:setPref};
})();
// === End Theme & Locale Bootstrap ===

// Disk Layout Tool - single JSON, no ports

let RAW_CONFIG = null;           // Original JSON (preserved)
let CASE_MODELS = [];            // From case_models.js (global)
let currentCase = null;          // Selected case object
// --- expose safe getter/setter for global access ---
Object.defineProperty(window, 'currentCase', {
  get() { return currentCase; },
  set(v) { currentCase = v; },
  configurable: true,
  enumerable: false
});
const disksRegistry = new Map(); // serial -> full record

// --- Utilities ---
function loadCaseModels(){
  if (Array.isArray(window.CASE_MODELS) && window.CASE_MODELS.length){
    CASE_MODELS = window.CASE_MODELS;
    return true;
  }
  toastr.error('case_models.js missing or empty.');
  $('#open-case-modal,#reset-layout,#save-config,#open-custom-case-modal').prop('disabled', true);
  return false;
}

function setCaseLabel(){
  const $label = $('#current-case-label');
  const $rot   = $('#rotate-layout-switch');

  if (!currentCase) {
    $label.val('No case');
    if ($rot.length)   $rot.prop('checked', false);
    return;
  }
  $label.val(currentCase.name || currentCase.id);
  if ($rot.length) {
    const rotateFlag = !!(currentCase.layout && currentCase.layout.rotate);
    $rot.prop('checked', rotateFlag);
  }

}

function buildEmptyCaseHint(){
  const $case = $('#case');
  $case.removeClass('grid').addClass('empty-hint')
       .html('<div class="text-center text-muted py-5">No case selected. Choose a case or load a config with case info.</div>');
}

// Create disk element from registry record
function makeDiskEl(rec){
  let color = (rec.drive_color || 'blank').toLowerCase();
  const validColors = ['green', 'yellow', 'red', 'orange', 'blank'];
  if (!validColors.includes(color)) { color = 'blank'; }
  var seriallabel = rec.serial.replace(/-/g, ''); // - is breaking layout?
  const colorClass = `clr-${color}`; // clr-green / clr-yellow / clr-red / clr-orange / clr-blank
  const pin = `</br><i class="small">${rec.address } </i>`; //hide-filled -- + (rec.pool ? ' - '+rec.pool : '')
  const meta = `<span class="meta">${(rec.type || '') + (rec.capacity ? ' </br> '+rec.capacity : '') }</span>`;
  const pill = $(`<div class=\"disk ${colorClass}\" data-serial=\"${rec.serial}\"><span class=\"fw-semibold\">${seriallabel|| rec.drive_id} ${pin}</span>${meta}</div>`);
  return pill;
}


// Rebuild unassigned list (disks not inside any bay)
function rebuildUnassignedFromRegistry(){
  const placed = new Set();
  $('#case .bay .disk').each(function(){
    const s = $(this).attr('data-serial'); if (s) placed.add(s);
  });
  const $list = $('#unassigned').empty();
  let count = 0;
  for (const [serial, rec] of disksRegistry){
    if (!placed.has(serial)){
      $list.append(makeDiskEl(rec).addClass('list-group-item list-group-item-action'));
      count++;
    }
  }
  $('#disk-count-badge').text(count);
  if (count === 0 && currentCase) {
    $('#save-config').addClass('mr-highlight').delay(1200).queue(function(n){ $(this).removeClass('mr-highlight'); n(); });
    $.playSound('../assets/kids_cheering.mp3');
  }
  initSortableForUnassigned();
}

function resetAllState(){
  clearPlacements();
  $('#unassigned').empty();
  $('#disk-count-badge').text('0');
  RAW_CONFIG = null;
  disksRegistry.clear();
  currentCase = null;
  setCaseLabel();
  buildEmptyCaseHint();
  $('#save-config,#reset-layout,#open-case-modal,#open-custom-case-modal').prop('disabled', true);
}

// --- Case building NEW ---
function getColsFromModel(model){
  const cols = parseInt(model?.layout?.cols, 10);
  return (Number.isInteger(cols) && cols > 0) ? cols : 4;
}
function idxToRowCol(idx, cols){
  const n = parseInt(idx,10);
  const C = Number.isInteger(cols) && cols>0 ? cols : 4; // need a fallback
  return { row: Math.ceil(n / C), col: ((n-1) % C) + 1 };
}

function computeActivePositions(model){
  const L = model?.layout || {};
  if (!Array.isArray(L.activeSlots) || !L.activeSlots.length) throw new Error('layout.activeSlots is required');
  const cols = getColsFromModel(model);
  const positions = L.activeSlots.map(idx => idxToRowCol(idx, cols));
  const rows = L.rows || Math.max(...positions.map(p=>p.row));
  return { rows, cols, active: positions };
}

// --- helper to better handle huge case and now vertical orientation
// the render py can handle smoothly 8 horizontal cols
// instead of the GUI break at 6 the goal is to preserve consistent output for both
function apply8colpatch(cols,rows) {
  const $rot = $('#rotate-layout-switch');
  const rotateChecked = $rot.length ? $rot.is(':checked') : false;
  const isBreakout = cols > 8;
  var isWide = cols >= 6;
  if (isWide && isBreakout && !rotateChecked) {
    $rot.prop('checked', true);
    if (currentCase && currentCase.layout) {
      currentCase.layout.rotate = true;
    }
  }
  if (!isWide && rotateChecked) {
    isWide = true;
  }
  const $containerbody = $('#mr-case-body-container');
  const $left  = $('#mr-unassigned-disk-container');
  const $right = $('#mr-case-container');
  $left.removeClass('col-lg-12 col-lg-3 col-lg-2');
  $right.removeClass('col-lg-12 col-lg-9 col-lg-10');
  $containerbody.removeClass('scroll-x');
  const $grid = $containerbody.find('#case');
  var gridcols = "1fr"
  var gridrows = "100px"

  if (isWide) {
    setTimeout(() => { $('.bay').addClass('bay-wide');}, 50);
    $left.addClass('col-lg-2');
    $right.addClass('col-lg-10');
    $containerbody.addClass('scroll-x');
    if(cols >10) { gridcols = "80px";}
    else {gridcols = "120px";}
    gridrows = "250px"; //"220px"
    toastr.info(
      'The layout was adjusted to allow dragging across all columns.',
      'Wide layout enabled',
      { timeOut: 3500, positionClass: 'toast-top-right', preventDuplicates: true } );
  }
  else {
    $left.addClass('col-lg-3');
    $right.addClass('col-lg-9');
    setTimeout(() => { $('.bay').removeClass('bay-wide');}, 50);
  }

  $grid.css({
    'grid-template-columns': `repeat(${cols}, ${gridcols})`,
//    'grid-template-rows':    `repeat(${rows}, ${gridrows})`
    'grid-template-rows':    `repeat(${rows}, auto)`
  });

  return gridrows;
}

function buildCase(){
  const $case = $('#case');
  if (!currentCase){
    buildEmptyCaseHint(); return;
  }
  let layout;
  try { layout = computeActivePositions(currentCase); }
  catch(err){ toastr.error(String(err)); return; }

  const { rows, cols, active } = layout;
  const height = apply8colpatch(cols, rows);

  const actSet = new Set(active.map(p=>`${p.row}-${p.col}`));
  const sepSet = (currentCase?.layout?.sepSlots && Array.isArray(currentCase.layout.sepSlots))
    ? new Set(currentCase.layout.sepSlots.map(n => parseInt(n, 10)))
    : null;
  $case.removeClass('empty-hint').addClass('grid')
    //.css({'grid-template-columns': `repeat(${cols}, 1fr)`, //
    //'grid-template-rows': `repeat(${rows}, 70px)`})
    .empty();

  let bayIndex = 0;
  for (let r=1; r<=rows; r++){
    for (let c=1; c<=cols; c++){
      const isActive = actSet.has(`${r}-${c}`);
      const slotIndex = ((r-1)*cols)+c;
      let bayHtml = '';
      if (isActive){
        bayIndex++;
        bayHtml = `<div class="bay" data-bay="${bayIndex}" data-slot="${slotIndex}" style="height:${height}">
                      <span class="bay-label">Bay ${bayIndex}</span>
                      <span class="placeholder">Drop disk here</span>
                   </div>`;
      } else {
        const isSep = sepSet && sepSet.has(slotIndex);
        let extra = isSep ? ' slot-placeholder' : '';
        if (isSep){
          const modelPH = getModelPlaceholderMap(currentCase);
          const filePH  = getFilePlaceholderMap();
          const ph = modelPH.get(slotIndex) || filePH.get(slotIndex);
          if (ph){
            const val = getPlaceholderValue(slotIndex, modelPH, filePH);
            extra += ' has-input';
            bayHtml = `
              <div class="bay ${extra}" data-slot="${slotIndex}" style="height:100px;grid-column-end:span ${cols};">
                <div class="ph-wrapper">
                  <input
                    id="ph-${slotIndex}"
                    name="ph-${slotIndex}"
                    class="ph-input"
                    type="text"
                    placeholder="${(ph?.title || '').replaceAll('"','&quot;')}"
                    value="${String(val).replaceAll('"','&quot;')}"
                  >
                  <!-- opzionale: counter -->
                  <span class="ph-count" aria-hidden="true"></span>
                </div>
              </div>`;
          } else {
            // bayHtml = `<div class="bay disabled${extra}" data-slot="${slotIndex}"><span class="bay-label">—</span></div>`;
          }
        } else {
          bayHtml = `<div class="bay disabled${extra}" data-slot="${slotIndex}"><span class="bay-label">—</span></div>`;
        }
      }
      const $bay = $(bayHtml);
      $case.append($bay);
      if (isActive) initSortableForBay($bay[0]);
    }
  }
}

// --- Sortable ---
function initSortableForUnassigned(){
  const el = document.getElementById('unassigned');
  if (!el) return;
  if (el._sortable) return;
  el._sortable = new Sortable(el, {
    group: { name: 'disks', pull: true, put: true },
    animation: 150,
    sort: true,
    draggable: '.disk',
    forceFallback: true,
    fallbackOnBody: true,
    fallbackTolerance: 12,
    emptyInsertThreshold: 30,
    scroll: true,
    scrollSensitivity: 25,
    scrollSpeed: 15,
    onStart(evt){ $(evt.item).addClass('dragging'); document.body.classList.add('dragging'); },
    onEnd(evt){ $(evt.item).removeClass('dragging'); document.body.classList.remove('dragging'); $('.bay.highlight').removeClass('highlight'); }
  });
}

function initSortableForBay(bayEl){
  if (bayEl._sortable) return;
  bayEl._sortable = new Sortable(bayEl, {
    group: { name: 'disks', pull: true, put: true },
    animation: 150,
    sort: false,
    draggable: '.disk',
    forceFallback: true,
    fallbackOnBody: true,
    fallbackTolerance: 12,
    emptyInsertThreshold: 30,
    scroll: true,
    scrollSensitivity: 25,
    scrollSpeed: 15,
    onMove(evt){
      const to = evt.to; if (to && to.classList.contains('bay')) to.classList.add('highlight');
      return true;
    },
    onAdd(evt){
      const $bay = $(bayEl);
      const $incoming = $(evt.item);
      const $others = $bay.children('.disk').not($incoming);
      if ($others.length){
        const $swapTarget = $others.first();
        const $from = $(evt.from);
        const $fromDisks = $from.children('.disk');
        if ($fromDisks.length === 0 || evt.oldIndex >= $fromDisks.length){
          $from.append($swapTarget);
        } else if (evt.oldIndex === 0){
          $from.prepend($swapTarget);
        } else {
          $fromDisks.eq(evt.oldIndex).before($swapTarget);
        }
      }
      $bay.addClass('filled');
      $bay.find('.placeholder').remove();
      $.playSound('../assets/water-droplet-drip.mp3');
      rebuildUnassignedFromRegistry();
    },
    onRemove(){
      const $bay = $(bayEl);
      if ($bay.children('.disk').length === 0){
        $bay.removeClass('filled');
        if ($bay.find('.placeholder').length === 0){
          $bay.append('<span class="placeholder"></span>');
          $.playSound('../assets/pop_7e9Is8L.mp3');
        }
      }
      rebuildUnassignedFromRegistry();
    },
    onStart(evt){ $(evt.item).addClass('dragging'); document.body.classList.add('dragging'); },
    onEnd(evt){ $(evt.item).removeClass('dragging'); document.body.classList.remove('dragging'); $('.bay.highlight').removeClass('highlight'); }
  });}

// --- Placeholder helpers ---
function getModelPlaceholderMap(model){
  const list = model?.layout?.placeholderSlots;
  const m = new Map();
  if (Array.isArray(list)) list.forEach(p => {
    const id = parseInt(p.id, 10);
    if (id) m.set(id, { title: String(p.title || '') });
  });
  return m;
}
function getFilePlaceholderMap(){
  const list = RAW_CONFIG?.case?.layout?.placeholderSlots;
  const m = new Map();
  if (Array.isArray(list)) list.forEach(p => {
    const id = parseInt(p.id, 10);
    if (id) m.set(id, { title: String(p.title || '') });
  });
  return m;
}
function getPlaceholderValue(slotId, modelMap, fileMap){
  if (fileMap.has(slotId)) return fileMap.get(slotId).title || '';
  if (modelMap.has(slotId)) return modelMap.get(slotId).title || '';
  return '';
}

// === build case from file -> can be custom and id no need to match! ===
function buildModelFromFileCase(fileCase, fallbackBaysCount){
  const fc = fileCase || {};
  const L  = fc.layout || {};
  let cols = parseInt(L.cols, 10); if (!Number.isInteger(cols) || cols <= 0) cols = 4;
  let active = Array.isArray(L.activeSlots) && L.activeSlots.length ? [...L.activeSlots] : null;

  if (!active){
    const n = parseInt(fc.bays, 10) || parseInt(fallbackBaysCount, 10) || 0;
    active = Array.from({length: Math.max(0, n)}, (_,i)=> i+1);
  }

  const maxIdx = active.length ? Math.max(...active.map(x=>parseInt(x,10)||0)) : 0;
  let rows = parseInt(L.rows, 10);
  if (!Number.isInteger(rows) || rows <= 0){
    rows = maxIdx ? Math.ceil(maxIdx / cols) : 1;
  }

  return {
    //id: fc.id || 'custom-from-file',
    manufacturer: fc.manufacturer || 'Generic',
    name: fc.name || 'Case from file',
    bays: active.length,
    description: 'Loaded from config file',
    layout: {
      rotate: !!L.rotate,
      rows, cols,
      activeSlots: active,
      placeholderSlots: Array.isArray(L.placeholderSlots) ? L.placeholderSlots : [],
      sepSlots: Array.isArray(L.sepSlots) ? L.sepSlots : []
    }
  };
}

// ==== Custom Case Modal Builder ====

(function initCustomCaseModal(){
  const openBtn  = document.getElementById('open-custom-case-modal');
  const modal    = document.getElementById('mr-custom-case-modal');
  const closeBtn = document.getElementById('ccm-close');
  const cancel   = document.getElementById('ccm-cancel');
  const rowsSel  = document.getElementById('ccm-rows');
  const colsSel  = document.getElementById('ccm-cols');
  const renderBt = document.getElementById('ccm-render');
  const gridEl   = document.getElementById('ccm-grid');

  if (!openBtn || !modal) return;

  // Populate R/C options (12x8 MAX)
  fillNumericSelect(rowsSel, 1, 24, 6); // default 6 max 24
  fillNumericSelect(colsSel, 1, 24, 4);   // default 4 max 24

  //openBtn.addEventListener('click', () => openModal(modal));
  openBtn.addEventListener('click', () => {
    openModalCustomCaseBuilder(modal);

    const gridEl = document.getElementById('ccm-grid');
    const rowsSel = document.getElementById('ccm-rows');
    const colsSel = document.getElementById('ccm-cols');

    gridEl.innerHTML = '';

    //console.log(window.currentCase);
    loadCaseIntoBuilder(gridEl, rowsSel, colsSel, window.currentCase || null);
  });

  [closeBtn, cancel].forEach(b => b && b.addEventListener('click', () => closeModalCustomCaseBuilder(modal)));
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && modal.getAttribute('aria-hidden')==='false'){ closeModalCustomCaseBuilder(modal); } });

  renderBt.addEventListener('click', () => {
    const R = parseInt(rowsSel.value, 10) || 1;
    const C = parseInt(colsSel.value, 10) || 1;
    renderCustomGrid(gridEl, R, C);
  });

  renderBt.click();
})();

function openModalCustomCaseBuilder(modal){
  modal.setAttribute('aria-hidden','false');
  document.documentElement.style.overflow='hidden'; // prevent background scroll
}
function closeModalCustomCaseBuilder(modal){
  modal.setAttribute('aria-hidden','true');
  document.documentElement.style.overflow='';
}

function fillNumericSelect(sel, min, max, defVal){
  if (!sel) return;
  sel.innerHTML = '';
  for (let i=min;i<=max;i++){
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = String(i);
    if (i===defVal) opt.selected = true;
    sel.appendChild(opt);
  }
}

function snapshotBuilderState(container){
  const map = new Map();
  if (!container) return map;

  container.querySelectorAll('.ccm-slot-kind').forEach(sel => {
    const slot = parseInt(sel.dataset.slot, 10);
    if (!slot) return;
    const val = String(sel.value || 'empty');
    map.set(slot, val);
  });

  return map;
}

function renderCustomGrid(container, rows, cols){
  if (!container) return;
  const prevKinds = snapshotBuilderState(container);
  container.innerHTML = '';
  container.style.gridTemplateColumns = `repeat(${cols}, minmax(180px, 1fr))`;

  for (let r=0; r<rows; r++){
    for (let c=0; c<cols; c++){
      const idx = r*cols + c + 1; // numbering L->R, T->B

      const cell = document.createElement('div');
      cell.className = 'ccm-cell';

      const select = document.createElement('select');
      select.className = 'ccm-slot-kind';
      select.setAttribute('data-slot', String(idx));
      // options avail
      const options = [
        {v:'empty',       t:'empty'},
        {v:'active',      t:'active'},
        {v:'separator',   t:'separator'},
        {v:'placeholder', t:'placeholder'}
      ]
      options.forEach(o=>{
        const opt = document.createElement('option');
        opt.value = o.v;
        opt.textContent = o.t;
        select.appendChild(opt);
      });

      const prevVal = prevKinds.get(idx);
      if (prevVal && options.some(o => o.v === prevVal)) {
        select.value = prevVal;
      }

      cell.appendChild(select);
      container.appendChild(cell);
    }
  }
}

// === Helper: calc the custom case ===
function buildCustomCaseFromGrid(){
  const rowsSel = document.getElementById('ccm-rows');
  const colsSel = document.getElementById('ccm-cols');
  const gridEl  = document.getElementById('ccm-grid');

  const rows = Math.max(1, Math.min(24, parseInt(rowsSel?.value,10)||1));
  const cols = Math.max(1, Math.min(24,  parseInt(colsSel?.value,10)||1));

  const selects = gridEl ? gridEl.querySelectorAll('.ccm-slot-kind') : [];
  const activeSlots = [];
  const sepSlotsRaw = [];
  const placeholderSlots = [];
  const prevPH = collectCurrentPlaceholderValues();

  selects.forEach(sel => {
    const slot = parseInt(sel.dataset.slot, 10);
    const val  = String(sel.value||'empty');
    if (!slot) return;

    if (val === 'active') {
      activeSlots.push(slot);
    } else if (val === 'separator') {
      sepSlotsRaw.push(slot);
    } else if (val === 'placeholder') {
      const phtitle = prevPH.get(slot) || '';
      placeholderSlots.push({ id: slot, title: phtitle });
      sepSlotsRaw.push(slot);
    }
  });

  const sepSlots = [...new Set(sepSlotsRaw)].sort((a,b)=>a-b);

  const model = {
    id: 'custom-case',
    manufacturer: 'Generic',
    name: 'Custom case',
    bays: activeSlots.length,
    description: 'Custom case built from the grid',
    layout: {
      rows,
      cols,
      placeholderSlots,          // [{id, title}]
      sepSlots,
      activeSlots: activeSlots.sort((a,b)=>a-b)
    }
  };

  return model;
}

// === Apply: apply the case ===
function applyCustomCaseFromGrid(){
  const model = buildCustomCaseFromGrid();
  if (!model.layout.activeSlots.length){
    toastr.warning('Please mark at least one slot as "active" to build a case.');
    return;
  }
  selectCasePreserve(model);
  toastr.success('Custom case applied.');
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('#ccm-apply');
  if (!btn) return;
  e.preventDefault();
  applyCustomCaseFromGrid();
  const modal = document.getElementById('mr-custom-case-modal');
  if (modal) modal.setAttribute('aria-hidden','true');
  document.documentElement.style.overflow='';
});

// HELPER for retrieve actual case data and not start from scratch everytime //
function normalizeSlotIds(arr){
  if (!Array.isArray(arr)) return [];
  return arr.map(x => (typeof x === 'object' && x !== null ? x.id : x))
            .map(n => parseInt(n, 10))
            .filter(n => Number.isInteger(n) && n > 0);
}

function buildStateMapFromCaseModel(model){
  const map = new Map();
  if (!model || !model.layout) return map;

  const active = normalizeSlotIds(model.layout.activeSlots);
  const placeholders = normalizeSlotIds(model.layout.placeholderSlots);
  const separators = normalizeSlotIds(model.layout.sepSlots);

  placeholders.forEach(s => map.set(s, 'placeholder'));
  separators.forEach(s => { if (!map.has(s)) map.set(s, 'separator'); });
  active.forEach(s => { if (!map.has(s)) map.set(s, 'active'); });

  return map;
}

function loadCaseIntoBuilder(container, rowsSel, colsSel, model){
  const maxRows = 24, maxCols = 24;

  if (model && model.layout){
    const R = Math.max(1, Math.min(maxRows, parseInt(model.layout.rows,10) || 6));
    const C = Math.max(1, Math.min(maxCols, parseInt(model.layout.cols,10) || 4));
    rowsSel.value = R;
    colsSel.value = C;

    renderCustomGrid(container, R, C);

    const stateMap = buildStateMapFromCaseModel(model);
    container.querySelectorAll('.ccm-slot-kind').forEach(sel => {
      const slot = parseInt(sel.dataset.slot, 10);
      sel.value = stateMap.get(slot) || 'empty';
    });
  } else {
    rowsSel.value = 6;
    colsSel.value = 4;
    renderCustomGrid(container, 6, 4);
  }
}

function collectCurrentPlaceholderValues(){
  const map = new Map();
  if (!currentCase) return map;

  const modelPH = getModelPlaceholderMap(currentCase);
  const filePH  = getFilePlaceholderMap();
  const ids = new Set([...modelPH.keys(), ...filePH.keys()]);

  ids.forEach(slotId => {
    const input = document.getElementById(`ph-${slotId}`);
    const val = String(input?.value ?? getPlaceholderValue(slotId, modelPH, filePH) ?? '').trim();
    if (val) map.set(slotId, val);
  });
  return map;
}

// --- Case modal ---
const caseModal = new bootstrap.Modal(document.getElementById('mr-caseModal'));
const caseModalLB = new bootstrap.Modal(document.getElementById('mr-custom-case-modal'));


$(document).on('click', '#open-case-modal', function(){
  populateCaseModal(); caseModal.show();
});

$(document).on('click', '#case-models-list .list-group-item', function(){
  const id = this.getAttribute('data-id');
  const model = CASE_MODELS.find(m=>m.id===id);
  if (!model) return;
  selectCasePreserve(model);
  caseModal.hide();
  toastr.success('Case selected.');
});

// Double-click on a disk inside the case -> send back to Unassigned
$(document).on('dblclick', '#case .bay .disk', function () {
  const $disk = $(this);
  const $bay  = $disk.closest('.bay');
  $('#unassigned').append($disk);
  $.playSound('../assets/pop_7e9Is8L.mp3');
  if ($bay.children('.disk').length === 0) {
    $bay.removeClass('filled');
    if ($bay.find('.placeholder').length === 0) {
      $bay.append('<span class="placeholder"></span>');
    }
  }

  rebuildUnassignedFromRegistry();
});


function selectCase(model, opts = {}){
  const { resetRawPlaceholders = true, clearSlots = true } = opts;
  currentCase = model;
  setCaseLabel();

  // manual change case --> restart
  if (resetRawPlaceholders && RAW_CONFIG){
    if (RAW_CONFIG.case?.layout) {
      delete RAW_CONFIG.case.layout.placeholderSlots;
    }
    if (clearSlots && Array.isArray(RAW_CONFIG.bays)){
      RAW_CONFIG.bays.forEach(b => { delete b.slot; });
    }
  }

  clearPlacements();
  buildCase();
  rebuildUnassignedFromRegistry();
}

// --- Clear placements ---
function clearPlacements(){
  const $case = $('#case');
  $case.find('.bay').each(function(){
    const $b = $(this);
    $b.children('.disk').remove();
    $b.removeClass('filled');
    if ($b.is('[data-bay]') && $b.find('.placeholder').length===0){
      $b.append('<span class="placeholder"></span>');
    }
  });
}

// Read current placements
function snapshotPlacementsFromDOM(){
  const map = new Map();
  $('#case .bay[data-slot]').each(function(){
    const slot = parseInt(this.getAttribute('data-slot'), 10);
    if (!slot) return;
    const $d = $(this).children('.disk').first();
    if (!$d.length) return;
    const serial = String($d.attr('data-serial') || '').trim();
    if (!serial) return;
    map.set(serial, slot);
  });
  return map;
}
function applyPlacementsToRawConfig(placements, allowedSlots){
  if (!RAW_CONFIG || !Array.isArray(RAW_CONFIG.bays)) return;

  const allowed = allowedSlots
    ? new Set(allowedSlots.map(n => parseInt(n, 10)))
    : null;

  RAW_CONFIG.bays.forEach(b => {
    const serial = String(b.serial || '').trim();
    if (!serial) return;

    const slot = placements.get(serial);
    if (slot && (!allowed || allowed.has(slot))) {
      b.slot = String(slot);
    } else {
      delete b.slot;
    }
  });
}

// --- Case selection with preserved common slots ---
function selectCasePreserve(model, opts = {}){
  const { resetRawPlaceholders = true } = opts;

  if (!currentCase){
    return selectCase(model, { resetRawPlaceholders, clearSlots: false });
  }

  const currentPlacements = snapshotPlacementsFromDOM();

  const active = (model.layout && model.layout.activeSlots) || [];
  const activeSet = new Set(active.map(n => parseInt(n, 10)));

  applyPlacementsToRawConfig(currentPlacements, active);

  selectCase(model, { resetRawPlaceholders, clearSlots: false });

  if (RAW_CONFIG && Array.isArray(RAW_CONFIG.bays)){
    autoPlaceFromSlots(RAW_CONFIG.bays, model);
  }

  rebuildUnassignedFromRegistry();
}


// --- Load & Save ---
function rebuildRegistryFromRaw(baysList){
  disksRegistry.clear();
  baysList.forEach(d => {
    const serial = String(d.serial || '').trim();
    if (!serial) return;
    disksRegistry.set(serial, {...d});
  });
}

function autoPlaceFromSlots(baysList, caseModel){
  if (!caseModel) return;
  buildCase(); // ensure grid exists
  const active = (caseModel.layout && caseModel.layout.activeSlots) || [];
  const activeSet = new Set(active.map(n=>parseInt(n,10)));
  const $case = $('#case');
  baysList.forEach(d => {
    const serial = String(d.serial || '').trim();
    const slot = parseInt(d.slot, 10);
    if (!serial || !slot || !activeSet.has(slot)) return;
    const $target = $case.find(`.bay[data-slot="${slot}"]`);
    if ($target.length){
      const diskEl = makeDiskEl(disksRegistry.get(serial));
      diskEl.addClass('list-group-item list-group-item-action');
      $target.append(diskEl).addClass('filled');
      $target.find('.placeholder').remove();
    }
  });
  rebuildUnassignedFromRegistry();
}

function onLoadConfigFile(e){
  resetAllState();
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (!/\.json$/i.test(file.name)) { toastr.error('Please select a JSON file.'); return; }
  if (
    (window.location.host.endsWith('.github.io')) &&
    (file.name.toLowerCase() !== 'disklayout_config.json')
    ) {toastr.error('Only "disklayout_config.json" can be selected.');return; }

  resetAllState();
  const reader = new FileReader();
  reader.onload = () => {
    let obj;
    try { obj = JSON.parse(reader.result); }
    catch(err){ console.error(err); toastr.error('Invalid JSON.'); return; }

    if (!obj || !Array.isArray(obj.bays)) { toastr.error('Invalid structure: missing "bays" array.'); return; }

    RAW_CONFIG = obj;
    rebuildRegistryFromRaw(obj.bays);

    if (obj.case) {
      const custom = buildModelFromFileCase(obj.case, obj?.bays?.length || 0);

      if (Array.isArray(custom?.layout?.activeSlots) && custom.layout.activeSlots.length){
        selectCase(custom, { resetRawPlaceholders:false, clearSlots:false });
        autoPlaceFromSlots(obj.bays, custom);
        toastr.success('File succesfully loaded');
      } else {
        currentCase = null; setCaseLabel(); buildEmptyCaseHint();
        toastr.info('Case data in file is incomplete. Please choose a new case or start from scratch');
        $('#open-case-modal').prop('disabled', false).trigger('click');
      }
    } else {
      currentCase = null; setCaseLabel(); buildEmptyCaseHint();
      toastr.info('No case model in file. Choose a case or start from scratch');
      $('#open-case-modal').prop('disabled', false).trigger('click');
    }

    $('#save-config,#reset-layout,#open-case-modal,#open-custom-case-modal').prop('disabled', false);
    $('#load-hint').hide();
    $('#load-config').val('');

  };
  reader.readAsText(file);
}

function onSaveConfig(){
  if (!RAW_CONFIG){ toastr.error('Nothing to save. Load a config first.'); return; }
  if (!currentCase){ toastr.error('No case selected.'); return; }

  const out = JSON.parse(JSON.stringify(RAW_CONFIG));
  // Update case block
  out.case = {
    //id: currentCase.id,
    name: currentCase.name,
    bays: currentCase.bays,
    layout: JSON.parse(JSON.stringify(currentCase.layout))
  };

// --- take placeholder from DOM ---
(function(){
  const modelPH = getModelPlaceholderMap(currentCase);
  const filePH  = getFilePlaceholderMap();
  const ids = [...new Set([...modelPH.keys(), ...filePH.keys()])];

  const collected = ids.map(slotId => {
    const input = document.getElementById(`ph-${slotId}`);
    const value = String(input?.value ?? '').slice(0, 50); // hard cap xd
    return { id: slotId, title: value };
  });

  out.case.layout = out.case.layout || {};
  out.case.layout.placeholderSlots = collected;
})();


  // Map serial -> slot from current DOM
  const placedBySerial = new Map();
  $('#case .bay[data-bay]').each(function(){
    const slot = parseInt(this.getAttribute('data-slot'), 10);
    const $d = $(this).children('.disk');
    if ($d.length){
      const serial = String($d.attr('data-serial') || '').trim();
      if (serial) placedBySerial.set(serial, slot);
    }
  });

  if (Array.isArray(out.bays)){
    out.bays.forEach(b => {
      const serial = String(b.serial || '').trim();
      if (!serial) return;
      if (placedBySerial.has(serial)){
        b.slot = String(placedBySerial.get(serial)); // keep as string
      } else {
        delete b.slot;
      }
    });
  }

  const blob = new Blob([JSON.stringify(out, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'disklayout_config.json'; a.click();
  URL.revokeObjectURL(url);
  toastr.success('Config saved.');
}

function onResetLayout(){
  Swal.fire({
    icon: 'warning',
    title: 'Are you sure?',
    text: 'Confirm to reset current placements. Case and slots will be cleared.',
    showCancelButton: true,
    confirmButtonText: 'Reset'
  }).then(res => {
    if (!res.isConfirmed) return;
    clearPlacements();
    // remove slot in memory (preserve everything else)
    if (RAW_CONFIG && Array.isArray(RAW_CONFIG.bays)){
      RAW_CONFIG.bays.forEach(b => { delete b.slot; });
    }
    rebuildUnassignedFromRegistry();
    toastr.success('Layout reset.');
  });
}

// --- Init ---
$(function(){
  if (!loadCaseModels()) return;
  $('#load-config').on('change', onLoadConfigFile);
  $('#save-config').on('click', onSaveConfig).prop('disabled', true);
  $('#reset-layout').on('click', onResetLayout).prop('disabled', true);
  $('#open-case-modal').prop('disabled', true);
  $('#open-custom-case-modal').prop('disabled',true);
  initSortableForUnassigned();
  setCaseLabel();
});


// Search controls: click and form submit
$(document).on('click', '#case-search-go', function(){
  populateCaseModal();
});
$(document).on('submit', '#case-search-form', function(e){
  e.preventDefault();
  populateCaseModal();
});

// Optional: live filtering as user types (non-destructive alongside Search button)
$(document).on('input', '#case-search-text,#case-search-bays-min,#case-search-bays-max', function(){
  // No-op; we rely on the Search button per user request.
});


// --- Case modal (Bootstrap Table) ---
function buildCaseTableData(){
  return CASE_MODELS.map(m => ({
    id: m.id,
    manufacturer: String(m.manufacturer||''),
    name: String(m.name||''),
    bays: m.layout.activeSlots.length||0,
    description: String(m.description||''),
    _raw: m
  }));
}
function applyCaseTableFilters(data){
  const minBays = parseInt($('#case-search-bays-min').val(), 10);
  const maxBays = parseInt($('#case-search-bays-max').val(), 10);
  return data.filter(r => {
    const b = r.bays;
    return (isNaN(minBays) || b >= minBays) && (isNaN(maxBays) || b <= maxBays);
  });
}
function refreshCaseTable(){
  const data = applyCaseTableFilters(buildCaseTableData());
  const $table = $('#case-table');
  if ($table.data('bootstrap.table')){
    $table.bootstrapTable('load', data);
  } else {
    $table.bootstrapTable({
      data,
      onClickRow(row){
        const model = row?._raw; if (!model) return;
        selectCasePreserve(model); // <-- nuovo comportamento conservativo
        const modalEl = document.getElementById('mr-caseModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal?.hide();
        toastr.success('Case selected.');
      },
      columns: [{
        field: 'manufacturer', title: 'Manuf.', sortable: true
      },{
        field: 'name', title: 'Case', sortable: true
      },{
        field: 'bays', title: 'Bays', sortable: true, align: 'right', halign: 'right'
      },{
        field: 'description', title: 'Description'
      }]
    });
  }
}
function populateCaseModal(){
  refreshCaseTable();
}


// MRCE-style version badge (optional)
(function(){var el=document.getElementById('mr-v'); if(el){el.textContent='v1.3';}})();


document.addEventListener('DOMContentLoaded', () => {
  // Animate-in header & main
  const header = document.querySelector('header.container');
  const main = document.querySelector('main.container, main.container-fluid');

  if (header) header.classList.add('hidden');
  if (main) main.classList.add('hidden');

  requestAnimationFrame(() => {
    if (header) {
      header.classList.add('animate-in');
      header.classList.remove('hidden');
    }

    setTimeout(() => {
      if (main) {
        main.classList.add('animate-in');
        main.classList.remove('hidden');
      }
    }, 150);
  });

  // highlight on the load button
  $('#label-load-config').addClass('mr-highlight').delay(900).queue(function(next){ $(this).removeClass('mr-highlight'); next(); });

});

$(document).on('input', '#current-case-label', function () {
  if (!currentCase) return;

  const newName = $(this).val().trim().slice(0, 50);
  currentCase.name = newName;
});

$(document).on('click', '#btn-start-from-scratch', function () {
    const cm = bootstrap.Modal.getInstance(document.getElementById('mr-caseModal'));
    cm?.hide();
    setTimeout(() => { $('#open-custom-case-modal')[0].click(); }, 500);
});

$(document).on('change', '#rotate-layout-switch', function () {
  if (!currentCase || !currentCase.layout) return;
  const checked = $(this).is(':checked');
  currentCase.layout.rotate = checked;
  const cols = getColsFromModel(currentCase);
  let rows = currentCase.layout.rows;
  if (!rows) {
    try {
      rows = computeActivePositions(currentCase).rows;
    } catch (e) {
      rows = 1;
    }
  }
  apply8colpatch(cols, rows);
});

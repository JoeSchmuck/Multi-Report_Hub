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
const disksRegistry = new Map(); // serial -> full record

// --- Utilities ---
function loadCaseModels(){
  if (Array.isArray(window.CASE_MODELS) && window.CASE_MODELS.length){
    CASE_MODELS = window.CASE_MODELS;
    return true;
  }
  toastr.error('case_models.js missing or empty.');
  $('#open-case-modal,#reset-layout,#save-config').prop('disabled', true);
  return false;
}

function setCaseLabel(){
  const $label = $('#current-case-label');
  if (!currentCase) { $label.text('No case'); return; }
  $label.text(currentCase.name || currentCase.id);
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
  const colorClass = `clr-${color}`; // clr-green / clr-yellow / clr-red / clr-orange / clr-blank
  const pill = $(`<div class=\"disk ${colorClass}\" data-serial=\"${rec.serial}\"><span class=\"fw-semibold\">${rec.serial|| rec.drive_id} <i class="small hide-filled">-  ${rec.address}</i></span><span class=\"meta\">${rec.capacity || ''}</span></div>`);
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
  $('#save-config,#reset-layout,#open-case-modal').prop('disabled', true);
}


// --- Case building (matrix 4 x rows) ---
function idxToRowCol(idx){ const n=parseInt(idx,10); return {row: Math.ceil(n/4), col: ((n-1)%4)+1}; }

function computeActivePositions(model){
  const L = model?.layout || {};
  if (!Array.isArray(L.activeSlots) || !L.activeSlots.length) throw new Error('layout.activeSlots is required');
  const positions = L.activeSlots.map(idxToRowCol);
  const rows = L.rows || Math.max(...positions.map(p=>p.row));
  return { rows, active: positions };
}

function buildCase(){
  const $case = $('#case');
  if (!currentCase){
    buildEmptyCaseHint(); return;
  }
  let layout;
  try { layout = computeActivePositions(currentCase); }
  catch(err){ toastr.error(String(err)); return; }

  const { rows, active } = layout;
  const actSet = new Set(active.map(p=>`${p.row}-${p.col}`));
  $case.removeClass('empty-hint').addClass('grid')
       .css({'grid-template-columns': 'repeat(4, 1fr)', 'grid-template-rows': `repeat(${rows}, 70px)`})
       .empty();

  let bayIndex = 0;
  for (let r=1; r<=rows; r++){
    for (let c=1; c<=4; c++){
      const isActive = actSet.has(`${r}-${c}`);
      const slotIndex = ((r-1)*4)+c;
      let bayHtml = '';
      if (isActive){
        bayIndex++;
        bayHtml = `<div class="bay" data-bay="${bayIndex}" data-slot="${slotIndex}">
                      <span class="bay-label">Bay ${bayIndex}</span>
                      <span class="placeholder">Drop disk here</span>
                   </div>`;
      } else {
        bayHtml = `<div class="bay disabled" data-slot="${slotIndex}"><span class="bay-label">—</span></div>`;
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



// --- Case modal ---
const caseModal = new bootstrap.Modal(document.getElementById('caseModal'));


$(document).on('click', '#open-case-modal', function(){
  populateCaseModal(); caseModal.show();
});

$(document).on('click', '#case-models-list .list-group-item', function(){
  const id = this.getAttribute('data-id');
  const model = CASE_MODELS.find(m=>m.id===id);
  if (!model) return;
  selectCase(model);
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


function selectCase(model){
  currentCase = model;
  setCaseLabel();
  // reset placements when switching case
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
  if (file.name.toLowerCase() !== 'disklayout_config.json') {toastr.error('Only "disklayout_config.json" can be selected.');return; }

  resetAllState();
  const reader = new FileReader();
  reader.onload = () => {
    let obj;
    try { obj = JSON.parse(reader.result); }
    catch(err){ console.error(err); toastr.error('Invalid JSON.'); return; }

    if (!obj || !Array.isArray(obj.bays)) { toastr.error('Invalid structure: missing "bays" array.'); return; }

    RAW_CONFIG = obj;
    rebuildRegistryFromRaw(obj.bays);

    if (obj.case && obj.case.id){
      const cm = CASE_MODELS.find(x=>x.id===obj.case.id);
      if (cm){
        selectCase(cm);
        autoPlaceFromSlots(obj.bays, cm);
      } else {
        currentCase = null; setCaseLabel(); buildEmptyCaseHint();
        toastr.warning('Case id not found in models. Please choose a case.');
      }
    } else {
      currentCase = null; setCaseLabel(); buildEmptyCaseHint();
      toastr.info('No case in file. Choose a case and place disks.');
      $('#open-case-modal').prop('disabled', false).trigger('click'); //.addClass('mr-highlight').delay(900).queue(function(next){ $(this).removeClass('mr-highlight'); next(); });
    }

    $('#save-config,#reset-layout,#open-case-modal').prop('disabled', false);
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
    id: currentCase.id,
    name: currentCase.name,
    bays: currentCase.bays,
    layout: JSON.parse(JSON.stringify(currentCase.layout))
  };

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


function buildCaseTableData(){
  // Build raw data array from CASE_MODELS, with id and case-data-bay
  return CASE_MODELS.map(m => ({
    id: m.id,
    name: m.name,
    bays: parseInt(m.bays,10)||0,
    description: String(m.description||''),
    _raw: m
  }));
}

function applyCaseTableFilters(data){
  // external numeric filters
  const minBays = parseInt($('#case-search-bays-min').val(), 10);
  const maxBays = parseInt($('#case-search-bays-max').val(), 10);
  return data.filter(row => {
    const b = row.bays;
    const okMin = !minBays || b >= minBays;
    const okMax = !maxBays || b <= maxBays;
    return okMin && okMax;
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
      onClickRow(row, $el){
        const model = row?._raw; if (!model) return;
        selectCase(model);
        const modalEl = document.getElementById('caseModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal?.hide();
        toastr.success('Case selected.');
      },
      // Formatters to align numbers right
      columns: [{
        field: 'name', title: 'Case', sortable: true
      },{
        field: 'bays', title: 'Bays', sortable: true, align: 'right', halign: 'right'
      },{
        field: 'description', title: 'Description'
      }]
    });
  }
}



// --- Case modal (Bootstrap Table) ---
function buildCaseTableData(){
  return CASE_MODELS.map(m => ({
    id: m.id,
    name: String(m.name||''),
    bays: parseInt(m.bays,10)||0,
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
        selectCase(model);
        const modalEl = document.getElementById('caseModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal?.hide();
        toastr.success('Case selected.');
      },
      columns: [{
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
(function(){var el=document.getElementById('mr-v'); if(el){el.textContent='v1.0';}})();


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

/* mrce.app.js */
(function (window, $) {
    "use strict";

    // MR latest version
    const MRV = "3.22";
    const startdtd = "2025-08-25";    

    //  Namespace 
    const MRCE = (window.MRCE = window.MRCE || {});
    const CONFIG = MRCE.CONFIG || {};
    const TOOLTIPS = MRCE.TOOLTIPS || {};
    const shortRelated = MRCE.shortRelated || {};
    const longRelated = MRCE.longRelated || {};

    //  Selectors / IDs 
    const SEL = {
        tabs: "#mrceTabs",
        tabTriggers: '#mrceTabs [data-bs-toggle="tab"]',
        toolbar: "#mr-toolbar",
        btnLoad: "#mr-btn-load",
        btnSave: "#mr-btn-save",
        btnRestart: "#mr-btn-restart"
    };


    let idCounter = 0;
    const nextId = () => `test${++idCounter}`;

    //  general helpers 
    function tooltipInit(ctx) {
        (ctx ? $(ctx).find('[data-bs-toggle="tooltip"]') : $('[data-bs-toggle="tooltip"]'))
            .each(function () {
                if (!bootstrap.Tooltip.getInstance(this)) new bootstrap.Tooltip(this);
            });
    }
    function isNumericStrict(v) {
        if (v === "" || v === null || v === undefined) return false;
        return !isNaN(v) && !isNaN(parseFloat(v));
    }
    function findOptionInConfigData(key) {
        for (const groupName in CONFIG) {
            const group = CONFIG[groupName];
            for (const sectionName in group) {
                if (sectionName === "__target") continue;
                const section = group[sectionName];
                if (section?.options && key in section.options) return section.options[key];
            }
        }
        return null;
    }
    function normalizeHex(val) {
        let hex = String(val || "").trim();
        if (hex && !/^#/.test(hex) && /^[0-9a-f]{3,8}$/i.test(hex)) hex = "#" + hex.toLowerCase();
        else {
            const ctx = document.createElement("canvas").getContext("2d");
            ctx.fillStyle = hex;
            const resolved = ctx.fillStyle;
            if (/^#[0-9a-f]{6}$/i.test(resolved))  hex = resolved.toLowerCase(); 
        }
        //console.log(hex);
        return hex;
    }

    //  Render GUI
    function getFieldTip(sectionLabel, fieldKey) {
        return (TOOLTIPS[sectionLabel] && TOOLTIPS[sectionLabel][fieldKey]) || "";
    }

    function renderFieldControl(fieldKey, opt, id) {
        const type = (opt.type || "").toLowerCase();
        const def = opt.default ?? "";
        const reqAttr = opt.required ? ' required aria-required="true" data-required="true"' : "";

        if (type === "checkbox") {
            const checkedAttr = ["enable", "true", "yes", "1"].includes(String(def).toLowerCase()) ? " checked" : "";
            return `
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="${id}" data-key="${fieldKey}"${checkedAttr}${reqAttr}>
          <label class="form-check-label" for="${id}"></label>
        </div>`;
        } else if (type === "colorpicker") {
            const val = normalizeHex(def) || "#ffffff";
            return `
                    <input type="text" class="form-control mr-color notranslate" id="${id}" data-key="${fieldKey}" value="${val}" ${reqAttr}>
            `;            
        } else if (type === "select") {
            const items = Array.isArray(opt.options)
                ? opt.options
                : Array.isArray(opt.choices)
                    ? opt.choices
                    : [];
            const optionsHtml = items
                .map((item) => {
                    if (typeof item === "object" && item !== null) {
                        const value = String(item.value ?? "");
                        const label = String(item.label ?? value);
                        const selected = String(value) === String(def) ? " selected" : "";
                        return `<option value="${value}"${selected}>${label}</option>`;
                    } else {
                        const value = String(item);
                        const selected = value === String(def) ? " selected" : "";
                        return `<option value="${value}"${selected}>${value}</option>`;
                    }
                })
                .join("");
            return `
        <select class="form-select notranslate" id="${id}" data-key="${fieldKey}"${reqAttr}>
          ${optionsHtml}
        </select>`;
        } else if (type === "number") {
            const min = (opt.min ?? "") !== "" ? ` min="${opt.min}"` : "";
            const max = (opt.max ?? "") !== "" ? ` max="${opt.max}"` : "";
            const step = (opt.step ?? "") !== "" ? ` step="${opt.step}"` : "";
            return `
        <input type="number" class="form-control notranslate" id="${id}" data-key="${fieldKey}" value="${def}"${min}${max}${step}${reqAttr}>`;
        } else if (type === "email" || fieldKey.toLowerCase().includes("email")) {
            return `
        <input type="email" class="form-control notranslate" id="${id}" data-key="${fieldKey}" value="${def}"${reqAttr} placeholder="______@___" >`;
        } else if (type === "dayscheckbox") {
            const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const selected = (opt.default || "").split(",").map((v) => v.trim());
            const groupReq = opt.required ? ` data-required-group="${fieldKey}"` : "";
            const boxes = days
                .map((day, idx) => {
                    const dayNum = (idx + 1).toString();
                    const checked = selected.includes(dayNum) ? " checked" : "";
                    return `
            <label class="form-check form-check-inline me-2">
              <input class="form-check-input notranslate" type="checkbox"
                id="${id}-${dayNum}" name="${fieldKey}" data-key="${fieldKey}"
                value="${dayNum}"${checked}>
              <span class="form-check-label">${day}</span>
            </label>`;
                })
                .join("");
            return `<div class="d-flex flex-wrap"${groupReq}>${boxes}</div>`;
        } else if (type === "statictext") {
                return;
        } else if (type === "customlist") {
            return `
            <div class="input-group">
                <input type="text" class="form-control notranslate mr-customlist" 
                    id="${id}" data-key="${fieldKey}" value="${def}"${reqAttr}
                    placeholder="${opt.placeholder}">
                <button class="btn btn-outline-secondary mr-customlist-edit" type="button" 
                        data-target="${id}" title="Edit List">
                <i class="fa-solid fa-bars"></i>
                </button>
            </div>`; 
        } else if (type === "listwithoffset") {
        return `
            <div class="input-group">
            <input type="text" class="form-control notranslate mr-listwithoffset"
                    id="${id}" data-key="${fieldKey}" value="${def}"${reqAttr}
                    data-offsettype="${(opt.offsettype || 'text')}"
                    placeholder="${opt.placeholder}">
            <button class="btn btn-outline-secondary mr-listwithoffset-edit" type="button"
                    data-target="${id}" title="Edit" data-offsettype="${(opt.offsettype || 'text')}">
                <i class="fa-solid fa-list"></i>
            </button>
            </div>`;  
        } else if (type === "customdriveslist") {            
        return `
            <div class="input-group">
            <input type="text" class="form-control notranslate mr-complexlist"
                    id="${id}" data-key="${fieldKey}" value="${def}"
                    data-configkey="${opt.configKey || ''}"
                    placeholder="${opt.placeholder || ''}" ${reqAttr}>
            <button class="btn btn-outline-secondary mr-complexlist-edit" type="button"
                    data-target="${id}" title="Edit">
                <i class="fa-solid fa-table-list"></i>
            </button>
            </div>`;
        } else if (type === "text") {
            return `
        <input type="text" class="form-control notranslate" id="${id}" data-key="${fieldKey}" value="${def}"${reqAttr} placeholder="${opt.placeholder || ''}">`;           
        } else { // debug line to find missconfiguration 
            console.warning(fieldKey + ' | ' + type + ' missing');
            return `
        <input type="text" class="form-control notranslate" id="${id}" data-key="${fieldKey}" value="${def}"${reqAttr} placeholder="${opt.placeholder || ''}">`;
        }
    }

    function renderSection($container, sectionObj, isFirst) {
        const titleRow = `
      <div class="row align-items-center ${isFirst ? "" : "mt-3 pt-3"}">
        <div class="col-12 d-flex align-items-center">
          <strong class="me-2">${sectionObj.label}</strong>
        </div>
      </div>`;
        $container.append(titleRow);

        for (const [fieldKey, opt] of Object.entries(sectionObj.options)) {
            const id = nextId();
            const tip = getFieldTip(sectionObj.label, fieldKey);
            const isCheckbox = (opt.type || "").toLowerCase() === "checkbox";
            const fieldtype = (opt.type || "").toLowerCase();

            // new statictext fields need to be rendered differently
            if (fieldtype === "statictext") {
                const statictextrow = `
                <div class="row align-items-center border-bottom p-2">
                    <div class="col-12 col-md-12">
                    <span >
                        ${opt.label}
                        ${tip ? `<i class="fa-solid fa-circle-info ms-2" data-bs-toggle="tooltip" title="${tip}"></i>` : ""}
                    </span>
                    </div>
                </div>`
                $container.append(statictextrow);
            } else {           
                    const leftCol = isCheckbox
                        ? `
                <div class="col-12 col-md-6">
                <span class="d-inline-flex align-items-center">
                    ${opt.label}
                    ${tip ? `<i class="fa-solid fa-circle-info ms-2" data-bs-toggle="tooltip" title="${tip}"></i>` : ""}
                </span>
                </div>`
                        : `
                <div class="col-12 col-md-6">
                <label for="${id}" class="col-form-label d-inline-flex align-items-center">
                    ${opt.label}
                    ${tip ? `<i class="fa-solid fa-circle-info ms-2" data-bs-toggle="tooltip" title="${tip}"></i>` : ""}
                </label>
                </div>`;
                

                    const rightColControl = renderFieldControl(fieldKey, opt, id);

                    const row = `
                <div class="row align-items-center border-bottom p-2">
                ${leftCol}
                <div class="col-12 col-md-6">
                    ${rightColControl}
                </div>
                </div>`;
                    $container.append(row);
            }
        }
    }

    function renderConfig() {
        for (const [groupName, groupObj] of Object.entries(CONFIG)) {
            const target = groupObj.__target;
            if (!target) continue;
            const $container = $(target);
            if ($container.length === 0) continue;

            let isFirst = true;
            for (const [sectionKey, sectionObj] of Object.entries(groupObj)) {
                if (sectionKey === "__target") continue;
                renderSection($container, sectionObj, isFirst);
                isFirst = false;
            }
            tooltipInit($container);
        }

        initColorPickers();
        //if (!initColorPickers()) {
        //    $(window).one("load", initColorPickers);
        //}
    }

    //  Theme helper for spectrum
    function pickTheme() {
        const forced = document.documentElement.getAttribute("data-bs-theme");
        if (forced) return forced === "dark" ? "dark" : "light";
        return window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }

    function initColorPickers() {
        if (typeof $.fn.spectrum !== "function") return false;

        const theme = pickTheme() === "dark" ? "sp-dark" : "sp-light";
        $(".mr-color").each(function () {
            const $input = $(this);
            if ($input.data("hasSpectrum")) return;
            $input.spectrum({
                type: "component",
                showInput: true,
                showInitial: true,
                preferredFormat: "hex",
                theme,
                clickoutFiresChange: true,
                change: c => $input.val(c ? c.toHexString() : ""),
                move: c => $input.val(c ? c.toHexString() : "")
            });
         
            $input.data("hasSpectrum", true);
        });

        return true;
    }

    //  tab-accordion preservation 
    function rememberTabsAndAccordions() {
        const key = "mrce.activeTab";
        const last = localStorage.getItem(key);
        if (last) {
            const triggerEl = document.querySelector(`[data-bs-target="${last}"]`);
            if (triggerEl) new bootstrap.Tab(triggerEl).show();
        }
        document.querySelectorAll(SEL.tabTriggers).forEach((btn) => {
            btn.addEventListener("shown.bs.tab", (e) => {
                localStorage.setItem(key, e.target.getAttribute("data-bs-target"));
            });
        });

        // accordion
        document.querySelectorAll(".accordion").forEach((acc) => {
            const accId = acc.id || "(no-id)";
            const accKey = `mrce.acc.${accId}`;
            const savedSelector = localStorage.getItem(accKey);
            if (savedSelector) {
                const savedEl = document.querySelector(savedSelector);
                if (savedEl && !savedEl.classList.contains("show")) {
                    new bootstrap.Collapse(savedEl, { toggle: true });
                }
            }
            acc.querySelectorAll(".accordion-collapse").forEach((panel) => {
                panel.addEventListener("shown.bs.collapse", (evt) => {
                    localStorage.setItem(accKey, `#${evt.target.id}`);
                });
            });
        });
    }

    //  Collect / Validate / Set-Get 
    function collectData() {
        const data = {};
        for (const groupName in CONFIG) {
            const group = CONFIG[groupName];
            for (const sectionName in group) {
                if (sectionName === "__target") continue;
                const section = group[sectionName];
                const opts = section?.options || {};
                for (const key in opts) {
                    const opt = opts[key] || {};
                    const t = (opt.type || "").toLowerCase();
                    if (t === "statictext") continue;
                    if (t === "dayscheckbox") {
                        const vals = [];
                        document
                            .querySelectorAll(`input[type="checkbox"][name="${key}"]`)
                            .forEach((cb) => {
                                if (cb.checked) vals.push(cb.value);
                            });
                        data[key] = vals.join(",");
                    } else {
                        const el = document.querySelector(`[data-key="${key}"]`);
                        if (!el) continue;
                        else if (el.type === "checkbox") data[key] = !!el.checked;
                        else data[key] = el.value ?? "";
                    }
                }
            }
        }
        return data;
    }

    function validateRequired(data) {
        for (const groupName in CONFIG) {
            const group = CONFIG[groupName];
            for (const sectionName in group) {
                if (sectionName === "__target") continue;
                const section = group[sectionName];
                const opts = section?.options || {};
                for (const key in opts) {
                    const opt = opts[key] || {};
                    if (!opt.required) continue;
                    const type = (opt.type || "").toLowerCase();
                    const label = opt.label || key;

                    if (type === "dayscheckbox") {
                        const anyChecked = !!document.querySelector(
                            `input[type="checkbox"][name="${key}"]:checked`
                        );
                        if (!anyChecked)
                            return {
                                ok: false,
                                message: `Missing required ${label} field`,
                                focusSelector: `input[name="${key}"]`,
                                key
                            };
                    } else {
                        const el = document.querySelector(`[data-key="${key}"]`);
                        if (!el) continue;
                        if (el.type === "checkbox") {
                            if (!el.checked)
                                return {
                                    ok: false,
                                    message: `Missing required ${label} field`,
                                    focusSelector: `#${el.id}`,
                                    key
                                };
                        } else {
                            const val = (data[key] ?? "").toString().trim();
                            if (val === "")
                                return {
                                    ok: false,
                                    message: `Missing required ${label} field`,
                                    focusSelector: `#${el.id}`,
                                    key
                                };
                        }
                    }
                }
            }
        }
        return { ok: true };
    }

    // trying fix html entities from config and config.js
    function decodeEntities(s){
    const t=document.createElement('textarea');
    t.innerHTML = s;
    return t.value;
    }    

    function setFieldValueByKey(key, val) {
        // dayscheckbox
        const $days = $(`input[type="checkbox"][name="${key}"]`);
        if ($days.length) {
            $days.prop("checked", false);
            const selected = String(val || "")
                .split(",")
                .map((v) => v.trim());
            selected.forEach((dayNum) => {
                $(`input[type="checkbox"][name="${key}"][value="${dayNum}"]`).prop(
                    "checked",
                    true
                );
            });
            return;
        }

        const $el = $(`[data-key="${key}"]`).first();
        if (!$el.length) return;

        const type = ($el.attr("type") || $el.prop("tagName")).toLowerCase();
        if (type === "checkbox") {
            $el.prop("checked", ["true", "enable", "yes", "1"].includes(String(val).toLowerCase()));
        } else if ($el.is("select") || $el.is("textarea")) {
            //$el.val(val);
            const raw = String(val ?? "");
            const decoded = decodeEntities(raw);
            $el.val(raw);
            if ($el.val() !== raw) $el.val(decoded);
        } else if ($el.hasClass("mr-color") && typeof $el.spectrum === "function") {
            const hex = normalizeHex(val);
            $el.spectrum("set", hex || null);
            $el.val(hex);
        } else {
            if (type !== "file") $el.val(val);
        }
    }

    //  LOAD main function
    function loadData() {
        
        const enddtd = new Date().toISOString().slice(0, 10);//const enddtd = "2025-09-28";

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".txt";

        fileInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (!file) return;
            if (!file.name.toLowerCase().endsWith(".txt")) {
                toastr.error("Only .txt files are accepted. Try again");
                return;
            }            

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = e.target.result;
                    const lines = content.split("\n");
                    const loadedData = {};
                    const lineStore = [];

                    let dtdMatch = null;
                    for (const line of lines) {
                        const match = line.match(/dtd:(\d{4}-\d{2}-\d{2})/);
                        if (match) {
                            dtdMatch = match[1];
                            break;
                        }
                    }

                    if (dtdMatch) {
                        const fileDate = new Date(dtdMatch);
                        const startDate = new Date(startdtd);
                        //const endDate = new Date(enddtd);
                        if (fileDate < startDate) { // || fileDate > endDate
                            const result = await Swal.fire({
                                title: "Wrong configuration version",
                                html: `
                                    The file you uploaded appears to come from an older version of Multi-Report. The resulting configuration may not be compatible with your current version.<br>
                                    Please locate the correct version on GitHub:<br>
                                    <a href="https://github.com/JoeSchmuck/Multi-Report" target="_blank">
                                    https://github.com/JoeSchmuck/Multi-Report
                                    </a><br><br>
                                    Would you like to continue loading it and proceed??
                                `,
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonText: "Yes, continue",
                                cancelButtonText: "Cancel"
                            });

                            if (!result.isConfirmed) {
                                toastr.info("Configuration load cancelled.");
                                return;
                            }
                        }
                    }
                    else {
                        toastr.error("Configuration load cancelled. File is not a valid MR config");
                        return;
                    }

                    lines.forEach((line, index) => {
                        const trimmed = line.trim();
                        if (trimmed.startsWith("#") || trimmed === "") {
                            lineStore.push({ type: "comment", content: line, order: index });
                            return;
                        }
                        const eq = trimmed.indexOf("=");
                        if (eq !== -1) {
                            const rawKey = trimmed.substring(0, eq).trim();
                            const rhs = trimmed.substring(eq + 1).trim();
                            let value;
                            const mQuoted = rhs.match(/^(['"])(.*?)\1/);
                            if (mQuoted) value = mQuoted[2].trim();
                            else {
                                const mHex = rhs.match(/#([0-9a-fA-F]{3,8})\b/);
                                if (mHex) value = "#" + mHex[1];
                                else {
                                    const commentIndex = rhs.indexOf("#");
                                    value =
                                        commentIndex !== -1
                                            ? rhs.substring(0, commentIndex).trim()
                                            : rhs;
                                }
                            }
                            let unparsedvalue = value
                            if (rawKey.toLowerCase().includes("color")) value = normalizeHex(value);
                                                       
                            loadedData[rawKey] = value;
                            // let's try to preserve comment 
                            const keyValString = `${rawKey}=${unparsedvalue}`;
                            const keyValString2 = `${rawKey}="${unparsedvalue}"`;
                            let tailcomment = "";
                            if (unparsedvalue) tailcomment = line.replace(keyValString, "").replace(keyValString2, "").trimEnd() || "";        
                            else tailcomment = line.replace(keyValString2, "").trimEnd() || "";                   
                            console.log(tailcomment);
                            lineStore.push({
                                type: "kvp",
                                key: rawKey,
                                order: index,
                                originalLine: line,
                                originalValue: value,
                                originalcomment: tailcomment,                               
                            });
                        }
                    });

                    window.lineStore = lineStore;

                    Object.entries(loadedData).forEach(([key, val]) => {
                        setFieldValueByKey(key, val);
                    });

                    toastr.success("Configuration loaded successfully!");
                } catch (err) {
                    console.error("Error parsing file:", err);
                    toastr.error("Failed to parse the configuration file.");
                }
            };

            reader.onerror = () => {
                toastr.error("Failed to read the file.");
            };

            reader.readAsText(file);
        });

        fileInput.click();
    }


    // hightlight missing fields
    function revealAndHighlight(selector) {
        const el = document.querySelector(selector);
        if (!el) return;

        const tabPane = el.closest('.tab-pane[id]');
        if (tabPane) {
            const tabTrigger = document.querySelector(`[data-bs-target="#${tabPane.id}"], a[href="#${tabPane.id}"]`);
            if (tabTrigger) {
                if (window.bootstrap?.Tab) {
                    new bootstrap.Tab(tabTrigger).show();
                } else {
                    tabTrigger.click();
                }
            }
        }

        el.closestAll = function(sel){
            const arr=[]; let n=this;
            while (n) { if (n.matches?.(sel)) arr.push(n); n=n.parentElement; }
            return arr;
        };
        el.closestAll('.accordion-collapse').forEach(acc => {
            if (!acc.classList.contains('show')) {
                if (window.bootstrap?.Collapse) {
                    new bootstrap.Collapse(acc, { toggle: true });
                } else {
                    acc.classList.add('show');
                }
            }
        });

        setTimeout(() => {
            el.focus?.({ preventScroll: true });
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);

        el.classList.add('mr-required-missing');
        setTimeout(() => el.classList.remove('mr-required-missing'), 2000);
    }


    //  SAVE main function now async to use sweet alert
    async function saveData() {
        try {
            const data = collectData();

            // check required fields
            const check = validateRequired(data);
            if (!check.ok) {
                const defOpt = findOptionInConfigData(check.key);
                const defVal = defOpt?.default;

                if (!defVal) {
                    toastr.error(check.message);
                    if (check.focusSelector) revealAndHighlight(check.focusSelector); //document.querySelector(check.focusSelector)?.focus();
                    return;                    
                }
                
                const btn = defVal !== undefined 
                    ? `<br><button type="button" class="btn btn-sm btn-success mt-2 apply-default text-white" data-key="${check.key}">
                        Apply default
                    </button>` 
                    : "";

                toastr.error(check.message + btn, "", { timeOut: 7500, extendedTimeOut: 2000 });
                if (check.focusSelector) revealAndHighlight(check.focusSelector);
                $(document).off("click", ".apply-default").on("click", ".apply-default", function() {
                    const key = $(this).data("key");
                    const opt = findOptionInConfigData(key);
                    if (!opt) return;

                    const el = document.querySelector(`[data-key="${key}"]`);
                    if (!el) return;

                    const defVal = opt.default ?? "";

                    if (el.type === "checkbox") {
                    //el.checked = String(defVal).toLowerCase() === "true" 
                    //            || String(defVal).toLowerCase() === "yes" 
                    //            || String(defVal).toLowerCase() === "enable"
                    //            || String(defVal).toLowerCase() === "false" 
                    //            || String(defVal).toLowerCase() === "no" 
                    //            || String(defVal).toLowerCase() === "disable";     
                        el.checked = ["true", "yes", "enable", "1"].includes(String(defVal).toLowerCase());                           
                    } else if (opt.type === "colorpicker") {
                        el.value = defVal;
                        $(el).spectrum("set", defVal);
                    } else {
                        el.value = defVal;
                    }

                    toastr.success(`Applied default value!`);
                    //document.getElementById('mr-btn-save')?.focus();
                });

                return;                
            }

            // validotor for emails fields
            const $emailEls = $('input[type="email"][data-key]');
            for (const el of $emailEls) {
                const $el = $(el);
                const emailVal = String(($el.val() ?? "")).trim();
                const key = $el.data("key");
                //const emailOpt = findOptionInConfigData(key);
                
                if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
                    const result = await Swal.fire({
                        title: "Invalid email format",
                        html: `The email address entered in <b>${key}</b> (<code>${emailVal}</code>) doesn't look correct.<br><br>Do you want to proceed anyway?`,
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Yes, continue",
                        cancelButtonText: "Cancel"
                    });

                    if (!result.isConfirmed) {
                    toastr.info("Operation cancelled.");
                    return;
                    }   
                }
            }

            // init lineStore
            if (!window.lineStore) {                
                window.lineStore = [];
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, "0");
                const dd = String(today.getDate()).padStart(2, "0");
                window.lineStore.push({
                    type: "comment",
                    content: `# Multi-Report v3.22 dtd:2025-10-13 --- Generated Date: ${yyyy}-${mm}-${dd}`,
                    order: -1,
                });

                let order = 0;
                for (const groupName in CONFIG) {
                    const group = CONFIG[groupName];
                    for (const sectionName in group) {
                        if (sectionName === "__target") continue;
                        const section = group[sectionName];
                        const opts = section?.options || {};
                        for (const key in opts) {
                            const opt = opts[key] || {};
                            const t = (opt.type || "").toLowerCase();
                            if (t === "statictext") continue;

                            let originalValue;
                            const tailcomment = buildInlineTailFromConfig(opt);
                            if (t === "checkbox") originalValue = opt.default;
                            else if (t === "dayscheckbox") originalValue = opt.default ?? "";
                            else originalValue = data[key];
                            window.lineStore.push({
                                type: "kvp",
                                key,
                                order: order++,
                                originalLine: `${key}="${originalValue}"`,
                                originalValue,
                                originalcomment: tailcomment,
                            });
                        }
                    }
                }
            }

            const outputLines = [];
            const usedKeys = new Set();

            lineStore
                .sort((a, b) => a.order - b.order)
                .forEach((item) => {
                    if (item.type === "comment" || item.type === "blank") {
                        outputLines.push(item.content);
                        return;
                    }
                    if (item.type !== "kvp") return;

                    const key = item.key;
                    if (usedKeys.has(key)) return;

                    if (!(key in data)) {
                        //outputLines.push(item.originalLine || `${item.key}=${item.value}`);
                        console.info(`"${key}" removed`);
                        usedKeys.add(key);
                        return;
                    }

                    const opt = findOptionInConfigData(key) || {};
                    const t = (opt.type || "").toLowerCase();
                    let out;

                    if (t === "checkbox") {
                        const el = document.querySelector(`[data-key="${key}"]`);
                        const checked = !!el?.checked;
                        const orig = String(item.originalValue ?? "").toLowerCase();
                        const toTrue  = { "false": "true", "no": "yes", "disable": "enable", "0": "1" };
                        const toFalse = { "true": "false", "yes": "no", "enable": "disable", "1": "0" };   
                        const next = checked ? (toTrue[orig] ?? item.originalValue) : (toFalse[orig] ?? item.originalValue);                     
                        out = `${key}="${next}"`;
                    } else if (t === "dayscheckbox") {
                        const val = data[key] || "";
                        out = `${key}="${val}"`;            
                    } else {
                        const val = data[key] ?? "";
                        out = isNumericStrict(val) ? `${key}=${val}` : `${key}="${val}"`;
                    }
                    

                    outputLines.push(`${out} ${item.originalcomment}`);
                    usedKeys.add(key);
                });

            const lineStoreKeys = new Set(
                lineStore.filter((x) => x.type === "kvp").map((x) => x.key)
            );
            for (const groupName in CONFIG) {
                const group = CONFIG[groupName];
                for (const sectionName in group) {
                    if (sectionName === "__target") continue;
                    const section = group[sectionName];
                    const opts = section?.options || {};
                    for (const key in opts) {
                        if (usedKeys.has(key) || lineStoreKeys.has(key)) continue;

                        const opt = opts[key] || {};
                        const t = (opt.type || "").toLowerCase();
                        let out;

                        if (t === "checkbox") {
                            const el = document.querySelector(`[data-key="${key}"]`);
                            const checked = !!el?.checked;
                            const defLower = String(opt.default ?? "").toLowerCase();
                            const toTrue  = { "false": "true", "no": "yes", "disable": "enable", "0": "1" };
                            const toFalse = { "true": "false", "yes": "no", "enable": "disable", "1": "0" };
                            const next = checked ? (toTrue[defLower] ?? opt.default) : (toFalse[defLower] ?? opt.default);
                            out = `${key}="${next}"`;
                        } else if (t === "dayscheckbox") {
                            const val = data[key] || "";
                            out = `${key}="${val}"`;
                        } else if (t === "statictext") continue;
                        else {
                            const val = data[key] ?? "";
                            out = isNumericStrict(val) ? `${key}=${val}` : `${key}="${val}"`;
                        }

                        outputLines.push(out);
                    }
                }
            }

            const configText = outputLines.join("\n");
            const blob = new Blob([configText], { type: "text/plain;charset=utf-8" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "multi_report_config.txt";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toastr.success("Configuration saved successfully!");
        } catch (err) {
            console.error(err);
            toastr.error("Failed to save the configuration.");
        }
    }

    function buildInlineTailFromConfig(opt) {
        //const comment = String(opt?.label ?? "").trim();
        //if (!comment) return "";
        //return `        # ${comment}`;
        return ``;
    }    

    // restart -> reload default
    function restartData() {
        //window.location.reload();
        Swal.fire({
            title: "Are you sure?",
            text: "Confirm to reload all defaults settings",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes",
            cancelButtonText: "No"
        }).then((result) => {
            if (result.isConfirmed) {
                resetTabsAndAccordions();
                window.location.reload();
            }
        });        
    }


    //  Toggle short long test mode
    function toggleByMode(modeKey, relatedKeys) {
        const modeEl = document.querySelector(`[data-key="${modeKey}"]`);
        if (!modeEl) return;
        const enabled = modeEl.value === "1";
        relatedKeys.forEach((key) => {
            document
                .querySelectorAll(`[data-key="${key}"], [name="${key}"]`)
                .forEach((el) => {
                    el.disabled = !enabled;
                });
        });
    }

    function bindModeToggles() {
        const shortMode = document.querySelector('[data-key="Short_Test_Mode"]');
        const longMode = document.querySelector('[data-key="Long_Test_Mode"]');

        function onShort() {
            toggleByMode("Short_Test_Mode", shortRelated);
        }
        function onLong() {
            toggleByMode("Long_Test_Mode", longRelated);
        }

        shortMode?.addEventListener("change", onShort);
        longMode?.addEventListener("change", onLong);

        onShort();
        onLong();
    }

    //  Toolbar bindings 
    function bindToolbar() {
        $(SEL.btnLoad).off("click").on("click", loadData);
        $(SEL.btnSave).off("click").on("click", saveData);
        $(SEL.btnRestart).off("click").on("click", restartData);
    }

    // Year and Version
    function updateInitValue() {
        const el = document.querySelector('#year');
        if (el) el.textContent = new Date().getFullYear();
        const vel = document.querySelector('#mr-v');
        if (vel) vel.textContent = `v ${MRV}`;
    }

    // Theme
    function initTheme() {
        const root = document.documentElement;
        const key = 'theme';

        function setTheme(val) {
            localStorage.setItem(key, val);
            if (val === 'auto') {
                root.setAttribute(
                    'data-bs-theme',
                    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
                );
            } else {
                root.setAttribute('data-bs-theme', val);
            }
            window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: root.getAttribute('data-bs-theme') } }));
        }

        const pref = localStorage.getItem(key) || 'auto';
        setTheme(pref);

        document.querySelectorAll('[data-theme-value]').forEach(btn => {
            btn.addEventListener('click', () => setTheme(btn.getAttribute('data-theme-value')));
        });

        const mm = window.matchMedia('(prefers-color-scheme: dark)');
        mm.addEventListener('change', () => {
            if ((localStorage.getItem(key) || 'auto') === 'auto') setTheme('auto');
        });

        window.MRCE = window.MRCE || {};
        window.MRCE.setTheme = setTheme;
    }

    // Tabs & Accordions persistence
    function rememberTabsAndAccordions() {
        const key = "mrce.activeTab";
        const last = localStorage.getItem(key);
        if (last) {
            const triggerEl = document.querySelector(`[data-bs-target="${last}"]`);
            if (triggerEl) new bootstrap.Tab(triggerEl).show();
        }
        document.querySelectorAll('#mrceTabs [data-bs-toggle="tab"]').forEach(btn => {
            btn.addEventListener('shown.bs.tab', e => {
                localStorage.setItem(key, e.target.getAttribute('data-bs-target'));
            });
        });

        document.querySelectorAll('.accordion').forEach(acc => {
            const accId = acc.id || '(no-id)';
            const accKey = `mrce.acc.${accId}`;

            const savedSelector = localStorage.getItem(accKey);
            if (savedSelector) {
                const savedEl = document.querySelector(savedSelector);
                if (savedEl && !savedEl.classList.contains('show')) {
                    new bootstrap.Collapse(savedEl, { toggle: true });
                }
            }

            acc.querySelectorAll('.accordion-collapse').forEach(panel => {
                panel.addEventListener('shown.bs.collapse', (evt) => {
                    localStorage.setItem(accKey, `#${evt.target.id}`);
                });
            });
        });
    }

    // Tabs & Accordions RESET 
    function resetTabsAndAccordions(options = {}) {
        const {
            resetTabsToFirst = true,
            collapseAccordions = true, 
            storageOnly = false
        } = options;

        // clean local storage
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (!k) continue;
            if (k === "mrce.activeTab" || k.startsWith("mrce.acc.")) {
                localStorage.removeItem(k);
            }
        }

        if (storageOnly) return;

        // only visual reset
        try {
            if (resetTabsToFirst) {
                const firstTabTrigger = document.querySelector('#mrceTabs [data-bs-toggle="tab"]');
                if (firstTabTrigger && window.bootstrap?.Tab) {
                    new bootstrap.Tab(firstTabTrigger).show();
                }
            }
        } catch (e) {
            console.warn("Tab reset skipped:", e);
        }
        try {
            if (collapseAccordions && window.bootstrap?.Collapse) {
                document.querySelectorAll('.accordion .accordion-collapse.show').forEach(panel => {
                    new bootstrap.Collapse(panel, { toggle: true });
                });
            }
        } catch (e) {
            console.warn("Accordion reset skipped:", e);
        }
    }

    // --- CUSTOM LIST SUPPORT --- //
    // helper
    function parseCsv(str) {
        return String(str || "")
            .split(",")
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }
    function joinCsv(arr) {
        return (arr || []).map(s => String(s).trim()).filter(Boolean).join(", ");
    }
    function parsePairsCsv(str) {
        return String(str || "")
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
            .map(tok => {
            const i = tok.indexOf(":");
            const v = i === -1 ? tok : tok.slice(0, i);
            const o = i === -1 ? "" : tok.slice(i + 1);
            return { v: v.trim(), o: o.trim() };
            })
            .filter(p => p.v.length > 0);
    }

    function joinPairsCsv(arr) {
        return (arr || [])
            .map(p => `${String(p.v).trim()}:${String(p.o).trim()}`)
            .filter(s => s !== ":") // evita tuple vuote
            .join(", ");
    }

    function cxSerialize(cfg, obj) {
        return (cfg || []).map(f => String(obj[f.key] ?? "").trim()).join(":");
    }
    function cxParseToArray(cfg, text) {
        const lines = String(text || "").trim();
        if (!lines) return [];
        return lines.split(/\s*,\s*/).map(line => {
            const parts = line.split(":");
            const o = {};
            (cfg || []).forEach((f, i) => { o[f.key] = (parts[i] ?? "").trim(); });
            return o;
        });
    }


    // modal //
    function buildCustomListModal() {
        let modal = document.getElementById("mr-customlist-modal");
        if (modal) return modal;

        const html = `
            <div class="modal fade" id="mr-customlist-modal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
                <div class="modal-dialog modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                    <h5 class="modal-title"><i class="fa-solid fa-bars me-2"></i>Edit list</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                    <div class="vstack gap-3">
                        <div>
                        <label class="form-label">Add</label>
                        <div class="input-group">
                            <input type="text" class="form-control" id="mr-cl-input" placeholder="New">
                            <button class="btn btn-info" id="mr-cl-add" type="button">Add</button>
                        </div>
                        </div>
                        <div>
                        <label class="form-label d-flex align-items-center justify-content-between">
                            Actual list
                        </label>
                        <ul class="list-group" id="mr-cl-list"></ul>
                        </div>
                    </div>
                    </div>
                    <div class="modal-footer">
                    <button type="button" class="btn btn-warning" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-success" id="mr-cl-confirm">Confirm</button>
                    </div>
                </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML("beforeend", html);
        return document.getElementById("mr-customlist-modal");
    }

    function buildListWithOffsetModal() {
        let modal = document.getElementById("mr-listwithoffset-modal");
        if (modal) return modal;

        const html = `
        <div class="modal fade" id="mr-listwithoffset-modal" tabindex="-1" aria-hidden="true"
            data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                <h5 class="modal-title"><i class="fa-solid fa-list me-2"></i>Edit list</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                <div class="vstack gap-3">
                    <div>
                    <label class="form-label">Add pair</label>
                    <div class="row g-2 align-items-center">
                        <div class="col">
                        <input type="text" class="form-control" id="mr-lwo-input-value" placeholder="Value">
                        </div>
                        <div class="col-auto">:</div>
                        <div class="col">
                        <input type="text" class="form-control" id="mr-lwo-input-offset" placeholder="Offset">
                        </div>
                        <div class="col-auto">
                        <button class="btn btn-info" id="mr-lwo-add" type="button">Add</button>
                        </div>
                    </div>
                    </div>
                    <div>
                    <label class="form-label">Current items</label>
                    <ul class="list-group" id="mr-lwo-list"></ul>
                    </div>
                </div>
                </div>
                <div class="modal-footer">
                <button type="button" class="btn btn-warning" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-success" id="mr-lwo-confirm">Confirm</button>
                </div>
            </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML("beforeend", html);
        return document.getElementById("mr-listwithoffset-modal");
    }

    function buildComplexListModal() {
        let modal = document.getElementById("mr-complexlist-modal");
        if (modal) return modal;

        const html = `
        <div class="modal fade" id="mr-complexlist-modal" tabindex="-1" aria-hidden="true"
            data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fa-solid fa-table-list me-2"></i>Edit list</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="vstack gap-3">
                <div class="card">
                    <div class="card-header">New item</div>
                    <div class="card-body">
                    <form id="mr-cx-form"></form>
                    </div>
                    <div class="card-footer d-flex gap-2">
                    <button type="button" class="btn btn-secondary" id="mr-cx-clear">Clear</button>
                    <button type="button" class="btn btn-primary" id="mr-cx-add">Add</button>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">Items</div>
                    <div class="card-body">
                    <ul class="list-group" id="mr-cx-list"></ul>
                    </div>
                </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-warning" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-success" id="mr-cx-confirm">Confirm</button>
            </div>
            </div>
        </div>
        </div>`;
        document.body.insertAdjacentHTML("beforeend", html);
        return document.getElementById("mr-complexlist-modal");
    }


    function renderCustomDrivesListFromConfig() {
        const cfg = (window.MRCE && window.MRCE.customDriveListConfig) || [];
        if (!Array.isArray(cfg) || !cfg.length) return;
        const targetSelector = (window.MRCE?.config?.Drive_Customization?.__target);
        const container = document.querySelector(targetSelector);
        if (!container) return;
        if (document.getElementById('Drive_Thresholds')) return;

        const html = `
        <div class="row align-items-center border-bottom p-2">
            <div class="col-12 col-md-6">
            <label for="Drive_Thresholds" class="col-form-label d-inline-flex align-items-center">
                Per-Drive Thresholds
            </label>
            </div>
            <div class="col-12 col-md-6">
            <div class="input-group">
                <input type="text" class="form-control notranslate mr-complexlist"
                    id="Drive_Thresholds" data-key="Drive_Thresholds"
                    placeholder="SERIAL:val2:val3:...  (use the editor)" required>
                <button class="btn btn-outline-secondary mr-complexlist-edit" type="button"
                        data-target="Drive_Thresholds" title="Edit">
                <i class="fa-solid fa-table-list"></i>
                </button>
            </div>
            </div>
        </div>`;
        container.insertAdjacentHTML('beforeend', html);
    }


    // editor //
    function openCustomListEditor($input) {
        const modalEl = buildCustomListModal();
        const listEl = modalEl.querySelector("#mr-cl-list");
        const addBtn = modalEl.querySelector("#mr-cl-add");
        const confirmBtn = modalEl.querySelector("#mr-cl-confirm");
        const inEl = modalEl.querySelector("#mr-cl-input");

        const values = parseCsv($input.val());
        listEl.innerHTML = values.map((v, i) => `
            <li class="list-group-item d-flex align-items-center justify-content-between">
            <span class="text-truncate me-3" title="${v}">${v}</span>
            <button type="button" class="btn btn-sm btn-danger mr-cl-del" data-index="${i}" title="Delete"><i class="fas fa-trash"></i></button>
            </li>`).join("");

        function refreshIndices() {
            listEl.querySelectorAll(".mr-cl-del").forEach((btn, i) => btn.setAttribute("data-index", i));
        }

        // add
        addBtn.onclick = () => {
            const val = inEl.value.trim();
            if (!val) return;
            listEl.insertAdjacentHTML("beforeend", `
            <li class="list-group-item d-flex align-items-center justify-content-between">
                <span class="text-truncate me-3" title="${val}">${val}</span>
                <button type="button" class="btn btn-sm btn-danger mr-cl-del" title="Delete"><i class="fas fa-trash"></i></button>
            </li>`);
            inEl.value = "";
            refreshIndices();
            toastr.success("", "", { timeOut: 500, extendedTimeOut: 500 });
        };

        // delete
        listEl.onclick = (e) => {
            const btn = e.target.closest(".mr-cl-del");
            if (!btn) return;
            const item = btn.closest("li");
            item?.remove();
            refreshIndices();
        };

        // confirm
        confirmBtn.onclick = () => {
            const newVals = Array.from(listEl.querySelectorAll("li span")).map(s => s.textContent.trim()).filter(Boolean);
            $input.val(joinCsv(newVals)).trigger("input");
            const modal = bootstrap.Modal.getOrCreateInstance(modalEl, { backdrop: "static", keyboard: false });
            toastr.success("", "", { timeOut: 500, extendedTimeOut: 500 });
            modal.hide();
        };

        const modal = bootstrap.Modal.getOrCreateInstance(modalEl, { backdrop: "static", keyboard: false });
        modal.show();
        setTimeout(() => inEl?.focus(), 100);
    }

    function openListWithOffsetEditor($input) {
        const modalEl = buildListWithOffsetModal();
        const listEl = modalEl.querySelector("#mr-lwo-list");
        const addBtn = modalEl.querySelector("#mr-lwo-add");
        const confirmBtn = modalEl.querySelector("#mr-lwo-confirm");
        const valEl = modalEl.querySelector("#mr-lwo-input-value");
        const offEl = modalEl.querySelector("#mr-lwo-input-offset");        
        const offsetType = String($input.data("offsettype") || "text").toLowerCase();
        const htmlType = offsetType === "number" ? "number" : (offsetType === "date" ? "date" : "text");
        offEl.setAttribute("type", htmlType);
        offEl.setAttribute("placeholder", offsetType === "number" ? "Number offset" : offsetType === "date" ? "Date offset (YYYY-MM-DD)" : "Offset");

        function isValidOffset(o) {
            if (o === "") return false; // TO DO: OFFSET NOT OPTIONAL RIGHT?
            if (offsetType === "number") return !isNaN(Number(o));
            if (offsetType === "date") {
              // YYYY-MM-DD
              if (!/^\d{4}-\d{2}-\d{2}$/.test(o)) return false;
              const [y, m, d] = o.split("-").map(Number);
              if (m < 1 || m > 12 || d < 1 || d > 31) return false;
              const dt = new Date(Date.UTC(y, m - 1, d));
              return (
                dt.getUTCFullYear() === y &&
                dt.getUTCMonth() === m - 1 &&
                dt.getUTCDate() === d
              );
            }
            return true;
        }        

        const pairs = parsePairsCsv($input.val());
        listEl.innerHTML = pairs.map((p, i) => `
            <li class="list-group-item d-flex align-items-center justify-content-between">
            <span class="text-truncate me-3" title="${p.v}:${p.o}">${p.v}:${p.o}</span>
            <button type="button" class="btn btn-sm btn-danger mr-lwo-del" data-index="${i}" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
            </li>`).join("");

        const refreshIndices = () => {
            listEl.querySelectorAll(".mr-lwo-del").forEach((btn, i) => btn.setAttribute("data-index", i));
        };

        // add
        addBtn.onclick = () => {
            const v = valEl.value.trim();
            const o = offEl.value.trim();
            if (!v) return;
            if (!isValidOffset(o)) {
              toastr.error(
                offsetType === "number" ? "Offset must be a number"
                : offsetType === "date" ? "Offset must be a valid date (YYYY-MM-DD)"
                : "Invalid offset"
              );
              return;
            }

            listEl.insertAdjacentHTML("beforeend", `
            <li class="list-group-item d-flex align-items-center justify-content-between">
                <span class="text-truncate me-3" title="${v}:${o}">${v}:${o}</span>
                <button type="button" class="btn btn-sm btn-danger mr-lwo-del" title="Delete">
                <i class="fas fa-trash"></i>
                </button>
            </li>`);
            valEl.value = "";
            offEl.value = "";
            refreshIndices();
            valEl.focus();
            toastr.success("", "", { timeOut: 500, extendedTimeOut: 500 });
        };

        // delete
        listEl.onclick = (e) => {
            const btn = e.target.closest(".mr-lwo-del");
            if (!btn) return;
            btn.closest("li")?.remove();
            refreshIndices();
        };

        // confirM
        confirmBtn.onclick = () => {
            const items = Array.from(listEl.querySelectorAll("li span"))
            .map(s => s.textContent.trim())
            .filter(Boolean)
            .map(t => {
                const i = t.indexOf(":");
                return { v: i === -1 ? t : t.slice(0, i), o: i === -1 ? "" : t.slice(i + 1) };
            });
            const bad = items.find(it => !isValidOffset(String(it.o || "")));
            if (bad) {
              toastr.error(
                offsetType === "number" ? "Offset must be a number"
                : offsetType === "date" ? "Offset must be a valid date (YYYY-MM-DD)"
                : "Invalid offset"
              );
              return;
            }            
            $input.val(joinPairsCsv(items)).trigger("input");
            const modal = bootstrap.Modal.getOrCreateInstance(modalEl, { backdrop: "static", keyboard: false });
            toastr.success("", "", { timeOut: 500, extendedTimeOut: 500 });
            modal.hide();
        };

        const modal = bootstrap.Modal.getOrCreateInstance(modalEl, { backdrop: "static", keyboard: false });
        modal.show();
        setTimeout(() => valEl?.focus(), 100);
    }

    function openComplexListEditor(inputEl) {
        const modalEl = buildComplexListModal();
        const cfg = (window.MRCE && window.MRCE.customDriveListConfig) || [];
        if (!Array.isArray(cfg) || !cfg.length) { toastr.error("Missing customDriveListConfig"); return; }

        const form  = modalEl.querySelector("#mr-cx-form");
        const list  = modalEl.querySelector("#mr-cx-list");
        const btnAdd = modalEl.querySelector("#mr-cx-add");
        const btnClear = modalEl.querySelector("#mr-cx-clear");
        const btnConfirm = modalEl.querySelector("#mr-cx-confirm");

        // build form
        form.innerHTML = `
            <div class="row g-2">
            ${cfg.map(f => {
                if (f.type === "select") {
                const opts = (f.options || []).map(o => `<option value="${o.value}">${o.label}</option>`).join("");
                return `
                    <div class="col-12 col-md-6 col-xl-3">
                    <label class="form-label">${f.label}</label>
                    <select class="form-select" name="${f.key}" required>${opts}</select>
                    </div>`;
                }
                const min = f.min != null ? ` min="${f.min}"` : "";
                const max = f.max != null ? ` max="${f.max}"` : "";
                const typ = f.type === "number" ? "number" : "text";
                return `
                <div class="col-12 col-md-6 col-xl-3">
                    <label class="form-label">${f.label}</label>
                    <input type="${typ}" class="form-control" name="${f.key}"${min}${max} required>
                </div>`;
            }).join("")}
            </div>`;

        const items = cxParseToArray(cfg, inputEl.value);

        function renderList() {
            list.innerHTML = items.length
                ? items.map((it, i) => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span class="text-truncate" style="max-width:80%">${cxSerialize(cfg, it)}</span>
                    <button type="button" class="btn btn-sm btn-danger" data-idx="${i}"><i class="fa-solid fa-trash"></i></button>
                </li>`).join("")
                : `<li class="list-group-item text-muted">No items.</li>`;
        }

        function clearForm() {
            cfg.forEach(f => {
                const el = form.querySelector(`[name="${f.key}"]`);
                if (!el) return;
                el.value = f.default ?? "";
            });
        }

        function readForm() {
            const o = {};
            for (const f of cfg) {
                const el = form.querySelector(`[name="${f.key}"]`);
                const v = (el?.value ?? "").trim();
                if (v === "") return null;
                o[f.key] = v;
            }
            return o;
        }

        btnAdd.onclick = () => {
            const obj = readForm();
            if (!obj) { toastr.warning("All fields are required"); return; }
            items.push(obj);
            renderList();
            clearForm();
            toastr.success("", "", { timeOut: 500, extendedTimeOut: 500 });
        };
        btnClear.onclick = () => clearForm();
        list.onclick = (e) => {
            const b = e.target.closest("button[data-idx]");
            if (!b) return;
            const i = parseInt(b.dataset.idx, 10);
            items.splice(i, 1);
            renderList();
        };
        btnConfirm.onclick = () => {
            inputEl.value = items.map(it => cxSerialize(cfg, it)).join(", ");
            inputEl.dispatchEvent(new Event("input", { bubbles: true }));
            bootstrap.Modal.getOrCreateInstance(modalEl).hide();
            toastr.success("", "", { timeOut: 500, extendedTimeOut: 500 });
        };

        clearForm();
        renderList();
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }

    // init handler
    function initCustomListHandlers() {
        $(document).off("click", ".mr-customlist-edit").on("click", ".mr-customlist-edit", function () {
            const id = $(this).attr("data-target");
            const $input = $("#"+id);
            if ($input.length) openCustomListEditor($input);
        });
        //$(document).off("focus", "input.mr-customlist").on("focus", "input.mr-customlist", function () {
        //    toastr.info("", "", { timeOut: 500, extendedTimeOut: 500 });
        //});
        $(document).off("click", "input.mr-customlist").on("click", "input.mr-customlist", function (e) {
            openCustomListEditor($(this));
        });
    }

    function initListWithOffsetHandlers() {
        $(document).off("click", ".mr-listwithoffset-edit").on("click", ".mr-listwithoffset-edit", function () {
            const id = $(this).attr("data-target");
            const $input = $("#"+id);
            if ($input.length) openListWithOffsetEditor($input);
        });
        $(document).off("click", "input.mr-listwithoffset").on("click", "input.mr-listwithoffset", function () {
            openListWithOffsetEditor($(this));
        });
    }

    function initComplexListHandlers() {
        $(document).off("click", ".mr-complexlist-edit").on("click", ".mr-complexlist-edit", function () {
            const target = $(this).data("target");
            const input = document.getElementById(target);
            if (input) openComplexListEditor(input);
        });
        $(document).off("click", "input.mr-complexlist").on("click", "input.mr-complexlist", function () {
            openComplexListEditor(this);
        });
    }




    // --- END CUSTOM LIST SUPPORT --- //

    //  Init 
    function init() {   
        renderConfig();
        tooltipInit();
        updateInitValue('#year');
        initTheme();
        rememberTabsAndAccordions();
        bindModeToggles();
        bindToolbar(); 
        initCustomListHandlers();
        initListWithOffsetHandlers();
        renderCustomDrivesListFromConfig();
        initComplexListHandlers();  
        $("header.container").removeClass("hidden").addClass("animate-in");
        $("main.container").removeClass("hidden").addClass("animate-in");
    }

    // expose
    MRCE.init = init;
    MRCE.loadData = loadData;
    MRCE.saveData = saveData;
    MRCE.restartData = restartData;

    $(init);

})(window, jQuery);

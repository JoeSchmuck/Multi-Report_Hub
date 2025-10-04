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
            const checkedAttr = String(def).toLowerCase() === "enable" ? " checked" : "";
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
        } else {
            return `
        <input type="text" class="form-control notranslate" id="${id}" data-key="${fieldKey}" value="${def}"${reqAttr}>`;
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
            const norm = String(val).toLowerCase();
            const checked =
                norm === "true" || norm === "enable" || norm === "yes" || norm === "1";
            $el.prop("checked", checked);
        } else if ($el.is("select") || $el.is("textarea")) {
            $el.val(val);
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
                            if (mQuoted) {
                                value = mQuoted[2].trim();
                            } else {
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
                            if (rawKey.toLowerCase().includes("color")) {
                                value = normalizeHex(value);
                            }

                            loadedData[rawKey] = value;
                            lineStore.push({
                                type: "kvp",
                                key: rawKey,
                                order: index,
                                originalLine: line,
                                originalValue: value,
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


    //  SAVE main function now async 
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
                    el.checked = String(defVal).toLowerCase() === "true" 
                                || String(defVal).toLowerCase() === "yes" 
                                || String(defVal).toLowerCase() === "enable"
                                || String(defVal).toLowerCase() === "false" 
                                || String(defVal).toLowerCase() === "no" 
                                || String(defVal).toLowerCase() === "disable";                                
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
                //else if (emailOpt && emailOpt.default && emailVal === emailOpt.default) {
                //    toastr.error(
                //        "Please load a configuration file first, or change the default email address."
                //    );
                //    revealAndHighlight(`[data-key="${key}"]`);
                //    return;
                //} 
            
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
                    content: `# Multi-Report v3.20 dtd:${yyyy}-${mm}-${dd}`,
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
                            let originalValue;
                            if (t === "checkbox") originalValue = opt.default;
                            else if (t === "dayscheckbox") originalValue = opt.default ?? "";
                            else originalValue = data[key];
                            window.lineStore.push({
                                type: "kvp",
                                key,
                                order: order++,
                                originalLine: `${key}="${originalValue}"`,
                                originalValue,
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
                        if (checked) {
                            //out = `${key}="${item.originalValue}"`;
                            if (orig === "false") out = `${key}="true"`;
                            else if (orig === "no") out = `${key}="yes"`;
                            else if (orig === "disable") out = `${key}="enable"`;
                            else out = `${key}="${item.originalValue}"`;
                        } else {
                            if (orig === "true") out = `${key}="false"`;
                            else if (orig === "yes") out = `${key}="no"`;
                            else if (orig === "enable") out = `${key}="disable"`;
                            else out = `${key}="${item.originalValue}"`;
                        }
                    } else if (t === "dayscheckbox") {
                        const val = data[key] || "";
                        out = `${key}="${val}"`;
                    } else {
                        const val = data[key] ?? "";
                        out = isNumericStrict(val) ? `${key}=${val}` : `${key}="${val}"`;
                    }

                    outputLines.push(out);
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
                            //if (checked) out = `${key}="${opt.default}"`;
                            if(checked) {
                                if (defLower === "false") out = `${key}="true"`;
                                else if (defLower === "no") out = `${key}="yes"`;
                                else if (defLower === "disable") out = `${key}="enable"`;
                                else out = `${key}="${opt.originalValue}"`;                                
                            }
                            else {
                                if (defLower === "true") out = `${key}="false"`;
                                else if (defLower === "yes") out = `${key}="no"`;
                                else if (defLower === "enable") out = `${key}="disable"`;
                                else out = `${key}="${opt.default}"`;
                            }
                        } else if (t === "dayscheckbox") {
                            const val = data[key] || "";
                            out = `${key}="${val}"`;
                        } else {
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



    //  Init 
    function init() {   
        renderConfig();
        tooltipInit();
        updateInitValue('#year');
        initTheme();
        rememberTabsAndAccordions();
        bindModeToggles();
        bindToolbar(); 
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

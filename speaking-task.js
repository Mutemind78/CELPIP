/* SelfPIP — CELPIP Speaking task-page interactions (shared by all 8 task pages)
   Loaded after the shared script.js.
   --------------------------------------------------------------------------
   Nothing here touches other pages: every hook is namespaced with the
   data-spk-* attribute prefix or the .spk- class prefix.

   WHAT IT POWERS
   1. Expand / collapse panels (useful-language, extra tips)  -> data-spk-acc-*
   2. Interactive self-check checklists with a counter        -> data-spk-checklist
*/

(function () {
    'use strict';

    /* ---------- 1. Expand / collapse panels ------------------------- */
    function runAccordions() {
        var groups = document.querySelectorAll('[data-spk-acc-group]');
        groups.forEach(function (group) {
            var headers = group.querySelectorAll('[data-spk-acc-toggle]');
            headers.forEach(function (h) {
                h.addEventListener('click', function () {
                    var id = h.getAttribute('aria-controls');
                    var panel = id ? document.getElementById(id) : null;
                    if (!panel) { return; }
                    var open = panel.getAttribute('hidden') === null ? false : true;
                    panel.toggleAttribute('hidden');
                    h.setAttribute('aria-expanded', open ? 'false' : 'true');
                });
            });
        });
    }

    /* ---------- 2. Interactive checklists (counter + clear) -------- */
    function runChecklists() {
        var lists = document.querySelectorAll('[data-spk-checklist]');
        lists.forEach(function (list) {
            var inputs = list.querySelectorAll('input[type="checkbox"]');
            var root = list.parentElement;
            var countEl = root.querySelector('[data-spk-check-count]');
            var clearBtn = root.querySelector('[data-spk-clear-checklist]');

            function update() {
                var n = Array.prototype.reduce.call(inputs, function (s, c) {
                    return s + (c.checked ? 1 : 0);
                }, 0);
                if (countEl) {
                    countEl.textContent = n + (n === 0 ? ' unchecked' : ' checked');
                }
                if (clearBtn) {
                    clearBtn.hidden = n === 0;
                }
            }

            inputs.forEach(function (c) {
                c.addEventListener('change', update);
            });

            if (clearBtn) {
                clearBtn.addEventListener('click', function () {
                    inputs.forEach(function (c) { c.checked = false; });
                    update();
                });
                update();
            }
        });
    }

    /* ---------- Boot ------------------------------------------------- */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            runAccordions();
            runChecklists();
        });
    } else {
        runAccordions();
        runChecklists();
    }
})();

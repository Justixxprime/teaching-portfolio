/* ============================================================
   THEME: light / dark / auto
   Auto = follows system preference; if the browser also exposes
   the day/night via prefers-color-scheme that's respected live.
   Manual choice is remembered in localStorage.
   ============================================================ */
(function () {
  var KEY = 'site-theme'; // 'light' | 'dark' | 'auto'
  var root = document.documentElement;

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function apply(mode) {
    var resolved = mode === 'auto' ? (systemPrefersDark() ? 'dark' : 'light') : mode;
    root.setAttribute('data-theme', resolved);
    root.setAttribute('data-theme-mode', mode);
    var btn = document.querySelector('.theme-toggle-btn');
    var label = document.querySelector('.theme-label');
    if (btn) btn.setAttribute('data-mode', mode);
    if (label) {
      var text = mode === 'auto' ? 'Theme: Auto (' + resolved + ')' : mode === 'dark' ? 'Theme: Dark' : 'Theme: Light';
      label.textContent = text;
    }
  }

  function getStored() {
    try { return localStorage.getItem(KEY) || 'auto'; } catch (e) { return 'auto'; }
  }
  function store(mode) {
    try { localStorage.setItem(KEY, mode); } catch (e) {}
  }

  var current = getStored();
  apply(current);

  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (getStored() === 'auto') apply('auto');
  });

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('.theme-toggle-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var order = ['auto', 'light', 'dark'];
      var next = order[(order.indexOf(getStored()) + 1) % order.length];
      store(next);
      apply(next);
    });
  });
})();

/* ============================================================
   NAV DROPDOWNS — one open at a time, closes on outside click,
   Escape, or when another opens.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  var drops = Array.prototype.slice.call(document.querySelectorAll('.nav-item-drop'));

  function closeAll(except) {
    drops.forEach(function (d) {
      if (d !== except) d.setAttribute('data-open', 'false');
    });
  }

  drops.forEach(function (drop) {
    var trigger = drop.querySelector('.nav-drop-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = drop.getAttribute('data-open') === 'true';
      closeAll(drop);
      drop.setAttribute('data-open', isOpen ? 'false' : 'true');
    });
  });

  document.addEventListener('click', function () { closeAll(null); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll(null);
  });
});

/* ============================================================
   CUSTOM DROPDOWN / SELECT
   Progressive enhancement over a real <select name="..."> that
   stays in the DOM (hidden) so form submission still works
   without JS. Keyboard: Enter/Space open, ArrowUp/Down move,
   Enter select, Escape close. After a choice, gently scrolls
   the next field into view.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  var natives = document.querySelectorAll('select[data-enhance]');

  natives.forEach(function (native) {
    var wrap = document.createElement('div');
    wrap.className = 'xselect';
    wrap.setAttribute('data-open', 'false');
    native.parentNode.insertBefore(wrap, native);
    native.style.position = 'absolute';
    native.style.opacity = '0';
    native.style.pointerEvents = 'none';
    native.style.height = '0';
    native.tabIndex = -1;
    wrap.appendChild(native);

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'xselect-trigger';
    var currentLabel = native.options[native.selectedIndex] ? native.options[native.selectedIndex].text : 'Select an option';
    trigger.textContent = currentLabel;
    if (!native.value) trigger.setAttribute('data-placeholder', 'true');
    var chev = document.createElement('span');
    chev.className = 'chev';
    trigger.appendChild(chev);
    wrap.appendChild(trigger);

    var panel = document.createElement('div');
    panel.className = 'xselect-panel';
    panel.setAttribute('role', 'listbox');

    Array.prototype.forEach.call(native.options, function (opt) {
      if (!opt.value) return; // skip the "Select an option" placeholder in the visual list
      var optBtn = document.createElement('button');
      optBtn.type = 'button';
      optBtn.className = 'xselect-option';
      optBtn.textContent = opt.text;
      optBtn.setAttribute('role', 'option');
      optBtn.setAttribute('aria-selected', opt.selected ? 'true' : 'false');
      optBtn.addEventListener('click', function () {
        native.value = opt.value;
        native.dispatchEvent(new Event('change', { bubbles: true }));
        trigger.textContent = opt.text;
        trigger.removeAttribute('data-placeholder');
        trigger.appendChild(chev);
        panel.querySelectorAll('.xselect-option').forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
        optBtn.setAttribute('aria-selected', 'true');
        wrap.setAttribute('data-open', 'false');

        // gently scroll toward the next field, so choosing an
        // option carries the visitor forward through the form
        var allFields = Array.prototype.slice.call(document.querySelectorAll('.field'));
        var thisField = wrap.closest('.field');
        var idx = allFields.indexOf(thisField);
        var next = allFields[idx + 1];
        if (next) next.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      panel.appendChild(optBtn);
    });

    wrap.appendChild(panel);

    function closeThis() { wrap.setAttribute('data-open', 'false'); }
    function openThis() {
      document.querySelectorAll('.xselect[data-open="true"]').forEach(function (w) {
        if (w !== wrap) w.setAttribute('data-open', 'false');
      });
      wrap.setAttribute('data-open', 'true');
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      wrap.getAttribute('data-open') === 'true' ? closeThis() : openThis();
    });

    wrap.addEventListener('keydown', function (e) {
      var options = Array.prototype.slice.call(panel.querySelectorAll('.xselect-option'));
      var activeIndex = options.findIndex(function (o) { return o.classList.contains('active'); });
      if (e.key === 'Escape') { closeThis(); trigger.focus(); }
      if (e.key === 'ArrowDown') {
        e.preventDefault(); openThis();
        options.forEach(function (o) { o.classList.remove('active'); });
        var nextI = Math.min(activeIndex + 1, options.length - 1);
        if (options[nextI]) { options[nextI].classList.add('active'); options[nextI].focus(); }
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        options.forEach(function (o) { o.classList.remove('active'); });
        var prevI = Math.max(activeIndex - 1, 0);
        if (options[prevI]) { options[prevI].classList.add('active'); options[prevI].focus(); }
      }
    });
  });

  document.addEventListener('click', function () {
    document.querySelectorAll('.xselect[data-open="true"]').forEach(function (w) { w.setAttribute('data-open', 'false'); });
  });
});

/* ============================================================
   SCROLL REVEAL — [data-reveal] and .sequence-item fade/lift
   into place the first time they enter the viewport. Cheap,
   GPU-friendly, respects prefers-reduced-motion via CSS.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  var targets = document.querySelectorAll('[data-reveal], .sequence-item');
  if (!targets.length || !('IntersectionObserver' in window)) {
    targets.forEach(function (t) { t.classList.add('in-view'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  targets.forEach(function (t) { io.observe(t); });
});

/* ============================================================
   ACCORDION — single-open-at-a-time within each
   height math needed).
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-accordion-group]').forEach(function (group) {
    var items = Array.prototype.slice.call(group.querySelectorAll('.accordion-item'));
    items.forEach(function (item) {
      var trigger = item.querySelector('.accordion-trigger');
      if (!trigger) return;
      trigger.addEventListener('click', function () {
        var willOpen = !item.classList.contains('open');
        items.forEach(function (i) { i.classList.remove('open'); i.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false'); });
        if (willOpen) {
          item.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  });
});

/* ============================================================
   FLOATING WHATSAPP BUTTON — her own direct line, present on
   every page. Injected via JS (not hardcoded per-page) so it's
   guaranteed everywhere, including any pages added later.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  var wrap = document.createElement('div');
  wrap.className = 'wa-float';
  wrap.innerHTML =
    '<a href="https://wa.me/c/971543044578" target="_blank" rel="noopener" class="wa-float-btn" aria-label="Message Jennifer on WhatsApp">' +
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 11.9a8.4 8.4 0 0 1-12.3 7.4L4 20.5l1.3-4a8.4 8.4 0 1 1 15.2-4.6Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.7 8.7c.2-.5.6-.5 1-.5h.4c.2 0 .4 0 .6.4.2.5.7 1.6.7 1.8.1.1.1.3 0 .5-.1.1-.1.3-.3.4l-.4.5c-.1.2-.3.3-.1.6.2.3.8 1.2 1.7 2 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1.2-.2.7-.8.9-1 .2-.3.4-.2.6-.1l1.6.8c.2.1.4.2.4.3.1.4.1.9-.1 1.3-.3.5-1.2.9-1.7 1-.5.1-1 .1-3.3-.7-2.8-1.1-4.6-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9 0-1.4.7-2 1-2.3Z"/></svg>' +
    '</a>' +
    '<span class="wa-float-label">Message Jennifer<br>on WhatsApp</span>';
  document.body.appendChild(wrap);
});

/* ============================================================
   VIDEO CARDS — hover preview + click-to-open lightbox
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  var cards = document.querySelectorAll('.video-card');
  if (!cards.length) return;

  var lightbox = document.createElement('div');
  lightbox.className = 'video-lightbox';
  lightbox.innerHTML = '<button class="video-lightbox-close" aria-label="Close">&times;</button><video controls playsinline></video>';
  document.body.appendChild(lightbox);
  var lbVideo = lightbox.querySelector('video');

  function close() {
    lightbox.classList.remove('open');
    lbVideo.pause();
    lbVideo.removeAttribute('src');
  }
  lightbox.querySelector('.video-lightbox-close').addEventListener('click', close);
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  cards.forEach(function (card) {
    var previewVideo = card.querySelector('video');
    card.addEventListener('mouseenter', function () { if (previewVideo) previewVideo.play().catch(function(){}); });
    card.addEventListener('mouseleave', function () { if (previewVideo) previewVideo.pause(); });
    card.addEventListener('click', function () {
      lbVideo.src = card.getAttribute('data-video');
      lightbox.classList.add('open');
      lbVideo.play().catch(function(){});
    });
  });
});

/* ============================================================
   PAGE LOAD FADE-IN — soft entrance rather than a hard flash.
   ============================================================ */
window.addEventListener('load', function () {
  requestAnimationFrame(function () {
    document.body.classList.add('loaded');
  });
});
// Fallback in case 'load' already fired before this script ran
if (document.readyState === 'complete') {
  document.body.classList.add('loaded');
}

/* ============================================================
   THEME: light / dark / auto / location
   - light / dark: manual, fixed
   - auto: follows the device's system preference, live
   - location: asks for geolocation once, checks actual sunrise/
     sunset at that location (via a free, keyless API), and
     switches automatically. Falls back to local device time
     (7am–7pm = light) if permission is denied or the API is
     unreachable, so it never gets stuck.
   Manual choice is remembered in localStorage. Switching themes
   uses the View Transitions API for a soft circular reveal from
   the toggle button, when the browser supports it; a plain
   crossfade (already defined in tokens.css) is the fallback.
   ============================================================ */
(function () {
  var KEY = 'site-theme'; // 'light' | 'dark' | 'auto' | 'location'
  var root = document.documentElement;
  var MODES = ['auto', 'light', 'dark', 'location'];
  var ICONS = {
    light: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"/>',
    dark: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>',
    auto: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor" stroke="none"/>',
    location: '<path d="M12 21s7-6.4 7-11.5A7 7 0 0 0 5 9.5C5 14.6 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.3"/>',
  };
  var LABELS = { light: 'Light', dark: 'Dark', auto: 'Auto', location: 'Location' };

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function localHourSaysDark() {
    var h = new Date().getHours();
    return h < 7 || h >= 19;
  }

  var locationResolvedDark = null; // cache once known, avoids refetching every click

  function resolveLocationTheme(onReady) {
    if (locationResolvedDark !== null) { onReady(locationResolvedDark); return; }
    if (!('geolocation' in navigator)) { onReady(localHourSaysDark()); return; }

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var lat = pos.coords.latitude, lng = pos.coords.longitude;
        fetch('https://api.sunrise-sunset.org/json?lat=' + lat + '&lng=' + lng + '&formatted=0')
          .then(function (r) { return r.json(); })
          .then(function (data) {
            try {
              var sunrise = new Date(data.results.sunrise);
              var sunset = new Date(data.results.sunset);
              var now = new Date();
              var isDark = now < sunrise || now > sunset;
              locationResolvedDark = isDark;
              onReady(isDark);
            } catch (e) {
              onReady(localHourSaysDark());
            }
          })
          .catch(function () { onReady(localHourSaysDark()); });
      },
      function () { onReady(localHourSaysDark()); },
      { timeout: 6000 }
    );
  }

  function paintIcon(mode) {
    var svg = document.querySelector('.theme-toggle-btn svg');
    if (!svg) return;
    svg.innerHTML = ICONS[mode] || ICONS.auto;
    svg.classList.remove('swap');
    void svg.offsetWidth; // restart animation
    svg.classList.add('swap');
  }

  function setLabel(mode, resolved) {
    var label = document.querySelector('.theme-label');
    if (!label) return;
    var text = mode === 'light' || mode === 'dark'
      ? 'Theme: ' + LABELS[mode]
      : 'Theme: ' + LABELS[mode] + ' (' + resolved + ')';
    label.textContent = text;
  }

  function paint(mode, resolved) {
    root.setAttribute('data-theme', resolved);
    root.setAttribute('data-theme-mode', mode);
    var btn = document.querySelector('.theme-toggle-btn');
    if (btn) btn.setAttribute('data-mode', mode);
    paintIcon(mode === 'auto' || mode === 'location' ? resolved : mode);
    setLabel(mode, resolved);
  }

  function apply(mode) {
    if (mode === 'light' || mode === 'dark') {
      paint(mode, mode);
    } else if (mode === 'auto') {
      paint(mode, systemPrefersDark() ? 'dark' : 'light');
    } else if (mode === 'location') {
      // Paint an immediate best-guess so there's no flash, then
      // refine once geolocation/the API responds.
      paint(mode, localHourSaysDark() ? 'dark' : 'light');
      resolveLocationTheme(function (isDark) { paint(mode, isDark ? 'dark' : 'light'); });
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
    btn.addEventListener('click', function (e) {
      var next = MODES[(MODES.indexOf(getStored()) + 1) % MODES.length];
      store(next);

      var doSwitch = function () { apply(next); };

      if (document.startViewTransition) {
        var rect = btn.getBoundingClientRect();
        var x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
        var endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        var transition = document.startViewTransition(doSwitch);
        transition.ready.then(function () {
          document.documentElement.animate(
            { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + endRadius + 'px at ' + x + 'px ' + y + 'px)'] },
            { duration: 650, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
          );
        });
      } else {
        doSwitch();
      }
    });
  });
})();

/* ============================================================
   PRIVATE GALLERY FILTERS — All / Photos / Videos / Notes
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  var filters = document.querySelectorAll('.gallery-filter');
  if (!filters.length) return;
  var tiles = document.querySelectorAll('.gallery-grid .tile');

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filters.forEach(function (b) { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      var wanted = btn.getAttribute('data-filter');
      tiles.forEach(function (tile) {
        var show = wanted === 'all' || tile.getAttribute('data-category') === wanted;
        tile.classList.toggle('is-hidden', !show);
      });
    });
  });
});

/* ============================================================
   ACTIVE PAGE HIGHLIGHT — nav, nav dropdowns, and footer links
   all get marked to match whatever page is currently open. Done
   in JS since the nav/footer markup is identical across every
   page (see partials/), so this can't be hardcoded per page.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  var here = location.pathname.split('/').pop() || 'index.html';
  var links = document.querySelectorAll('.nav-links a, .dropdown-panel a, .site-footer a');
  links.forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === here) {
      a.setAttribute('aria-current', 'page');
      a.classList.add('is-current');
    }
  });
  // If the current page lives inside a "Work" or "Evidence" dropdown,
  // highlight that dropdown's trigger too, so the section reads as
  // active even when collapsed.
  document.querySelectorAll('.nav-item-drop').forEach(function (drop) {
    if (drop.querySelector('.dropdown-panel a.is-current')) {
      drop.querySelector('.nav-drop-trigger').classList.add('is-current');
    }
  });
});
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
  var targets = document.querySelectorAll('[data-reveal], .sequence-item, .tile');
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

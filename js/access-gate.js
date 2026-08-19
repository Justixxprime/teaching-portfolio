/* ============================================================
   ACCESS GATE — shared by private-portfolio.html and
   video-library.html. Checks a submitted password against
   Supabase (see docs/supabase-setup.sql), and if correct,
   reveals whatever is inside [data-gated] on the page for the
   rest of the browser session (sessionStorage, not permanent —
   closing the tab and coming back later asks again).
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('access-form');
  if (!form) return;

  var input = document.getElementById('access-password');
  var button = form.querySelector('button[type="submit"]');
  var status = form.querySelector('.form-status');
  var gatedContent = document.querySelector('[data-gated]');
  var gateWrap = document.querySelector('[data-gate]');
  var SESSION_KEY = 'private-area-unlocked';

  function unlock() {
    if (gateWrap) gateWrap.style.display = 'none';
    if (gatedContent) {
      gatedContent.hidden = false;
      gatedContent.style.opacity = '0';
      requestAnimationFrame(function () {
        gatedContent.style.transition = 'opacity 500ms ease';
        gatedContent.style.opacity = '1';
      });
    }
  }

  // Already unlocked earlier this session? Skip the form entirely.
  try {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      unlock();
      return;
    }
  } catch (e) {}

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var config = window.SUPABASE_CONFIG;
    var supabaseNotConfigured = !config || config.url.indexOf('YOUR-PROJECT-REF') !== -1;

    // ------------------------------------------------------------
    // TEST MODE — active only while Supabase hasn't been wired up
    // yet (js/supabase-config.js still has placeholder values).
    // Lets you click through the real flow today. The password is
    // "preview2026". DELETE this whole block once real Supabase
    // credentials are filled into js/supabase-config.js — search
    // for "TEST MODE" to find it fast.
    // ------------------------------------------------------------
    if (supabaseNotConfigured) {
      button.disabled = true;
      var testLabel = button.textContent;
      button.textContent = 'Checking…';
      status.className = 'form-status show';
      status.textContent = 'Checking password… (test mode — Supabase not connected yet)';

      setTimeout(function () {
        if (input.value === 'preview2026') {
          try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch (e) {}
          status.className = 'form-status success show';
          status.textContent = 'Access granted. (Test mode — connect Supabase before launch.)';
          setTimeout(unlock, 400);
        } else {
          status.className = 'form-status error show';
          status.textContent = 'Not correct. (Test mode password is "preview2026" until Supabase is connected.)';
          button.disabled = false;
          button.textContent = testLabel;
        }
      }, 500);
      return;
    }
    // ------------------------------------------------------------
    // END TEST MODE
    // ------------------------------------------------------------

    button.disabled = true;
    var originalLabel = button.textContent;
    button.textContent = 'Checking…';
    status.className = 'form-status show';
    status.textContent = 'Checking password…';

    try {
      var res = await fetch(config.url + '/rest/v1/rpc/check_site_password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.anonKey,
          'Authorization': 'Bearer ' + config.anonKey,
        },
        body: JSON.stringify({ input_password: input.value }),
      });
      var correct = await res.json();

      if (correct === true) {
        try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch (e) {}
        status.className = 'form-status success show';
        status.textContent = 'Access granted.';
        setTimeout(unlock, 400);
      } else {
        status.className = 'form-status error show';
        status.textContent = 'That password is not correct. Please try again.';
        button.disabled = false;
        button.textContent = originalLabel;
      }
    } catch (err) {
      status.className = 'form-status error show';
      status.textContent = 'Could not reach the access system. Please try again in a moment.';
      button.disabled = false;
      button.textContent = originalLabel;
    }
  });
});

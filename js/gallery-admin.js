/* ============================================================
   GALLERY ADMIN — admin key, upload flow, manage/delete list.
   Only runs on gallery-admin.html (behind the same password gate
   as the private portfolio).
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  var drop = document.getElementById('upload-drop');
  if (!drop) return; // not on this page

  var api = window.GalleryAPI;
  var fileInput = document.getElementById('file-input');
  var uploadForm = document.getElementById('upload-form');
  var captionInput = document.getElementById('caption-input');
  var categorySelect = document.getElementById('category-input');
  var uploadBtn = document.getElementById('upload-btn');
  var progressBar = document.getElementById('progress-bar');
  var progressFill = document.getElementById('progress-fill');
  var uploadStatus = document.getElementById('upload-status');
  var manageList = document.getElementById('manage-list');
  var fileNote = document.getElementById('file-note');
  var keyInput = document.getElementById('key-input');
  var keySave = document.getElementById('key-save');
  var keyClear = document.getElementById('key-clear');
  var keyStatus = document.getElementById('key-status');

  // Cloudflare Workers accept request bodies up to 100 MB on the free plan.
  var MAX_BYTES = 95 * 1024 * 1024;
  var selectedFile = null;

  function status(el, cls, text) {
    el.className = 'form-status show ' + cls;
    el.textContent = text;
  }

  /* ---------- admin key ---------- */
  function refreshKeyStatus() {
    if (api.hasKey()) {
      keyStatus.textContent = 'Admin key saved on this device. You can upload and delete.';
      keyStatus.style.color = 'var(--teal)';
    } else {
      keyStatus.textContent = 'Not set yet. Paste your admin key below to be able to upload and delete.';
      keyStatus.style.color = 'var(--ink-soft)';
    }
  }
  keySave.addEventListener('click', function () {
    var v = keyInput.value.trim();
    if (!v) return;
    api.setKey(v);
    keyInput.value = '';
    refreshKeyStatus();
    loadManageList();
  });
  keyClear.addEventListener('click', function () {
    api.setKey('');
    refreshKeyStatus();
  });
  refreshKeyStatus();

  if (!api.configured()) {
    manageList.innerHTML = '<p style="color:var(--ink-soft);">The gallery storage isn\'t connected yet. See docs/r2-setup-guide.md.</p>';
  }

  /* ---------- choosing a file ---------- */
  drop.addEventListener('click', function () { fileInput.click(); });
  drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('drag-over'); });
  drop.addEventListener('dragleave', function () { drop.classList.remove('drag-over'); });
  drop.addEventListener('drop', function (e) {
    e.preventDefault();
    drop.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', function () {
    if (fileInput.files.length) handleFile(fileInput.files[0]);
  });

  function fmtSize(b) {
    return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  }

  function handleFile(file) {
    selectedFile = file;
    uploadForm.style.display = 'block';
    categorySelect.value = file.type.indexOf('video/') === 0 ? 'video' : 'photo';
    categorySelect.dispatchEvent(new Event('change'));
    drop.querySelector('p').textContent = 'Selected: ' + file.name + ' (' + fmtSize(file.size) + ')';
    uploadStatus.className = 'form-status';
    uploadStatus.textContent = '';

    var note = '';
    uploadBtn.disabled = false;
    if (file.size > MAX_BYTES) {
      note = 'This file is ' + fmtSize(file.size) + ', which is over the 95 MB upload limit. Compress it first (for example with HandBrake, MP4 / H.264), or trim it, then choose it again.';
      uploadBtn.disabled = true;
    } else if (file.type.indexOf('video/') === 0 && file.type !== 'video/mp4' && file.type !== 'video/webm') {
      note = 'Tip: MP4 (H.264) plays on every phone and browser. This file type may not play everywhere.';
    }
    fileNote.textContent = note;
    fileNote.style.display = note ? 'block' : 'none';
  }

  /* ---------- upload ---------- */
  uploadBtn.addEventListener('click', async function () {
    if (!selectedFile) return;
    if (!api.configured()) { status(uploadStatus, 'error', 'The gallery storage isn\'t connected yet. See docs/r2-setup-guide.md.'); return; }
    if (!api.hasKey()) { status(uploadStatus, 'error', 'Save your admin key first (the box above).'); return; }

    uploadBtn.disabled = true;
    progressBar.style.display = 'block';
    status(uploadStatus, '', 'Uploading…');

    try {
      await api.upload(selectedFile, captionInput.value, categorySelect.value, function (pct) {
        progressFill.style.width = pct + '%';
        uploadStatus.textContent = 'Uploading… ' + pct + '%';
      });
      status(uploadStatus, 'success', 'Uploaded! It now appears in the gallery.');
      captionInput.value = '';
      selectedFile = null;
      fileInput.value = '';
      fileNote.style.display = 'none';
      uploadForm.style.display = 'none';
      drop.querySelector('p').textContent = 'Tap to choose a photo or video';
      loadManageList();
    } catch (e) {
      var msg = 'Upload failed. Please try again.';
      if (e.message === 'BAD_KEY') msg = 'The admin key was not accepted. Re-enter it in the box above.';
      else if (e.message === 'NETWORK') msg = 'Could not reach the gallery storage. Check your connection and the worker address in js/r2-config.js.';
      status(uploadStatus, 'error', msg);
    } finally {
      uploadBtn.disabled = false;
      progressBar.style.display = 'none';
      progressFill.style.width = '0%';
    }
  });

  /* ---------- manage / delete ---------- */
  async function loadManageList() {
    if (!api.configured()) return;
    try {
      var items = await api.list();
      if (!items.length) {
        manageList.innerHTML = '<p style="color:var(--ink-soft);">Nothing uploaded yet.</p>';
        return;
      }
      items.sort(function (a, b) { return new Date(b.uploaded) - new Date(a.uploaded); });
      manageList.innerHTML = '';
      items.forEach(function (item) {
        var row = document.createElement('div');
        row.className = 'manage-row';
        var isVideo = item.category === 'video';
        var url = api.esc(item.url);
        row.innerHTML =
          (isVideo ? '<video src="' + url + '#t=1" muted preload="metadata"></video>' : '<img src="' + url + '" alt="">') +
          '<div class="info"><strong>' + api.esc(item.caption || 'Untitled') + '</strong><br>' +
          '<span style="font-size:0.8rem; color:var(--ink-soft);">' + api.esc(item.category) + ' &middot; ' + new Date(item.uploaded).toLocaleDateString() + '</span></div>' +
          '<button class="delete-btn" type="button" data-key="' + api.esc(item.key) + '">Delete</button>';
        manageList.appendChild(row);
      });
      manageList.querySelectorAll('.delete-btn').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          if (!api.hasKey()) { alert('Save your admin key first (the box at the top).'); return; }
          if (!confirm('Remove this item from the gallery?')) return;
          btn.disabled = true;
          btn.textContent = 'Removing…';
          try {
            await api.remove(btn.getAttribute('data-key'));
            loadManageList();
          } catch (e) {
            btn.textContent = e.message === 'BAD_KEY' ? 'Wrong key' : 'Failed, try again';
            btn.disabled = false;
          }
        });
      });
    } catch (e) {
      manageList.innerHTML = '<p style="color:var(--ink-soft);">Could not load the gallery list.</p>';
    }
  }

  loadManageList();
});

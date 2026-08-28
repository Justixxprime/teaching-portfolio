/* ============================================================
   GALLERY ADMIN — upload flow + manage/delete list. Only runs
   on gallery-admin.html (behind the same password gate as the
   private portfolio).
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  const drop = document.getElementById('upload-drop');
  const fileInput = document.getElementById('file-input');
  const uploadForm = document.getElementById('upload-form');
  const captionInput = document.getElementById('caption-input');
  const categorySelect = document.getElementById('category-input');
  const uploadBtn = document.getElementById('upload-btn');
  const progressBar = document.getElementById('progress-bar');
  const progressFill = document.getElementById('progress-fill');
  const uploadStatus = document.getElementById('upload-status');
  const manageList = document.getElementById('manage-list');

  if (!drop) return; // not on this page

  if (!window.GalleryAPI.configured()) {
    manageList.innerHTML = '<p style="color:var(--ink-soft);">The gallery storage isn\'t connected yet — see docs/r2-setup-guide-for-justice.md.</p>';
  }

  let selectedFile = null;

  drop.addEventListener('click', () => fileInput.click());
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('drag-over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) handleFile(fileInput.files[0]);
  });

  function handleFile(file) {
    selectedFile = file;
    uploadForm.style.display = 'block';
    categorySelect.value = file.type.startsWith('video/') ? 'video' : 'photo';
    categorySelect.dispatchEvent(new Event('change'));
    drop.querySelector('p').textContent = `Selected: ${file.name}`;
  }

  uploadBtn.addEventListener('click', async () => {
    if (!selectedFile) return;
    uploadBtn.disabled = true;
    progressBar.style.display = 'block';
    uploadStatus.className = 'form-status show';
    uploadStatus.textContent = 'Uploading…';

    try {
      await window.GalleryAPI.upload(
        selectedFile,
        captionInput.value,
        categorySelect.value,
        (pct) => { progressFill.style.width = pct + '%'; }
      );
      uploadStatus.className = 'form-status success show';
      uploadStatus.textContent = 'Uploaded! It now appears in the gallery.';
      captionInput.value = '';
      selectedFile = null;
      fileInput.value = '';
      uploadForm.style.display = 'none';
      drop.querySelector('p').textContent = 'Tap to choose a photo or video';
      loadManageList();
    } catch (e) {
      uploadStatus.className = 'form-status error show';
      uploadStatus.textContent = 'Upload failed. Please try again.';
    } finally {
      uploadBtn.disabled = false;
      progressBar.style.display = 'none';
      progressFill.style.width = '0%';
    }
  });

  async function loadManageList() {
    if (!window.GalleryAPI.configured()) return;
    try {
      const items = await window.GalleryAPI.list();
      if (!items.length) {
        manageList.innerHTML = '<p style="color:var(--ink-soft);">Nothing uploaded yet.</p>';
        return;
      }
      items.sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));
      manageList.innerHTML = '';
      items.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'manage-row';
        const isVideo = item.category === 'video';
        row.innerHTML = `
          ${isVideo ? `<video src="${item.url}" muted></video>` : `<img src="${item.url}" alt="">`}
          <div class="info">
            <strong>${item.caption || 'Untitled'}</strong><br>
            <span style="font-size:0.8rem; color:var(--ink-soft);">${item.category} &middot; ${new Date(item.uploaded).toLocaleDateString()}</span>
          </div>
          <button class="delete-btn" data-key="${item.key}">Delete</button>
        `;
        manageList.appendChild(row);
      });
      manageList.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('Remove this item from the gallery?')) return;
          btn.disabled = true;
          btn.textContent = 'Removing…';
          try {
            await window.GalleryAPI.remove(btn.getAttribute('data-key'));
            loadManageList();
          } catch (e) {
            btn.textContent = 'Failed, try again';
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

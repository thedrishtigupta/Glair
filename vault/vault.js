const API = 'http://localhost:3000';

let state = {
  folders: [],
  currentFolderId: null,
  editingNoteId: null,
  editingFolderId: null,
};

const EMOJIS = ['📝','💡','🎬','🎁','💎','📚','🌿','🔮','🎯','💌','🌙','✨','🧠','🎵','💸','🌊','🔑','🎨','🏆','🦋','🪐','🔥','🌺','💭','📌','🧲','🪄','🎪','🌟','🎲','🦚','🌸'];
const GRADIENTS = ['grad-0','grad-1','grad-2','grad-3','grad-4','grad-5','grad-6','grad-7'];
let selectedEmoji = EMOJIS[0];

// ── API ──
async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── INIT ──
async function init() {
  buildEmojiPicker('emoji-picker');
  await loadFolders();
}

async function loadFolders() {
  try {
    state.folders = await api('GET', '/folders');
    renderFolders();
  } catch (e) { console.error('Failed to load folders:', e); }
}

// ── SCREENS ──
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── EMOJI PICKER ──
function buildEmojiPicker(containerId, current) {
  const el = document.getElementById(containerId);
  el.innerHTML = EMOJIS.map((e, i) =>
    `<div class="emoji-opt${(current ? e === current : i === 0) ? ' selected' : ''}" onclick="selectEmoji('${e}', this, '${containerId}')">${e}</div>`
  ).join('');
  if (!current) selectedEmoji = EMOJIS[0];
  else selectedEmoji = current;
}

function selectEmoji(emoji, el, containerId) {
  document.querySelectorAll(`#${containerId} .emoji-opt`).forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  selectedEmoji = emoji;
}

// ── RENDER FOLDERS ──
function renderFolders() {
  const grid = document.getElementById('folders-grid');
  grid.innerHTML = '';

  state.folders.forEach((f) => {
    const card = document.createElement('div');
    card.className = 'folder-card';
    card.innerHTML = `
      <div class="folder-thumb ${f.gradient}" onclick="openFolder('${f._id}')">
        <div class="folder-thumb-emoji">${f.emoji}</div>
      </div>
      <div class="folder-meta">
        <span class="folder-icon">⌘</span>
        <span class="folder-name" onclick="openFolder('${f._id}')">${f.name}</span>
        <span class="folder-count">${f.notes.length}</span>
        <div class="folder-menu-wrap">
          <button class="folder-menu-btn" onclick="toggleFolderMenu(event, '${f._id}')">⋯</button>
          <div class="folder-menu" id="menu-${f._id}">
            <div class="folder-menu-item" onclick="openEditFolderModal('${f._id}')">✏️ Rename</div>
            <div class="folder-menu-item danger" onclick="confirmDeleteFolder('${f._id}')">🗑 Delete</div>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  const newCard = document.createElement('div');
  newCard.className = 'folder-card new-folder';
  newCard.onclick = openNewFolderModal;
  newCard.innerHTML = `<div class="new-folder-inner"><div class="new-folder-plus">+</div><div class="new-folder-label">New folder</div></div>`;
  grid.appendChild(newCard);
}

// close menus on outside click
document.addEventListener('click', () => {
  document.querySelectorAll('.folder-menu.open').forEach(m => m.classList.remove('open'));
});

function toggleFolderMenu(e, folderId) {
  e.stopPropagation();
  document.querySelectorAll('.folder-menu.open').forEach(m => m.classList.remove('open'));
  const menu = document.getElementById(`menu-${folderId}`);
  menu.classList.toggle('open');
}

// ── FOLDER CRUD ──
function currentFolder() {
  return state.folders.find(f => f._id === state.currentFolderId);
}

async function openFolder(folderId) {
  state.currentFolderId = folderId;
  const folder = currentFolder();
  document.getElementById('folder-view-emoji').textContent = folder.emoji;
  document.getElementById('folder-view-title').textContent = folder.name;
  renderNotes();
  showScreen('screen-folder');
}

function openNewFolderModal() {
  state.editingFolderId = null;
  document.getElementById('modal-folder-title').textContent = 'New folder';
  document.getElementById('folder-name-input').value = '';
  buildEmojiPicker('emoji-picker', null);
  document.getElementById('modal-folder').classList.add('open');
  setTimeout(() => document.getElementById('folder-name-input').focus(), 100);
}

function openEditFolderModal(folderId) {
  document.querySelectorAll('.folder-menu.open').forEach(m => m.classList.remove('open'));
  state.editingFolderId = folderId;
  const folder = state.folders.find(f => f._id === folderId);
  document.getElementById('modal-folder-title').textContent = 'Edit folder';
  document.getElementById('folder-name-input').value = folder.name;
  buildEmojiPicker('emoji-picker', folder.emoji);
  document.getElementById('modal-folder').classList.add('open');
  setTimeout(() => document.getElementById('folder-name-input').focus(), 100);
}

async function saveFolder() {
  const name = document.getElementById('folder-name-input').value.trim();
  if (!name) return;
  try {
    if (state.editingFolderId) {
      // Edit existing
      const folder = state.folders.find(f => f._id === state.editingFolderId);
      const updated = await api('PUT', `/folders/${state.editingFolderId}`, { name, emoji: selectedEmoji, gradient: folder.gradient });
      const idx = state.folders.findIndex(f => f._id === state.editingFolderId);
      state.folders[idx] = { ...state.folders[idx], ...updated };
    } else {
      // Create new
      const gradient = GRADIENTS[state.folders.length % GRADIENTS.length];
      const newFolder = await api('POST', '/folders', { name, emoji: selectedEmoji, gradient });
      state.folders.unshift(newFolder);
    }
    renderFolders();
    closeFolderModal();
  } catch (e) { console.error('Failed to save folder:', e); }
}

async function confirmDeleteFolder(folderId) {
  document.querySelectorAll('.folder-menu.open').forEach(m => m.classList.remove('open'));
  const folder = state.folders.find(f => f._id === folderId);
  document.getElementById('confirm-msg').textContent = `Delete "${folder.name}" and all its notes?`;
  document.getElementById('confirm-action').onclick = () => deleteFolder(folderId);
  document.getElementById('modal-confirm').classList.add('open');
}

async function deleteFolder(folderId) {
  try {
    await api('DELETE', `/folders/${folderId}`);
    state.folders = state.folders.filter(f => f._id !== folderId);
    renderFolders();
    closeConfirmModal();
  } catch (e) { console.error('Failed to delete folder:', e); }
}

function closeFolderModal() {
  document.getElementById('modal-folder').classList.remove('open');
  state.editingFolderId = null;
}

// ── NOTES ──
function renderNotes() {
  const folder = currentFolder();
  const list = document.getElementById('notes-list');
  const count = document.getElementById('folder-view-count');
  const sorted = [...folder.notes].sort((a, b) => b.createdAt - a.createdAt);
  count.textContent = `${sorted.length} note${sorted.length !== 1 ? 's' : ''}`;

  if (sorted.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${folder.emoji}</div><div class="empty-state-text">No notes yet. Add your first one.</div></div>`;
    return;
  }

  list.innerHTML = sorted.map((note) => {
    const preview = note.body ? stripHtml(note.body).slice(0, 120) : '';
    return `
    <div class="note-card" onclick="openNote('${note._id}')">
      <div class="note-content">
        <div class="note-title">${note.title || 'Untitled'}</div>
        ${preview ? `<div class="note-preview">${preview}</div>` : ''}
        <div class="note-date">${formatDate(note.createdAt)}</div>
      </div>
      <div class="note-actions">
        <span class="note-action-btn" onclick="openNote('${note._id}'); event.stopPropagation()">✏️</span>
        <span class="note-action-btn danger" onclick="confirmDeleteNote(event, '${note._id}')">🗑</span>
      </div>
    </div>`;
  }).join('');
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function formatDate(ts) {
  const d = new Date(ts), now = new Date(), diff = now - d;
  if (diff < 86400000) return 'Today';
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function goHome() {
  state.currentFolderId = null;
  renderFolders();
  showScreen('screen-home');
}

// ── NOTE EDITOR ──
function openNewNote() {
  state.editingNoteId = null;
  const folder = currentFolder();
  document.getElementById('editor-folder-label').textContent = folder.emoji + ' ' + folder.name;
  document.getElementById('editor-mode-label').textContent = 'new note';
  document.getElementById('editor-title').value = '';
  document.getElementById('editor-body').innerHTML = '';
  showScreen('screen-editor');
  document.getElementById('editor-title').focus();
}

function openNote(noteId) {
  state.editingNoteId = noteId;
  const folder = currentFolder();
  const note = folder.notes.find(n => n._id === noteId);
  document.getElementById('editor-folder-label').textContent = folder.emoji + ' ' + folder.name;
  document.getElementById('editor-mode-label').textContent = 'editing';
  document.getElementById('editor-title').value = note.title;
  document.getElementById('editor-body').innerHTML = note.body || '';
  showScreen('screen-editor');
}

async function saveNote() {
  const title = document.getElementById('editor-title').value.trim();
  const body  = document.getElementById('editor-body').innerHTML.trim();
  if (!title && !stripHtml(body)) { goToFolder(); return; }
  try {
    let updatedFolder;
    if (state.editingNoteId) {
      updatedFolder = await api('PUT', `/folders/${state.currentFolderId}/notes/${state.editingNoteId}`, { title, body });
    } else {
      updatedFolder = await api('POST', `/folders/${state.currentFolderId}/notes`, { title, body });
    }
    const idx = state.folders.findIndex(f => f._id === state.currentFolderId);
    state.folders[idx] = updatedFolder;
    goToFolder();
  } catch (e) { console.error('Failed to save note:', e); }
}

function goToFolder() {
  renderNotes();
  showScreen('screen-folder');
}

function confirmDeleteNote(e, noteId) {
  e.stopPropagation();
  const folder = currentFolder();
  const note = folder.notes.find(n => n._id === noteId);
  document.getElementById('confirm-msg').textContent = `Delete "${note.title || 'this note'}"?`;
  document.getElementById('confirm-action').onclick = () => deleteNote(noteId);
  document.getElementById('modal-confirm').classList.add('open');
}

async function deleteNote(noteId) {
  try {
    const updatedFolder = await api('DELETE', `/folders/${state.currentFolderId}/notes/${noteId}`);
    const idx = state.folders.findIndex(f => f._id === state.currentFolderId);
    state.folders[idx] = updatedFolder;
    closeConfirmModal();
    renderNotes();
  } catch (e) { console.error('Failed to delete note:', e); }
}

// ── RICH TEXT TOOLBAR ──
function format(cmd, value) {
  document.getElementById('editor-body').focus();
  document.execCommand(cmd, false, value || null);
  updateToolbarState();
}

function insertList(type) {
  document.getElementById('editor-body').focus();
  document.execCommand(type === 'ol' ? 'insertOrderedList' : 'insertUnorderedList', false, null);
  updateToolbarState();
}

function updateToolbarState() {
  const cmds = ['bold','italic','underline'];
  cmds.forEach(cmd => {
    const btn = document.querySelector(`.toolbar-btn[data-cmd="${cmd}"]`);
    if (btn) btn.classList.toggle('active', document.queryCommandState(cmd));
  });
}

document.addEventListener('selectionchange', updateToolbarState);

// ── MODALS ──
function closeModal(e) {
  if (e.target.classList.contains('modal-overlay')) {
    document.getElementById('modal-folder').classList.remove('open');
    document.getElementById('modal-confirm').classList.remove('open');
  }
}

function closeConfirmModal() {
  document.getElementById('modal-confirm').classList.remove('open');
}

// ── SEARCH ──
function handleSearch(query) {
  const resultsEl = document.getElementById('search-results');
  if (!query.trim()) { resultsEl.classList.remove('visible'); resultsEl.innerHTML = ''; return; }
  const q = query.toLowerCase();
  const results = [];
  state.folders.forEach((folder) => {
    if (folder.name.toLowerCase().includes(q))
      results.push({ type: 'folder', folderId: folder._id, folderName: folder.name, emoji: folder.emoji });
    folder.notes.forEach((note) => {
      if (note.title.toLowerCase().includes(q) || stripHtml(note.body).toLowerCase().includes(q))
        results.push({ type: 'note', folderId: folder._id, noteId: note._id, folderName: folder.name, title: note.title, emoji: folder.emoji });
    });
  });

  if (results.length === 0) {
    resultsEl.innerHTML = `<div class="search-result-item"><div class="result-title" style="color:var(--muted)">No results found</div></div>`;
  } else {
    resultsEl.innerHTML = results.slice(0, 8).map((r, i) => `
      <div class="search-result-item" onclick="handleSearchResult(${i})">
        <span style="font-size:18px">${r.emoji}</span>
        <div>
          <div class="result-folder">${r.folderName}</div>
          <div class="result-title">${r.type === 'note' ? r.title : 'Open folder →'}</div>
        </div>
      </div>`).join('');
    resultsEl._results = results;
  }
  resultsEl.classList.add('visible');
}

function handleSearchResult(i) {
  const resultsEl = document.getElementById('search-results');
  const r = resultsEl._results[i];
  if (!r) return;
  resultsEl.classList.remove('visible');
  document.getElementById('search-input').value = '';
  openFolder(r.folderId);
  if (r.type === 'note') setTimeout(() => openNote(r.noteId), 50);
}

// ── KEYBOARD ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('modal-folder').classList.remove('open');
    document.getElementById('modal-confirm').classList.remove('open');
    document.getElementById('search-results').classList.remove('visible');
  }
  if (e.key === 'Enter' && document.getElementById('modal-folder').classList.contains('open')) {
    saveFolder();
  }
});

init();

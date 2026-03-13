// ── CONFIG ──
const API = 'http://localhost:3000';

// ── STATE ──
let state = {
  folders: [],              // live data from DB, each has ._id from Mongo
  currentFolderId: null,    // Mongo _id of open folder
  editingNoteId: null,      // Mongo _id of note being edited (null = new)
};

const EMOJIS = ['📝','💡','🎬','🎁','💎','📚','🌿','🔮','🎯','💌','🌙','✨','🧠','🎵','💸','🌊','🔑','🎨','🏆','🦋','🪐','🔥','🌺','💭','📌','🧲','🪄','🎪','🌟','🎲','🦚','🌸'];
const GRADIENTS = ['grad-0','grad-1','grad-2','grad-3','grad-4','grad-5','grad-6','grad-7'];
let selectedEmoji = EMOJIS[0];

// ── API HELPERS ──
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
  buildEmojiPicker();
  await loadFolders();
}

async function loadFolders() {
  try {
    state.folders = await api('GET', '/folders');
    renderFolders();
  } catch (e) {
    console.error('Failed to load folders:', e);
  }
}

// ── SCREENS ──
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── EMOJI PICKER ──
function buildEmojiPicker() {
  const el = document.getElementById('emoji-picker');
  el.innerHTML = EMOJIS.map((e, i) =>
    `<div class="emoji-opt${i===0?' selected':''}" onclick="selectEmoji('${e}', this)">${e}</div>`
  ).join('');
  selectedEmoji = EMOJIS[0];
}

function selectEmoji(emoji, el) {
  document.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected'));
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
    card.onclick = () => openFolder(f._id);
    card.innerHTML = `
      <div class="folder-thumb ${f.gradient}">
        <div class="folder-thumb-emoji">${f.emoji}</div>
      </div>
      <div class="folder-meta">
        <span class="folder-icon">⌘</span>
        <span class="folder-name">${f.name}</span>
        <span class="folder-count">${f.notes.length}</span>
      </div>
    `;
    grid.appendChild(card);
  });

  // New folder card
  const newCard = document.createElement('div');
  newCard.className = 'folder-card new-folder';
  newCard.onclick = openNewFolderModal;
  newCard.innerHTML = `<div class="new-folder-inner"><div class="new-folder-plus">+</div><div class="new-folder-label">New folder</div></div>`;
  grid.appendChild(newCard);
}

// ── FOLDER VIEW ──
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

  list.innerHTML = sorted.map((note) => `
    <div class="note-card" onclick="openNote('${note._id}')">
      <div class="note-content">
        <div class="note-title">${note.title || 'Untitled'}</div>
        ${note.body ? `<div class="note-preview">${note.body}</div>` : ''}
        <div class="note-date">${formatDate(note.createdAt)}</div>
      </div>
      <span class="note-delete" onclick="deleteNote(event, '${note._id}')">✕</span>
    </div>
  `).join('');
}

function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
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
  document.getElementById('editor-body').value = '';
  showScreen('screen-editor');
}

function openNote(noteId) {
  state.editingNoteId = noteId;
  const folder = currentFolder();
  const note = folder.notes.find(n => n._id === noteId);
  document.getElementById('editor-folder-label').textContent = folder.emoji + ' ' + folder.name;
  document.getElementById('editor-mode-label').textContent = 'editing';
  document.getElementById('editor-title').value = note.title;
  document.getElementById('editor-body').value = note.body;
  showScreen('screen-editor');
}

async function saveNote() {
  const title = document.getElementById('editor-title').value.trim();
  const body  = document.getElementById('editor-body').value.trim();
  if (!title && !body) { goToFolder(); return; }

  try {
    let updatedFolder;
    if (state.editingNoteId) {
      updatedFolder = await api('PUT', `/folders/${state.currentFolderId}/notes/${state.editingNoteId}`, { title, body });
    } else {
      updatedFolder = await api('POST', `/folders/${state.currentFolderId}/notes`, { title, body });
    }
    // Update local state
    const idx = state.folders.findIndex(f => f._id === state.currentFolderId);
    state.folders[idx] = updatedFolder;
    goToFolder();
  } catch (e) {
    console.error('Failed to save note:', e);
  }
}

function goToFolder() {
  renderNotes();
  showScreen('screen-folder');
}

async function deleteNote(e, noteId) {
  e.stopPropagation();
  try {
    const updatedFolder = await api('DELETE', `/folders/${state.currentFolderId}/notes/${noteId}`);
    const idx = state.folders.findIndex(f => f._id === state.currentFolderId);
    state.folders[idx] = updatedFolder;
    renderNotes();
  } catch (e) {
    console.error('Failed to delete note:', e);
  }
}

// ── NEW FOLDER ──
function openNewFolderModal() {
  document.getElementById('new-folder-name').value = '';
  buildEmojiPicker();
  document.getElementById('modal-new-folder').classList.add('open');
  setTimeout(() => document.getElementById('new-folder-name').focus(), 100);
}

async function createFolder() {
  const name = document.getElementById('new-folder-name').value.trim();
  if (!name) return;
  try {
    const gradient = GRADIENTS[state.folders.length % GRADIENTS.length];
    const newFolder = await api('POST', '/folders', { name, emoji: selectedEmoji, gradient });
    state.folders.unshift(newFolder);
    renderFolders();
    document.getElementById('modal-new-folder').classList.remove('open');
  } catch (e) {
    console.error('Failed to create folder:', e);
  }
}

function closeModal(e) {
  if (e.target.classList.contains('modal-overlay')) {
    document.getElementById('modal-new-folder').classList.remove('open');
  }
}

// ── SEARCH (client-side, data already in memory) ──
function handleSearch(query) {
  const resultsEl = document.getElementById('search-results');
  if (!query.trim()) { resultsEl.classList.remove('visible'); resultsEl.innerHTML = ''; return; }

  const q = query.toLowerCase();
  const results = [];

  state.folders.forEach((folder) => {
    if (folder.name.toLowerCase().includes(q)) {
      results.push({ type: 'folder', folderId: folder._id, folderName: folder.name, emoji: folder.emoji });
    }
    folder.notes.forEach((note) => {
      if (note.title.toLowerCase().includes(q) || note.body.toLowerCase().includes(q)) {
        results.push({ type: 'note', folderId: folder._id, noteId: note._id, folderName: folder.name, title: note.title, emoji: folder.emoji });
      }
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
      </div>
    `).join('');
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
  if (r.type === 'note') {
    setTimeout(() => openNote(r.noteId), 50);
  }
}

// ── KEYBOARD ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('modal-new-folder').classList.remove('open');
    document.getElementById('search-results').classList.remove('visible');
  }
  if (e.key === 'Enter' && document.getElementById('modal-new-folder').classList.contains('open')) {
    createFolder();
  }
});

init();

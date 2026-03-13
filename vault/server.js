require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Folder = require('./models/Folder');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Folders
app.get('/folders', async (req, res) => {
  try { res.json(await Folder.find().sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/folders', async (req, res) => {
  try {
    const { name, emoji, gradient } = req.body;
    res.json(await Folder.create({ name, emoji, gradient, notes: [] }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/folders/:id', async (req, res) => {
  try {
    const { name, emoji, gradient } = req.body;
    res.json(await Folder.findByIdAndUpdate(req.params.id, { name, emoji, gradient }, { returnDocument: 'after' }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/folders/:id', async (req, res) => {
  try { await Folder.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Notes
app.post('/folders/:id/notes', async (req, res) => {
  try {
    const { title, body } = req.body;
    const folder = await Folder.findById(req.params.id);
    folder.notes.push({ title, body, createdAt: Date.now() });
    await folder.save();
    res.json(folder);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/folders/:id/notes/:noteId', async (req, res) => {
  try {
    const { title, body } = req.body;
    const folder = await Folder.findById(req.params.id);
    const note = folder.notes.id(req.params.noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    note.title = title;
    note.body = body;
    await folder.save();
    res.json(folder);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/folders/:id/notes/:noteId', async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    folder.notes.pull({ _id: req.params.noteId });
    await folder.save();
    res.json(folder);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Vault server running on http://localhost:${PORT}`));

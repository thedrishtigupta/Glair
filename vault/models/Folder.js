const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  body:  { type: String, default: '' },
  createdAt: { type: Number, default: () => Date.now() },
});

const FolderSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  emoji:    { type: String, default: '📝' },
  gradient: { type: String, default: 'grad-0' },
  notes:    [NoteSchema],
}, { timestamps: true });

module.exports = mongoose.model('Folder', FolderSchema);

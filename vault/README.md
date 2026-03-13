# vault.

A minimal personal note-taking app organised into custom folders. Built with vanilla HTML/CSS/JS on the frontend and Node.js + Express + MongoDB on the backend.

---

## Features

- **Folders** — create custom categories with a name and emoji
- **Notes** — add, edit, and delete notes inside any folder, sorted latest-first
- **Rich text editor** — bold, italic, underline, numbered lists, bullet lists, headings
- **Search** — live keyword search across all folders and notes
- **Full CRUD** — create, rename, and delete folders; create, edit, and delete notes
- **Persistent storage** — all data lives in MongoDB

---

## Project Structure

```
vault/
├── server.js           # Express backend
├── models/
│   └── Folder.js       # Mongoose schema
├── vault.html          # App shell
├── vault.css           # All styles
├── vault.js            # All frontend logic
├── .env                # Environment variables (not committed)
└── README.md
```

---

## Prerequisites

- [Node.js](https://nodejs.org) v18+
- A [MongoDB Atlas](https://atlas.mongodb.com) account (free tier works fine)

---

## Setup

**1. Clone / download the project**

```bash
cd vault
```

**2. Install dependencies**

```bash
npm init -y
npm install express mongoose cors dotenv
```

**3. Configure environment**

Create a `.env` file in the root:

```
MONGO_URI=mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/vault?retryWrites=true&w=majority
PORT=3000
```

To get your `MONGO_URI`:
- Go to [atlas.mongodb.com](https://atlas.mongodb.com)
- Open your cluster → click **Connect** → **Drivers**
- Copy the connection string and replace `<username>` and `<password>`

**4. Start the server**

```bash
node server.js
```

You should see:
```
MongoDB connected
Vault server running on http://localhost:3000
```

**5. Open the app**

Open `vault.html` directly in your browser, or use VS Code Live Server.

> The server just needs to be running in the background — the frontend is a plain HTML file served separately.

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/folders` | Get all folders |
| POST | `/folders` | Create a folder |
| PUT | `/folders/:id` | Rename / edit a folder |
| DELETE | `/folders/:id` | Delete a folder and all its notes |
| POST | `/folders/:id/notes` | Add a note to a folder |
| PUT | `/folders/:id/notes/:noteId` | Edit a note |
| DELETE | `/folders/:id/notes/:noteId` | Delete a note |

---

## Usage

- **Create a folder** — click the `+ New folder` card, enter a name and pick an emoji
- **Rename or delete a folder** — hover a folder card and click `⋯`
- **Add a note** — open a folder and click `+ new note`
- **Edit a note** — click any note card, or click the ✏️ icon on hover
- **Delete a note** — click the 🗑 icon on hover, confirm in the dialog
- **Format text** — use the toolbar in the note editor (bold, italic, lists, etc.)
- **Search** — type in the search bar on the home screen to search across everything

---

## Notes

- The `.env` file is never committed — keep your `MONGO_URI` private
- Notes are stored as HTML strings to preserve rich text formatting
- Search runs client-side on data already in memory after the initial load

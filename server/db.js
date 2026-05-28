// server/db.js — SQLite via sql.js (pure WASM, no native compilation)
import { createRequire } from 'module';
import { join, dirname }  from 'path';
import { fileURLToPath }  from 'url';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

const DB_DIR  = join(__dirname, '..', 'db');
const DB_FILE = join(DB_DIR, 'thermal.db');

mkdirSync(DB_DIR, { recursive: true });

// ── Init sql.js ───────────────────────────────────────────────
const initSqlJs = require('sql.js');
const SQL = await initSqlJs();

let db;
if (existsSync(DB_FILE)) {
  const data = readFileSync(DB_FILE);
  db = new SQL.Database(data);
} else {
  db = new SQL.Database();
}

// Persist on exit helper
function persist() {
  const data = db.export();
  writeFileSync(DB_FILE, Buffer.from(data));
}
process.on('exit',   persist);
process.on('SIGINT', () => { persist(); process.exit(0); });
process.on('SIGTERM',() => { persist(); process.exit(0); });

// Auto-persist every 30 seconds
setInterval(persist, 30_000).unref();

// ── Convenience wrappers ──────────────────────────────────────
// sql.js API is different from better-sqlite3.
// We expose run / get / all to match the same interface used in routes.

function run(sql, params = []) {
  db.run(sql, params);
  persist();
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}

function all(sql, params = []) {
  const stmt   = db.prepare(sql);
  const rows   = [];
  stmt.bind(params);
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function prepare(sql) {
  // Lightweight prepared-statement shim matching better-sqlite3 surface
  return {
    run:  (...params) => { run(sql, params.flat()); return { changes: db.getRowsModified() }; },
    get:  (...params) => get(sql, params.flat()),
    all:  (...params) => all(sql, params.flat()),
    free: () => {},
  };
}

function exec(sql) { db.run(sql); persist(); }

function transaction(fn) {
  return (args) => {
    run('BEGIN');
    try { fn(args); run('COMMIT'); }
    catch (e) { run('ROLLBACK'); throw e; }
  };
}

function pragma(str) { db.run('PRAGMA ' + str); }

// Export an object that looks like better-sqlite3 DB instance
const dbProxy = { run, get, all, prepare, exec, transaction, pragma };

// ── Schema ────────────────────────────────────────────────────
db.run(`CREATE TABLE IF NOT EXISTS printers (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  device_name       TEXT NOT NULL,
  device_id         TEXT NOT NULL DEFAULT '',
  connection_type   TEXT NOT NULL DEFAULT 'bluetooth',
  paper_width       INTEGER NOT NULL DEFAULT 80,
  default_paper_size_id TEXT,
  dpi               INTEGER NOT NULL DEFAULT 203,
  is_default        INTEGER NOT NULL DEFAULT 0,
  last_connected_at TEXT,
  created_at        TEXT NOT NULL
)`);

db.run(`CREATE TABLE IF NOT EXISTS paper_sizes (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  width       REAL NOT NULL,
  height      REAL NOT NULL DEFAULT 0,
  gap         REAL NOT NULL DEFAULT 0,
  is_built_in INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
)`);

db.run(`CREATE TABLE IF NOT EXISTS settings (
  id                    TEXT PRIMARY KEY DEFAULT 'singleton',
  default_printer_id    TEXT,
  default_paper_size_id TEXT,
  print_delay_ms        INTEGER NOT NULL DEFAULT 300,
  theme                 TEXT NOT NULL DEFAULT 'light',
  updated_at            TEXT NOT NULL
)`);

db.run(`CREATE TABLE IF NOT EXISTS print_jobs (
  id              TEXT PRIMARY KEY,
  printer_id      TEXT,
  printer_name    TEXT,
  paper_size_id   TEXT,
  paper_size_name TEXT,
  file_name       TEXT,
  total_pages     INTEGER NOT NULL DEFAULT 0,
  success_pages   INTEGER NOT NULL DEFAULT 0,
  failed_pages    INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending',
  started_at      TEXT NOT NULL,
  finished_at     TEXT
)`);

// ── Seed built-in paper sizes ─────────────────────────────────
const existingPapers = get('SELECT COUNT(*) AS cnt FROM paper_sizes WHERE is_built_in = 1');
if (!existingPapers || existingPapers.cnt === 0) {
  const now = new Date().toISOString();
  const builtIn = [
    ['a6resi',  'A6 Resi',    100,  150, 0],
    ['a6std',   'A6 Standar', 105,  148, 0],
    ['80x100',  '80×100mm',   80,   100, 2],
    ['78x100',  '78×100mm',   78,   100, 2],
    ['102x127', '102×127mm',  102,  127, 2],
    ['80x60',   '80×60mm',    80,   60,  2],
    ['80x40',   '80×40mm',    80,   40,  2],
    ['58x40',   '58×40mm',    58,   40,  1],
    ['40x30',   '40×30mm',    40,   30,  1],
    ['80roll',  '80mm Roll',  80,   0,   0],
    ['58roll',  '58mm Roll',  58,   0,   0],
  ];
  for (const [id, name, width, height, gap] of builtIn) {
    db.run(
      'INSERT OR IGNORE INTO paper_sizes (id, name, width, height, gap, is_built_in, created_at) VALUES (?,?,?,?,?,1,?)',
      [id, name, width, height, gap, now]
    );
  }
  persist();
  console.log('✅ Built-in paper sizes seeded');
}

// ── Seed default settings ─────────────────────────────────────
const existingSettings = get("SELECT COUNT(*) AS cnt FROM settings WHERE id = 'singleton'");
if (!existingSettings || existingSettings.cnt === 0) {
  run(
    "INSERT INTO settings (id, default_paper_size_id, print_delay_ms, theme, updated_at) VALUES ('singleton','a6resi',300,'light',?)",
    [new Date().toISOString()]
  );
  console.log('✅ Default settings seeded');
}

export default dbProxy;

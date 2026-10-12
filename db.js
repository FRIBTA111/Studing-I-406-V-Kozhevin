import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, "conf.db"));
//ТАБЛО
db.exec(`
    CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    password  TEXT NOT NULL,
    fio TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
    )
    `);
const count = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;

if (count === 0) {
  const stmt = db.prepare(`
        INSERT INTO users (login, password, fio, phone, email)
        VALUES (?,?,?,?,?)
        `);
  stmt.run(
    "ivan",
    "demo",
    "Иванов Иван",
    "8(999)123-45-67",
    "ivanpochta@mail.ru",
  );
  stmt.run(
    "petr",
    "demo",
    "Петров Пётр",
    "8(900)123-45-67",
    "petrpochta@mail.ru",
  );
  stmt.run(
    "anna",
    "demo",
    "Сидорова Анна",
    "8(980)123-45-67",
    "annapochta@mail.ru",
  );
  console.log("Тестовые пользователи на проверку");
}
db.exec(`
    CREATE TABLE IF NOT EXISTS rooms(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    capacity INTEGER NOT NULL
    )
    `);
const room = db.prepare("SELECT COUNT(*) AS c FROM rooms").get().c;
if (room === 0) {
  const stat = db.prepare(`
        INSERT INTO rooms (name, type, capacity)
        VALUES (?,?,?)
        `);
  stat.run("Комната №1", "Открыта", "400 человек");
  stat.run("Комната №2", "Закрыта", "250 человек");
  stat.run("Комната №3", "На расмотрении", "550 человек");
  console.log("Тестовые комнаты на проверку");
}
db.exec(`
    CREATE TABLE IF NOT EXISTS requests(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    date_start TEXT NOT NULL,
    payment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT "Новая",
    review TEXT,
    created_at TEXT DEFAULT(datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
    )
    `);
const request = db.prepare("SELECT COUNT(*) AS c FROM requests").get().c;
if (request === 0) {
  const stot = db.prepare(`
        INSERT INTO requests (user_id, room_id, date_start, payment)
        VALUES (?,?,?,?)
        `);
  stot.run("1", "1", "07.10.2026", "СБП/Наличными");
  stot.run("1", "3", "21.11.2020", "Наличными");
  stot.run("2", "2", "15.06.2028", "СБП");
  console.log("Тестовая таблица-запрос на проверку");
}
db.exec(`
    CREATE TABLE IF NOT EXISTS reviewes(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    room_id INTEGER NOT NULL,
    review  TEXT,
    otziv INTEGER NOT NULL,
    created_at TEXT DEFAULT(datetime('now'))
    )
    `);
const reviewe = db.prepare("SELECT COUNT(*) AS c FROM reviewes").get().c;
if (reviewe === 0) {
  const stut = db.prepare(`
        INSERT INTO reviewes (login, room_id, review, otziv)
        VALUES (?,?,?,?)
        `);
  stut.run("kostya", "1", "Ещё не состоялось, но я уже не в терпении", "5");
  stut.run("damir", "3", "", "1");
  stut.run("nikita", "2", "Было так себе", "2");
  console.log("Тестовая таблица отзывов на проверку");
}
export default db;

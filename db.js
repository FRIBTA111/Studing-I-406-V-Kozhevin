import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { create } from "domain";
import bcrypt from "bcryptjs";

const hash = (pwd) => bcrypt.hashSync(pwd, 10);

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
    hash("demo"),
    "Иванов Иван",
    "8(999)123-45-67",
    "ivanpochta@mail.ru",
  );
  stmt.run(
    "petr",
    hash("demo"),
    "Петров Пётр",
    "8(900)123-45-67",
    "petrpochta@mail.ru",
  );
  stmt.run(
    "anna",
    hash("demo"),
    "Сидорова Анна",
    "8(980)123-45-67",
    "annapochta@mail.ru",
  );
  stmt.run(
    "Conf2027",
    hash("Demo77"),
    "Администратор",
    "8(999)000-00-00",
    "admin@conf.ru",
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
  stat.run("Комната №1", "Открыта", "400");
  stat.run("Комната №2", "Закрыта", "250");
  stat.run("Комната №3", "На расмотрении", "550");
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
class UserModel {
  constructor() {
    this.table = "users";
  }
  findById(id) {
    return db.prepare(`SELECT * FROM ${this.table} WHERE id=?`).get(id);
  }
  findByLogin(login) {
    return db.prepare(`SELECT * FROM ${this.table} WHERE login=?`).get(login);
  }
  findAll() {
    return db.prepare(`SELECT * FROM ${this.table}`).all();
  }
  count() {
    return db.prepare(`SELECT COUNT(*) as total FROM ${this.table}`).get()
      .total;
  }
  exist(login) {
    return db.prepare(`SELECT * FROM ${this.table} WHERE login=?`).get(login)
      ? true
      : false;
  }
  create({ login, password, fio, phone, email }) {
    const hash = bcrypt.hashSync(password, 10);
    const r = db
      .prepare(
        `
      INSERT INTO ${this.table}(login, password, fio, phone, email)
      VALUES (?,?,?,?,?)
      `,
      )
      .run(login, hash, fio, phone, email);
    return this.findById(r.lastInsertRowid);
  }
}
class RoomModel {
  constructor() {
    this.table = "rooms";
  }
  findById(id) {
    return db.prepare(`SELECT * FROM ${this.table} WHERE id=?`).get(id);
  }
  findByType(type) {
    return db.prepare(`SELECT * FROM ${this.table} WHERE type=?`).get(type);
  }
  findAll() {
    return db.prepare(`SELECT * FROM ${this.table}`).all();
  }
  count() {
    return db.prepare(`SELECT COUNT(*) as total FROM ${this.table}`).get()
      .total;
  }
}
class RequestModel {
  constructor() {
    this.table = "requests";
  }
  findById(id) {
    return db.prepare(`SELECT * FROM ${this.table} WHERE id=?`).get(id);
  }
  findByUser(user_id) {
    return db
      .prepare(
        `SELECT r.*, rm.name AS room_name FROM ${this.table} r 
        JOIN rooms rm ON r.room_id = rm.id WHERE r.user_id = ?`,
      )
      .all(user_id);
  }
  findAllDetailed() {
    return db
      .prepare(
        `SELECT r.*, u.fio AS user_fio, u.login AS user_login, u.phone AS user_phone, u.email AS user_email,
        rm.name AS room_name, rm.type AS room_type, rm.capacity AS room_capacity FROM ${this.table} r JOIN users u ON r.user_id = u.id JOIN rooms rm ON r.room_id = rm.id`,
      )
      .all();
  }
  count() {
    return db.prepare(`SELECT COUNT(*) as total FROM ${this.table}`).get()
      .total;
  }
  updateStatus(id, status) {
    return db
      .prepare(`UPDATE ${this.table} SET status = ? WHERE id = ?`)
      .run(status, id);
  }
  create({ userId, roomId, dateStart, payment }) {
    const r = db
      .prepare(
        `
      INSERT INTO ${this.table}(user_id,room_id,date_start, payment)
      VALUES (?,?,?,?)
      `,
      )
      .run(userId, roomId, dateStart, payment);
    return this.findById(r.lastInsertRowid);
  }
}

export const User = new UserModel();
export const Room = new RoomModel();
export const Request = new RequestModel();
export default db;

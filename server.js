import express from "express";
import db from "./db.js";
import { User } from "./db.js";
import { Room } from "./db.js";
import { Request } from "./db.js";

console.log("Пользователь с id=1:", User.findById(1));
console.log("Пользователь с логином ivan:", User.findByLogin("ivan"));
console.log("Все пользователи:", User.findAll());
console.log("Кол-во пользователей:", User.count());
console.log("Пользователь с логином petr:", User.exist("petr"));

console.log("Все комнаты:", Room.findAll());
console.log("Комната с id=1:", Room.findById(1));
console.log("Кол-во комнат:", Room.count());
console.log("Тип комнаты открыта:", Room.findByType("Открыта"));

console.log("Запрос с id=1:", Request.findById(1));
console.log("Запрос пользователя с id=1:", Request.findByUser(1));
console.log("Все запросы (JOIN):", Request.findAllDetailed());
console.log("Кол-во запросов:", Request.count());

const users = db.prepare("SELECT * FROM users").all();
console.log("Все пользователи:");
console.log(users);

const rooms = db.prepare("SELECT * FROM rooms").all();
console.log("Все комнаты:");
console.log(rooms);

const requests = db.prepare("SELECT * FROM requests").all();
console.log("Все данные:");
console.log(requests);

const reviewes = db.prepare("SELECT * FROM reviewes").all();
console.log("Все отзывы:");
console.log(reviewes);

const zhopa = express();
const PORT = 3000;
zhopa.use(express.urlencoded({ extended: true }));
zhopa.get("/", (req, res) => {
  res.send(`ГОС.КОНФЕРЕНЦИИ.РФ<br><a href='/hayou'>Чикиряупау</a>`);
});
zhopa.get("/hayou", (req, res) => {
  res.send(`<a href='/'>наЗАД</a><br><a href='/register'>Регистр</a>`);
});
zhopa.get("/register", (req, res) => {
  res.render("register", {
    title: "регистрация",
    errors: 0,
  });
});
zhopa.get("/login", (req, res) => {
  res.render("login", {
    title: "Мои заявки",
    user: { fio: "Иванов Иван" },
    requests: [
      { room_name: "Пресс-конгресс-холл", status: "Новая" },
      { room_name: "Аудитория №2", status: "Завершено" },
    ],
  });
});
zhopa.post("/register", (req, res) => {
  res.send(`Пользователь ${req.body.Login} Зарегистрирован в системе
        <br>
        Информация пользователя:
        <br>
        ФИО:${req.body.LastName} ${req.body.FirstName} ${req.body.FatherName}
        <br>
        Логин:${req.body.Login}
        <br>
        Пароль:${req.body.Password}
        <br>
        Почта:${req.body.Email}
        <br>
        Телефон:${req.body.Tel}
        `);
});
zhopa.listen(PORT, () => {
  console.log(`Сервер:http://localhost:${PORT}`);
});
zhopa.set("view engine", "ejs");
zhopa.set("views", "./views");

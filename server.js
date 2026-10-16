import express from "express";
import { fileURLToPath } from "url";
import { dirname,join } from "path";
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const zhopa = express();
const PORT = 3000;
zhopa.use(express.urlencoded({ extended: true }));
zhopa.set("view engine", "ejs");
zhopa.set("views", join(__dirname, "views"));
zhopa.get("/", (req, res) => {
  res.send(`ГОС.КОНФЕРЕНЦИИ.РФ<br><a href='/hayou'>Чикиряупау</a>`);
});
zhopa.get("/hayou", (req, res) => {
  res.send(`Сайт проведения Всероссийских Общенаправленных Конференций<br>
            <a href='/'>Назад</a><br>
            <a href='/register'>Регистрация</a>`);
});
zhopa.get("/register", (req, res) => {
  res.render("register", {
    title: "регистрация",
    errors: [],
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
zhopa.get("/login", (req, res) => {
  res.render("login", {
    title: "Авторизация",
    errors: [],
  });
});
zhopa.post("/login",(req,res) => {
 const { Login, Password } = req.body;
  const errors = [];
  if (!Login) errors.push("Введите логин");
  if (!Password) errors.push("Введите пароль");
  if (errors.length) {
    return res.render("login", { title: "Авторизация", errors });
  }
  const userExists = User.exist(Login);
  if (!userExists) {
    return res.render("login", {
      title: "Авторизация",
      errors: ["Пользователь с таким логином не найден"],
    });
  }
  res.redirect("/dashboard");
});
zhopa.get("/dashboard", (req, res) => {
  const user = User.findById(1);
  const requests = Request.findAllDetailed();
  res.render("dashboard", {
    title: "Мои заявки",
    user: user || { fio: "Гость" },
    requests: requests || [],
  });
});
zhopa.listen(PORT, () => {
  console.log(`Сервер:http://localhost:${PORT}`);
});
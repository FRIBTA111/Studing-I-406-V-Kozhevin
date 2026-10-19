import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import db from "./db.js";
import { User } from "./db.js";
import { Room } from "./db.js";
import { Request } from "./db.js";
import session from "express-session";
import bcrypt from "bcryptjs";
import { type } from "os";
import { text } from "stream/consumers";

const newRequest = Request.create({
  userId: 1,
  roomId: 2,
  dateStart: "2027-04-10",
  payment: "СБП",
});
console.log("Созданная заявка:");
console.log(newRequest);

const INACTIVITY_LIMIT = 20 * 60 * 1000;

const RULES = [
  {
    field: "login",
    test: (v) => /^[A-Za-z0-9]{6,}$/.test(v),
    msg: "Логин: латиница+цифры, минимум 6 символов",
  },
  {
    field: "password",
    test: (v) => v && v.length >= 8,
    msg: "Пароль: минимум 8 символов",
  },
  {
    field: "fio",
    test: (v) => /^[А-Яа-яЁё\s]+$/.test(v),
    msg: "ФИО: только кириллица и пробелы",
  },
  {
    field: "phone",
    test: (v) => /^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(v),
    msg: "Телефон: формат 8(ХХХ)ХХХ-ХХ-ХХ",
  },
  {
    field: "email",
    test: (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
    msg: "Email: некорректный формат",
  },
];

const validate = (data) =>
  RULES.filter(({ field, test }) => !test((data[field] || "").trim())).map(
    (r) => r.msg,
  );

const requireAuth = (req, res, next) =>
  req.session.userId ? next() : res.redirect("/login");

const requireAdmin = (req, res, next) =>
  req.session.login === "Conf2027" ? next() : res.redirect("/login");

const __dirname = dirname(fileURLToPath(import.meta.url));
const zhopa = express();
const PORT = 3000;
zhopa.use(express.urlencoded({ extended: true }));
zhopa.set("view engine", "ejs");
zhopa.set("views", join(__dirname, "views"));
zhopa.get("/", (req, res) => {});
zhopa.get("/hayou", (req, res) => {});
zhopa.get("/register", (req, res) => {
  res.render("register", {
    title: "регистрация",
    errors: [],
  });
});
zhopa.post("/register", (req, res) => {
  const errors = validate(req.body);

  if (User.exist(req.body.login)) {
    errors.push("Логин уже занят");
  }

  if (errors.length) {
    return res.render("auth", {
      mode: "register",
      form: req.body,
      errors,
    });
  }
  User.create(req.body);

  req.session.flash = {
    type: "success",
    text: "Регистрация успешна. Войдите.",
  };
  res.redirect("/login");
});
zhopa.get("/login", (req, res) => {
  res.render("login", {
    title: "Авторизация",
    errors: [],
  });
});
zhopa.post("/login", (req, res) => {
  const user = User.findByLogin(req, res, Login);
  const { Login, Password } = req.body;
  const errors = [];
  if (user && bcrypt.compareSync(req.body.password)) {
    req.session.userId = user.id;
    req.session.fio = user.fio;
    req.session.login = user.login;
    req.session.lastActivity = Date.now();

    return res.redirect(user.login === "Conf2027" ? "/admin" : "dashboard");
  }
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
zhopa.get("/create", (req, res) => {
  const rooms = Rooms.findAll();
  res.render("create_request", { rooms, errors: [] });
  zhopa.use(
    session({
      secret: "conf2027-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 2,
        httpOnly: true,
        sameSite: "lax",
      },
    }),
  );
});
zhopa.use((req, res, next) => {
  if (req.session && req.session.userId) {
    const now = Date.now();
    if (
      req.session.lastActivity &&
      now - req.session.lastActivity > INACTIVITY_LIMIT
    ) {
      return req.session.destroy(() => {
        res.redirect("/login");
      });
    }
    req.session.lastActivity = now;
  }
  next();
});
res.render("auth", {
  mode: "login",
  error: "Неверный логин или пароль",
  flash: null,
});
zhopa.all("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import db from "./db.js";
import { User, Room, Request } from "./db.js";
import session from "express-session";
import bcrypt from "bcryptjs";

const INACTIVITY_LIMIT = 20 * 60 * 1000;

const RULES = [
  { field: "login", test: (v) => /^[A-Za-z0-9]{6,}$/.test(v), msg: "Логин: латиница+цифры, минимум 6 символов" },
  { field: "password", test: (v) => v && v.length >= 8, msg: "Пароль: минимум 8 символов" },
  { field: "fio", test: (v) => /^[А-Яа-яЁё\s]+$/.test(v), msg: "ФИО: только кириллица и пробелы" },
  { field: "phone", test: (v) => /^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(v), msg: "Телефон: формат 8(ХХХ)ХХХ-ХХ-ХХ" },
  { field: "email", test: (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), msg: "Email: некорректный формат" },
];

const validate = (data) =>
  RULES.filter(({ field, test }) => !test((data[field] || "").trim())).map((r) => r.msg);

const requireAuth = (req, res, next) =>
  req.session.userId ? next() : res.redirect("/login");

const requireAdmin = (req, res, next) =>
  req.session.login === "Conf2027" ? next() : res.redirect("/login");

const __dirname = dirname(fileURLToPath(import.meta.url));
const zhopa = express();
const PORT = 3000;

zhopa.use("/public", express.static(join(__dirname, "public")));
zhopa.use(express.urlencoded({ extended: true }));
zhopa.set("view engine", "ejs");
zhopa.set("views", join(__dirname, "views"));

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
  })
);

zhopa.use((req, res, next) => {
  if (req.session && req.session.userId) {
    const now = Date.now();
    if (req.session.lastActivity && now - req.session.lastActivity > INACTIVITY_LIMIT) {
      return req.session.destroy(() => {
        res.redirect("/login");
      });
    }
    req.session.lastActivity = now;
  }
  next();
});

zhopa.get("/", (req, res) => {
  res.redirect("rooms");
});

zhopa.get("/rooms", (req, res) => {
  const rooms = Room.findAll();
  res.render("rooms", { rooms });
});

zhopa.get("/rooms/type/:type", (req, res) => {
  const rooms = Room.findAll().filter((r) => r.type === req.params.type);
  res.render("rooms", { rooms });
});

zhopa.get("/register", (req, res) => {
  res.render("auth", {
    mode: "register",
    form: {},
    errors: [],
    flash: null
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
      flash: null
    });
  }

  const userData = { ...req.body };
  userData.password = bcrypt.hashSync(userData.password, 10);
  User.create(userData);

  req.session.flash = {
    type: "success",
    text: "Регистрация успешна. Войдите.",
  };
  res.redirect("/login");
});

zhopa.get("/login", (req, res) => {
  const flash = req.session.flash || null;
  delete req.session.flash;
<<<<<<< HEAD
  res.render("login", {
    title: "Авторизация",
    errors: [],
=======
  
  res.render("auth", {
    mode: "login",
    errors: [], 
    flash: flash,
>>>>>>> 419280f (крупное исправление, подстройка шаблонов под bootstrap, добавление room и request ejs)
  });
  res.render("auth", {
    mode: "login",
    error: "Неверный логин или пароль",
    flash: null,
  });
});

zhopa.post("/login", (req, res) => {
  const { login, password } = req.body;
  const errors = [];

  if (!login) errors.push("Введите логин");
  if (!password) errors.push("Введите пароль");

  if (errors.length) {
    return res.render("auth", { mode: "login", errors, flash: null });
  }

  const user = User.findByLogin(login); 

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.userId = user.id;
    req.session.fio = user.fio;
    req.session.login = user.login;
    req.session.lastActivity = Date.now();

    return res.redirect(user.login === "Conf2027" ? "/admin" : "/dashboard");
  }

  return res.render("auth", {
    mode: "login",
    errors: ["Неверный логин или пароль"],
    flash: null
  });
});

zhopa.get("/dashboard", requireAuth, (req, res) => {
  const requests = Request.findByUser(req.session.userId);
  res.render("requests_list", { isAdmin: false, requests });
});

zhopa.get("/create", (req, res) => {
  const rooms = Room.findAll();
  res.render("create_request", { rooms, errors: [] });
});
<<<<<<< HEAD
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
=======

zhopa.post("/create", requireAuth, (req, res) => {
  Request.create({
    userId: req.session.userId,
    roomId: req.body.roomId,
    dateStart: req.body.date_start,
    payment: req.body.payment,
  });
  res.redirect("/dashboard");
});

>>>>>>> 419280f (крупное исправление, подстройка шаблонов под bootstrap, добавление room и request ejs)
zhopa.all("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy(() => res.redirect("/login"));
  } else {
    res.redirect("/login");
  }
});

zhopa.get("/admin", requireAdmin, (req, res) => {
  const requests = Request.findAllDetailed ? Request.findAllDetailed() : [];
  res.render("requests_list", { isAdmin: true, requests });
});

zhopa.post("/admin", requireAdmin, (req, res) => {
  if (Request.updateStatus) {
    Request.updateStatus(req.body.id, req.body.status);
  }
  res.redirect("/admin");
});

zhopa.listen(PORT, () => {
  console.log(`Сервер: http://localhost:${PORT}`);
});
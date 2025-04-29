import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import * as dotenv from "dotenv";

dotenv.config();

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "hospital-document-system-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });

      req.login(user, (loginErr: Error) => {
        if (loginErr) return next(loginErr);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "ไม่ได้เข้าสู่ระบบ" });
    res.json(req.user);
  });

  // Admin-only endpoints
  app.use("/api/admin/*", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "ไม่ได้เข้าสู่ระบบ" });
    }
    
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "ไม่มีสิทธิ์เข้าถึง" });
    }
    
    next();
  });
}

// Initialize the database with default users if empty
export async function initializeUsers() {
  const users = await storage.getUsers();
  
  if (users.length === 0) {
    console.log("Creating default users...");
    
    // Create admin user
    await storage.createUser({
      username: "admin",
      password: await hashPassword("admin123"),
      displayName: "ผู้ดูแลระบบ",
      department: "ฝ่ายไอที",
      role: "admin",
      email: "admin@ekachonhospital.com",
      profileImage: ""
    });
    
    // Create manager user
    await storage.createUser({
      username: "somchai",
      password: await hashPassword("somchai123"),
      displayName: "สมชาย มั่นคง",
      department: "แผนกบุคคล",
      role: "manager",
      email: "somchai@ekachonhospital.com",
      profileImage: ""
    });
    
    // Create staff user
    await storage.createUser({
      username: "suda",
      password: await hashPassword("suda123"),
      displayName: "สุดา มานะ",
      department: "แผนกบัญชี",
      role: "staff",
      email: "suda@ekachonhospital.com",
      profileImage: ""
    });
    
    console.log("Default users created successfully");
  }
}
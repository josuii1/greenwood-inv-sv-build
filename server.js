import express from "express";
import {
  getInvoices,
  insertInvoice,
  deleteInvoice,
  registerNewUser,
  getUserByUsername,
  comparePassword,
  getUserById,
  getInvoiceDetails,
  getCurrentInvoiceNumber,
  updateInvoice,
} from "./database.js";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import cors from "cors";
const app = express();
import dotenv from "dotenv";
dotenv.config();

app.use(express.json()); // This is crucial

app.use(passport.initialize());

const allowedOrigins = [
  "https://greenwood-client-2-erxu8.ondigitalocean.app",
  "https://glm.josuii.com/",
  "http://localhost:3000",
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.options("*", cors()); // Allow preflight requests for all routes

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.MYSQL_SECRET,
};

passport.use(
  new Strategy(opts, async (jwt_payload, done) => {
    try {
      const result = await getUserById(jwt_payload.id);
      if (result.length > 0) {
        return done(null, result[0]);
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  })
);

app.post(
  "/register/newuser",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const userData = req.body;
      console.log(userData);
      const result = await registerNewUser(userData);
      console.log(result);
      res.status(201).json({ message: "User registered successfully", result });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error registering user", error: error.message });
      console.error(error);
    }
  }
);

app.post("/login", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  const { username, password } = req.body;

  getUserByUsername(username, (err, user) => {
    if (err) return res.status(500).json({ msg: "Server error" });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    comparePassword(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ msg: "Server error" });
      if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.MYSQL_SECRET,
        { expiresIn: "24h" }
      );

      res.json({ token });
    });
  });
});

app.get(
  "/authenticatesession",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.header("Access-Control-Allow-Origin", "*"); // Allow all origins
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );

    console.log("validated");
    res.json({ validated: 1 });
  }
);

app.get(
  "/invoices",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const invoiceList = await getInvoices();
    res.json(invoiceList);
  }
);

app.get(
  "/invoices/details/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const invoiceId = parseInt(req.params.id, 10);
    const invoice = await getInvoiceDetails(invoiceId);
    res.json(invoice);
  }
);

app.post(
  "/invoices/create",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      console.log(req.body);
      const invoiceData = req.body;
      const result = await insertInvoice(invoiceData);
      res.status(201).json({ message: "Invoice created successfully", result });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating invoice", error: error.message });
    }
  }
);

app.post(
  "/invoices/update/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const invoiceData = req.body;
      const result = await updateInvoice(invoiceData);
      res.status(201).json({ message: "Invoice updated:", result });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating invoice", error: error.message });
    }
  }
);

app.get("/invoices/create/currentnumber", async (req, res) => {
  const currentInvoicePlace = await getCurrentInvoiceNumber();
  res.json(currentInvoicePlace[0].CurrentInvoicePlace);
});

app.delete(
  "/invoices/delete/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const invoiceId = parseInt(req.params.id, 10);
    try {
      const result = await deleteInvoice(invoiceId);
      res.status(201).json({ message: "Invoice deleted successfully", result });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting invoice", error: error.message });
    }
  }
);

app.listen(5520, () => {
  console.log("server started on port 5520");
});

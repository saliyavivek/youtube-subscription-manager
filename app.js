import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import methodOverride from "method-override";
import cookieParser from "cookie-parser";

import { checkCredentials } from "./config/credentials.js";

import authRoutes from "./routes/auth.js";
import subscriptionRoutes from "./routes/subscriptions.js";

const app = express();
const PORT = process.env.PORT || 8080;
app.set("view engine", "ejs");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

checkCredentials();

// Routes
app.use("/", authRoutes);
app.use("/", subscriptionRoutes);

app.listen(PORT, () => {
  console.log(`Server listening to port ${PORT}`);
});

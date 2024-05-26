import dotenv from "dotenv";
dotenv.config();

import { google } from "googleapis";
import express from "express";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import methodOverride from "method-override";
import cookieParser from "cookie-parser";

import { formatDate } from "./utils/format.js";
import { oauth2Client, checkCredentials } from "./config/credentials.js";
import { listSubscriptions, unsubscribe } from "./utils/subscription-utils.js";

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

app.get("/", (req, res) => {
  const authed = req.cookies.authed === "true"; // Read the authed cookie

  if (!authed) {
    // Render the authentication link
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube",
      ],
    });
    res.render("index", { url, authed });
  } else {
    // If user is authenticated, render the page accordingly
    const oauth2 = google.oauth2({
      version: "v2",
      auth: oauth2Client,
    });
    oauth2.userinfo.get((err, response) => {
      if (err) {
        console.error("Error fetching user info", err);
        // Handle error
        res.render("index", { url: "", authed });
      } else {
        // Render the page with authenticated user information
        res.render("index", { url: "", authed, userInfo: response.data });
      }
    });
  }
});

app.get("/google/redirect", async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    fs.writeFileSync("creds.json", JSON.stringify(tokens));

    const expiryDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);

    res.cookie("authed", true, {
      expires: expiryDate,
    });

    res.redirect("/");
  } catch (err) {
    console.error("Error during OAuth2 redirect", err);
    res.send("Error during authentication");
  }
});

// List Subscriptions Function
listSubscriptions(oauth2Client);

// List Subscriptions Route
app.get("/execute", async (req, res) => {
  if (req.cookies.authed) {
    try {
      const subscriptions = await listSubscriptions(oauth2Client);
      res.render("subs", {
        subscriptions,
        formatDate,
      });
    } catch (err) {
      res.send("Error fetching subscriptions");
    }
  } else {
    res.redirect("/");
  }
});

// Unsubscribe Channel Route
app.delete("/channel/:channelId", async (req, res) => {
  const channelId = req.params.channelId;
  if (req.cookies.authed) {
    try {
      await unsubscribe(oauth2Client, channelId);
      res.redirect("/execute");
    } catch (error) {
      console.log(error);
      res.redirect("/");
    }
  }
});

formatDate();

app.listen(PORT, () => {
  console.log(`Server listening to port ${PORT}`);
});

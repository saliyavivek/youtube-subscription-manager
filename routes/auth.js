import express from "express";
import { google } from "googleapis";
import { oauth2Client } from "../config/credentials.js";
import fs from "fs";

const router = express.Router();

router.get("/", (req, res) => {
  const authed = req.cookies.authed === "true"; // Read the authed cookie

  if (!authed) {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
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
        console.log(response);
        res.render("index", { url: "", authed, userInfo: response.data });
      }
    });
  }
});

router.get("/google/redirect", async (req, res) => {
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

export default router;

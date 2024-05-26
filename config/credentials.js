import dotenv from "dotenv";
dotenv.config();

import { google } from "googleapis";
import fs from "fs";

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

function checkCredentials() {
  try {
    const creds = fs.readFileSync("creds.json");
    oauth2Client.setCredentials(JSON.parse(creds));
  } catch (err) {
    console.log("No creds found.");
  }
}

export { oauth2Client, checkCredentials };

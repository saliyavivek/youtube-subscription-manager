import dotenv from "dotenv";
dotenv.config();

import { google } from "googleapis";
import express from "express";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import methodOverride from "method-override";

const app = express();
const PORT = process.env.PORT || 8080;
app.set("view engine", "ejs");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

try {
  const creds = fs.readFileSync("creds.json");
  oauth2Client.setCredentials(JSON.parse(creds));
} catch (err) {
  console.log("No creds found.");
}

let authed = false;
app.get("/", (req, res) => {
  if (!authed) {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube",
      ],
    });
    authed = true;
    res.render("index", { url, authed });
  } else {
    const oauth2 = google.oauth2({
      version: "v2",
      auth: oauth2Client,
    });
    oauth2.userinfo.get((err, response) => {
      if (err) throw err;
      // console.log(response);
      res.render("index", { url: "", authed });
    });
  }
});

app.get("/google/redirect", async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  fs.writeFileSync("creds.json", JSON.stringify(tokens));
  authed = true;
  res.redirect("/");
});

// List Subscriptions Function
// async function listSubscriptions(auth) {
//   const youtube = google.youtube({ version: "v3", auth });
//   try {
//     const response = await youtube.subscriptions.list({
//       part: "snippet,contentDetails,subscriberSnippet",
//       channelId: "UCcYIOoTFAeqtn4xX1ymjVpw",
//       maxResults: 50,
//     });
//     return response.data.items;
//   } catch (err) {
//     console.error("Execute error while listing subscriptions", err);
//     throw err;
//   }
// }

async function listSubscriptions(auth) {
  const youtube = google.youtube({ version: "v3", auth });
  let allSubscriptions = [];
  let nextPageToken = null;

  try {
    do {
      const response = await youtube.subscriptions.list({
        part: "snippet,contentDetails,subscriberSnippet",
        channelId: "UCcYIOoTFAeqtn4xX1ymjVpw",
        maxResults: 50,
        pageToken: nextPageToken,
      });

      allSubscriptions = allSubscriptions.concat(response.data.items);
      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    return allSubscriptions;
  } catch (err) {
    console.error("Execute error while listing subscriptions", err);
    throw err;
  }
}

// List Subscriptions Route
app.get("/execute", async (req, res) => {
  if (authed) {
    try {
      const subscriptions = await listSubscriptions(oauth2Client);
      res.render("subs", {
        subscriptions,
        formatDate,
        findChannelDetails,
        oauth2Client,
      });
    } catch (err) {
      res.send("Error fetching subscriptions");
    }
  } else {
    res.redirect("/");
  }
});

// Unsubscribe Channel Function
async function unsubscribe(auth, subscriptionId) {
  const youtube = google.youtube({ version: "v3", auth });
  try {
    await youtube.subscriptions
      .delete({
        id: subscriptionId,
      })
      .catch((err) => console.log(err));
  } catch (err) {
    console.error("Execute error while unsubscribing channel", err);
    throw err;
  }
}

// Unsubscribe Channel Route
app.delete("/channel/:channelId", async (req, res) => {
  const channelId = req.params.channelId;
  if (authed) {
    try {
      await unsubscribe(oauth2Client, channelId);
      res.redirect("/execute");
    } catch (error) {
      console.log(error);
      res.redirect("/");
    }
  }
});

// Find Channel Username Function
async function findChannelDetails(auth, channelId) {
  const youtube = google.youtube({ version: "v3", auth });
  try {
    const response = await youtube.channels.list({
      part: "snippet,contentDetails,statistics",
      id: channelId,
    });
    return response.data.items[0].id;
  } catch (err) {
    console.error("Execute error while unsubscribing channel", err);
    throw err;
  }
}

// Find Channel Username Route
// app.get("/find", async (req, res) => {
//   if (authed) {
//     try {
//       const channel = await findChannelDetails(
//         oauth2Client,
//         "UCG7J20LhUeLl6y_Emi7OJrA"
//       );
//       console.log(channel);
//     } catch (err) {
//       res.send("Error fetching subscriptions");
//     }
//   } else {
//     res.redirect("/");
//   }
// });

function formatDate(isoDate) {
  const date = new Date(isoDate);

  // Define arrays for month names
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Get day, month, and year
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  // Format the date as "25 May 2024"
  return `${day} ${month} ${year}`;
}

app.listen(PORT, () => {
  console.log(`Server listening to port ${PORT}`);
});

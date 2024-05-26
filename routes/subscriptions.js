import express from "express";
import { oauth2Client } from "../config/credentials.js";
import { listSubscriptions, unsubscribe } from "../utils/subscription-utils.js";
import { formatDate } from "../utils/format.js";

const router = express.Router();

// List Subscriptions Route
router.get("/execute", async (req, res) => {
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
router.delete("/channel/:channelId", async (req, res) => {
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

export default router;

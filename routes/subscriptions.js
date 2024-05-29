import express from "express";
import { oauth2Client } from "../config/credentials.js";
import { listSubscriptions, unsubscribe } from "../utils/subscription-utils.js";
import { formatDate, formatSubscriberCount } from "../utils/format.js";

const router = express.Router();

// List Subscriptions Route
router.get("/execute", async (req, res) => {
  let { order } = req.query;
  if (req.signedCookies.authed === "true") {
    try {
      const subscriptions = await listSubscriptions(oauth2Client, order);
      res.render("subs", {
        subscriptions,
        formatDate,
        formatSubscriberCount,
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
  if (req.signedCookies.authed === "true") {
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

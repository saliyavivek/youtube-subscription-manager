import express from "express";
import { oauth2Client } from "../config/credentials.js";
import {
  listSubscriptions,
  unsubscribe,
  addSubscription,
  getChannelId,
} from "../utils/subscription-utils.js";
import {
  formatDate,
  formatSubscriberCount,
  convertViewsCount,
} from "../utils/format.js";

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
        convertViewsCount,
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

// router.post("/channel/subscribe", async (req, res) => {
//   const channelId = req.body.channelId;
//   if (req.signedCookies.authed === "true") {
//     try {
//       await addSubscription(oauth2Client, channelId);
//       res.redirect("/execute");
//     } catch (error) {
//       console.log(error);
//       res.redirect("/");
//     }
//   }
// });

router.post("/channel/subscribe", async (req, res) => {
  const input = req.body.channelId;

  try {
    const channelId = await getChannelId(oauth2Client, input);
    const subscription = await addSubscription(oauth2Client, channelId);
    // res.json({ success: true, subscription });
    res.redirect("/execute");
  } catch (err) {
    console.error("Failed to subscribe to the channel:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

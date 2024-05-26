import { google } from "googleapis";

async function listSubscriptions(auth) {
  const youtube = google.youtube({ version: "v3", auth });
  let allSubscriptions = [];
  let nextPageToken = null;

  try {
    do {
      const response = await youtube.subscriptions.list({
        part: "snippet,contentDetails,subscriberSnippet",
        mine: true,
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

export { listSubscriptions, unsubscribe };

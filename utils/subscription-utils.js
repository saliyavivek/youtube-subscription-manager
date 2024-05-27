import { google } from "googleapis";

// async function listSubscriptions(auth) {
//   const youtube = google.youtube({ version: "v3", auth });
//   let allSubscriptions = [];
//   let nextPageToken = null;

//   try {
//     do {
//       const response = await youtube.subscriptions.list({
//         part: "snippet,contentDetails,subscriberSnippet",
//         mine: true,
//         maxResults: 50,
//         pageToken: nextPageToken,
//         order: "alphabetical",
//       });

//       allSubscriptions = allSubscriptions.concat(response.data.items);
//       nextPageToken = response.data.nextPageToken;
//     } while (nextPageToken);

//     console.log(allSubscriptions);
//     return allSubscriptions;
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
        mine: true,
        maxResults: 50,
        pageToken: nextPageToken,
        order: "alphabetical",
      });

      allSubscriptions = allSubscriptions.concat(response.data.items);
      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    // Extract channel IDs from subscriptions
    const channelIds = allSubscriptions.map(
      (sub) => sub.snippet.resourceId.channelId
    );

    // Split the channelIds array into chunks if it's too large for a single API request
    const chunkSize = 50; // YouTube API has a maximum limit of 50 ids per request
    const channelChunks = [];
    for (let i = 0; i < channelIds.length; i += chunkSize) {
      channelChunks.push(channelIds.slice(i, i + chunkSize));
    }

    // Fetch channel details including custom URLs for each chunk
    const channelDetailsPromises = channelChunks.map((chunk) =>
      youtube.channels.list({
        part: "snippet,brandingSettings,statistics",
        id: chunk.join(","),
      })
    );

    // Wait for all promises to resolve
    const channelsResponses = await Promise.all(channelDetailsPromises);

    // Flatten the array of channel responses into a single array of channels
    const channels = channelsResponses.flatMap(
      (response) => response.data.items
    );

    // Map the fetched channel details to a more usable format
    const channelsMap = channels.reduce((map, channel) => {
      map[channel.id] = {
        channelId: channel.id,
        title: channel.snippet.title,
        customUrl: channel.snippet.customUrl,
        thumbnails: channel.snippet.thumbnails,
        description: channel.snippet.description,
        url: channel.brandingSettings.channel.customUrl
          ? `https://www.youtube.com/${channel.brandingSettings.channel.customUrl}`
          : `https://www.youtube.com/channel/${channel.id}`,
        subscriberCount: channel.statistics.subscriberCount,
      };
      return map;
    }, {});

    // Map the subscriptions with channel details
    const subscriptionsWithDetails = allSubscriptions.map((subscription) => {
      const channelDetail =
        channelsMap[subscription.snippet.resourceId.channelId];
      return {
        ...subscription,
        channelDetails: channelDetail,
      };
    });

    return subscriptionsWithDetails;
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

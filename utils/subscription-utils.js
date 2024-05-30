import { google } from "googleapis";

async function listSubscriptions(auth, order) {
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
        order: order,
      });
      allSubscriptions = allSubscriptions.concat(response.data.items);
      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    // Extract channel IDs from subscriptions
    const channelIds = allSubscriptions.map(
      (sub) => sub.snippet.resourceId.channelId
    );

    // Split the channelIds array into chunks if it's too large for a single API request
    const chunkSize = 50;
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
        viewsCount: channel.statistics.viewCount,
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

async function addSubscription(auth, channelId) {
  const youtube = google.youtube({ version: "v3", auth });

  try {
    const response = await youtube.subscriptions.insert({
      part: "snippet",
      resource: {
        snippet: {
          resourceId: {
            kind: "youtube#channel",
            channelId: channelId,
          },
        },
      },
    });

    console.log(`Successfully subscribed to channel ID: ${channelId}`);
    return response.data;
  } catch (err) {
    console.error("Error subscribing to the channel", err);
    throw err;
  }
}

// Function to get channel ID from input (either channel name or ID)
async function getChannelId(auth, input) {
  const youtube = google.youtube({ version: "v3", auth });

  // Check if the input is already a valid channel ID
  if (/^[a-zA-Z0-9_-]{24}$/.test(input)) {
    return input;
  }

  // Otherwise, treat it as a channel name and fetch the channel ID
  try {
    const response = await youtube.channels.list({
      part: "id,statistics",
      forHandle: input,
    });
    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].id;
    } else {
      throw new Error("Channel not found.");
    }
  } catch (err) {
    console.error("Error fetching channel ID", err);
    throw err;
  }
}

async function searchChannel(auth, query) {
  try {
    const youtube = google.youtube({ version: "v3", auth });

    const response = await youtube.search.list({
      part: "snippet",
      type: "channel",
      q: query,
    });
    return response;
  } catch (error) {
    console.error("Error Searching Channel", error);
    throw error;
  }
}

export {
  listSubscriptions,
  unsubscribe,
  addSubscription,
  getChannelId,
  searchChannel,
};

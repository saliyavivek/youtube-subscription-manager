function formatDate(isoDate) {
  const date = new Date(isoDate);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Get day, month, and year
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  // Format the date as "25 May 2024"
  return `${day} ${month} ${year}`;
}

function formatSubscriberCount(subscriberCount) {
  if (subscriberCount >= 1000000) {
    return (subscriberCount / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  } else if (subscriberCount >= 1000) {
    return (subscriberCount / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  } else {
    return subscriberCount.toString();
  }
}

function convertViewsCount(views) {
  if (views < 1000) {
    return views.toString();
  } else if (views < 100000) {
    return (views / 1000).toFixed(1) + "K";
  } else if (views < 10000000) {
    return (views / 100000).toFixed(1) + " Lakh";
  } else if (views < 1000000000) {
    return (views / 10000000).toFixed(1) + " Crore";
  } else {
    return (views / 1000000000).toFixed(1) + " Billion";
  }
}

export { formatDate, formatSubscriberCount, convertViewsCount };

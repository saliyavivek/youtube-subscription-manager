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

export { formatDate };

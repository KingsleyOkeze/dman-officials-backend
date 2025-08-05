// dateUtils.js

/**
 * Converts a date string (YYYY-MM-DD) to a UTC Date object.
 * @param {string} dateStr - The date string in "YYYY-MM-DD" format.
 * @param {string} [position='end'] - Specify 'start' for beginning of day (00:00:00)
 *                                    or 'end' for end of day (23:59:59).
 * @returns {Date} - The Date object in UTC.
 */

const convertDateToUTC = (dateStr, position = 'end') => {
    // Decide on the time component based on the position.
    const timeSuffix = position === 'start' ? 'T00:00:00Z' : 'T23:59:59Z';
    // Combine the date string with the time suffix.
    const utcDateString = `${dateStr}${timeSuffix}`;
    // Create and return a Date object. This Date is now in UTC.
    return new Date(utcDateString);
}
  

const isExpired = (expirationDate) => {
    // Get the current time as a Date object.
    const now = new Date();
    
    // Compare the expiration date with the current time.
    // If the expirationDate is before now, the coupon has expired.
    return expirationDate.getTime() < now.getTime();
}

module.exports = { convertDateToUTC, isExpired };
  
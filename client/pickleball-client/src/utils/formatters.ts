/**
 * Format a number as currency (VND)
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount?: number): string => {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format a date as a localized date string
 * @param date - The date to format (ISO string or Date object)
 * @returns Formatted date string
 */
export const formatDate = (date?: string | Date): string => {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format a time as a localized time string
 * @param time - The time to format (ISO string or Date object)
 * @returns Formatted time string
 */
export const formatTime = (time?: string | Date): string => {
  if (!time) return '-';
  const timeObj = typeof time === 'string' ? new Date(time) : time;
  return timeObj.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format a date and time as a localized date and time string
 * @param dateTime - The date and time to format (ISO string or Date object)
 * @returns Formatted date and time string
 */
export const formatDateTime = (dateTime?: string | Date): string => {
  if (!dateTime) return '-';
  const dateTimeObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  return dateTimeObj.toLocaleString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format a duration in minutes to a human-readable string
 * @param minutes - The duration in minutes
 * @returns Formatted duration string
 */
export const formatDuration = (minutes?: number): string => {
  if (minutes === undefined || minutes === null) return '-';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} phút`;
  } else if (mins === 0) {
    return `${hours} giờ`;
  } else {
    return `${hours} giờ ${mins} phút`;
  }
};

/**
 * Format a phone number to a standard format
 * @param phone - The phone number to format
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone?: string): string => {
  if (!phone) return '-';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format as Vietnamese phone number
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  } else if (digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
  }
  
  // Return as is if not a standard length
  return phone;
};

export const notifications = [];
export async function insertNotification(...args) { notifications.push(args); }
export async function insertNotifications(...args) { notifications.push(args); }

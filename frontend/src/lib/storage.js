const KEY = 'lastRoute';
export const saveLastRoute = (path) => {
  try {
    localStorage.setItem(KEY, path);
  } catch (err) {
    console.warn('Unable to persist last route', err);
  }
};

export const getLastRoute = () => {
  try {
    return localStorage.getItem(KEY) || null;
  } catch (err) {
    console.warn('Unable to read last route', err);
    return null;
  }
};

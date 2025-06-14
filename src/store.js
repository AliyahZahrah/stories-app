let currentUser = null;

export function updateUserState(user) {
  currentUser = user;
}

export function clearUserState() {
  currentUser = null;
}

export function getUser() {
  return currentUser;
}

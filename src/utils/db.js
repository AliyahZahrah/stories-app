import { openDB } from 'idb';

const DB_NAME = 'stories-db';
const DB_VERSION = 2; // Version remains the same if schema of 'stories' store is unchanged
const STORIES_STORE_NAME = 'stories';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion) {
    if (!db.objectStoreNames.contains(STORIES_STORE_NAME)) {
      const store = db.createObjectStore(STORIES_STORE_NAME, { keyPath: 'id' });
      store.createIndex('createdAt', 'createdAt');
      // isBookmarked index can be useful for querying bookmarked stories directly if needed,
      // but getAllBookmarkedStories currently filters in JS.
      // if (oldVersion < NEW_VERSION_IF_ADDING_INDEX) { // Example
      //   store.createIndex('isBookmarked', 'isBookmarked', { unique: false });
      // }
      console.log('[DB] Stories object store created.');
    }
    // If DB_VERSION is incremented due to schema changes (e.g., adding new indexes to 'stories' store):
    // if (oldVersion < 2 && db.objectStoreNames.contains(STORIES_STORE_NAME)) {
    //   const store = db.transaction(STORIES_STORE_NAME, 'readwrite').objectStore(STORIES_STORE_NAME);
    //   if (!store.indexNames.contains('isBookmarked')) {
    //      store.createIndex('isBookmarked', 'isBookmarked', { unique: false });
    //      console.log('[DB] isBookmarked index created on stories store.');
    //   }
    // }
  },
});

/**
 * Updates existing stories in IndexedDB with new data from the API,
 * preserving their current bookmark status. Stories from the API that
 * are not already in IndexedDB will NOT be added by this function.
 * @param {Array<Object>} apiStories - Array of story objects from the API.
 */
export async function putStories(apiStories) {
  if (!apiStories || apiStories.length === 0) return;
  try {
    const db = await dbPromise;
    const tx = db.transaction(STORIES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORIES_STORE_NAME);
    for (const apiStory of apiStories) {
      if (apiStory && apiStory.id) {
        const existingStory = await store.get(apiStory.id);
        if (existingStory) {
          // Update existing story with new API data, but preserve its bookmark status
          await store.put({
            ...existingStory, // Keep existing fields like isBookmarked
            ...apiStory, // Overwrite with new API data (name, description, photoUrl, lat, lon, createdAt)
            id: apiStory.id, // Ensure id is from apiStory
            isBookmarked: existingStory.isBookmarked, // Explicitly preserve bookmark status
          });
        }
        // If story is not in DB, it's not added here.
        // It will be added only when explicitly bookmarked.
      } else {
        console.warn('[DB] Attempted to process story from API without id:', apiStory);
      }
    }
    await tx.done;
    console.log('[DB] Relevant stories updated from API, preserving bookmark statuses.');
  } catch (error) {
    console.error('[DB] Error updating stories from API:', error);
  }
}

export async function getAllStories() {
  try {
    const db = await dbPromise;
    const stories = await db.getAll(STORIES_STORE_NAME);
    console.log('[DB] Fetched all stories from DB:', stories);
    return stories;
  } catch (error) {
    console.error('[DB] Error fetching stories:', error);
    return [];
  }
}

export async function getStoryByIdFromDB(id) {
  try {
    const db = await dbPromise;
    const story = await db.get(STORIES_STORE_NAME, id);
    // console.log(`[DB] Fetched story by id ${id} from DB:`, story);
    return story || undefined; // Ensure undefined if not found
  } catch (error) {
    console.error(`[DB] Error fetching story by id ${id}:`, error);
    return undefined;
  }
}

/**
 * Toggles the bookmark status of a story.
 * If the story is not in IndexedDB and is being bookmarked, it's added.
 * @param {string} storyId - The ID of the story.
 * @param {Object} [storyDataFromPresenter=null] - The story object (summary or detail) from the presenter.
 *                                                 Required if bookmarking a story not yet in DB.
 * @returns {Promise<boolean|null>} The new bookmark status, or null if an error occurs.
 */
export async function toggleBookmarkStatus(storyId, storyDataFromPresenter = null) {
  try {
    const db = await dbPromise;
    const storyInDb = await db.get(STORIES_STORE_NAME, storyId);

    if (storyInDb) {
      storyInDb.isBookmarked = !storyInDb.isBookmarked;
      await db.put(STORIES_STORE_NAME, storyInDb);
      console.log(`[DB] Toggled bookmark status for story ${storyId} to ${storyInDb.isBookmarked}`);
      return storyInDb.isBookmarked;
    }
    // Story not in DB, can only happen if we are trying to bookmark it for the first time
    if (!storyDataFromPresenter) {
      console.warn(
        `[DB] Cannot bookmark new story ${storyId} without story data. It might not have been fetched from API yet or passed correctly.`,
      );
      return null; // Indicate an issue or that operation couldn't complete
    }

    const newStoryToDb = {
      ...storyDataFromPresenter, // Contains name, description, photoUrl etc.
      id: storyId,
      isBookmarked: true, // Explicitly bookmarking
    };
    await db.put(STORIES_STORE_NAME, newStoryToDb);
    console.log(`[DB] Bookmarked new story ${storyId} and added to DB.`);
    return true; // New status is bookmarked
  } catch (error) {
    console.error(`[DB] Error toggling bookmark status for story ${storyId}:`, error);
    return null; // Indicate error
  }
}

export async function getAllBookmarkedStories() {
  try {
    const db = await dbPromise;
    const allStories = await db.getAll(STORIES_STORE_NAME);
    const bookmarkedStories = allStories.filter((story) => story.isBookmarked);
    console.log('[DB] Fetched all bookmarked stories:', bookmarkedStories);
    return bookmarkedStories;
  } catch (error) {
    console.error('[DB] Error fetching bookmarked stories:', error);
    return [];
  }
}

export async function clearStories() {
  try {
    const db = await dbPromise;
    await db.clear(STORIES_STORE_NAME);
    console.log('[DB] All stories cleared from DB.');
  } catch (error) {
    console.error('[DB] Error clearing stories:', error);
  }
}

export async function clearNonBookmarkedStories() {
  try {
    const db = await dbPromise;
    const tx = db.transaction(STORIES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORIES_STORE_NAME);
    let cursor = await store.openCursor();
    let deletedCount = 0;
    while (cursor) {
      if (!cursor.value.isBookmarked) {
        await cursor.delete();
        deletedCount++;
      }
      cursor = await cursor.continue();
    }
    await tx.done;
    console.log(`[DB] Cleared ${deletedCount} non-bookmarked stories.`);
  } catch (error) {
    console.error('[DB] Error clearing non-bookmarked stories:', error);
  }
}

export const DB_NAME = 'aelun-awakened';
export const DB_VERSION = 1;

export function upgrade(db: IDBDatabase, oldVersion: number, _newVersion: number | null) {
  // Reference newVersion to satisfy no-unused-vars without altering behavior
  void _newVersion;
  if (oldVersion < 1) {
    // Create object stores per architecture
    const gameContent = db.createObjectStore('gameContent', { keyPath: 'id' });
    gameContent.createIndex('type', 'type', { unique: false });
    gameContent.createIndex('tags', 'tags', { unique: false, multiEntry: true });

    db.createObjectStore('characters', { keyPath: 'id' }).createIndex('createdAt', 'createdAt', { unique: false });
    db.createObjectStore('graveyard', { keyPath: 'characterId' }).createIndex('timestamp', 'timestamp', { unique: false });
    db.createObjectStore('metaProgression', { keyPath: 'key' });
    const compendium = db.createObjectStore('compendium', { keyPath: 'id' });
    compendium.createIndex('category', 'category', { unique: false });
    db.createObjectStore('settings', { keyPath: 'key' });
  }
}

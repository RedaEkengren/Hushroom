import { describe, it, expect, beforeEach } from 'vitest';
import { saveRecentRoom, getRecentRooms, removeRecentRoom } from './recent-rooms';

const HOUR = 60 * 60 * 1000;

beforeEach(() => {
  localStorage.clear();
});

describe('saveRecentRoom + getRecentRooms', () => {
  it('returns an empty list when localStorage is empty', () => {
    expect(getRecentRooms()).toEqual([]);
  });

  it('round-trips a single room', () => {
    saveRecentRoom({ roomId: 'cool-bear-1234', name: 'Test', expiresAt: Date.now() + HOUR });
    const rooms = getRecentRooms();
    expect(rooms).toHaveLength(1);
    expect(rooms[0].roomId).toBe('cool-bear-1234');
    expect(rooms[0].name).toBe('Test');
  });

  it('deduplicates by roomId on save', () => {
    const exp1 = Date.now() + HOUR;
    saveRecentRoom({ roomId: 'same-id', name: 'First',  expiresAt: exp1 });
    saveRecentRoom({ roomId: 'same-id', name: 'Second', expiresAt: exp1 + 1000 });
    const rooms = getRecentRooms();
    expect(rooms).toHaveLength(1);
    expect(rooms[0].name).toBe('Second');
  });

  it('caps the list at 5 entries (oldest fall off)', () => {
    for (let i = 0; i < 7; i++) {
      saveRecentRoom({ roomId: `room-${i}`, name: `R${i}`, expiresAt: Date.now() + HOUR });
    }
    const rooms = getRecentRooms();
    expect(rooms).toHaveLength(5);
    // Most recent (room-6) should be present, oldest (room-0, room-1) should not
    const ids = rooms.map(r => r.roomId);
    expect(ids).toContain('room-6');
    expect(ids).not.toContain('room-0');
    expect(ids).not.toContain('room-1');
  });

  it('returns rooms sorted newest-first by expiresAt', () => {
    saveRecentRoom({ roomId: 'short',  name: 'Short',  expiresAt: Date.now() + 5 * 60 * 1000 });
    saveRecentRoom({ roomId: 'medium', name: 'Medium', expiresAt: Date.now() + 30 * 60 * 1000 });
    saveRecentRoom({ roomId: 'long',   name: 'Long',   expiresAt: Date.now() + 4 * HOUR });
    const rooms = getRecentRooms();
    expect(rooms.map(r => r.roomId)).toEqual(['long', 'medium', 'short']);
  });
});

describe('expired room pruning', () => {
  it('omits expired rooms from getRecentRooms', () => {
    saveRecentRoom({ roomId: 'fresh',   name: 'Fresh',   expiresAt: Date.now() + HOUR });
    // Force a past timestamp directly into localStorage (saveRecentRoom rejects it)
    const stored = JSON.parse(localStorage.getItem('hushroom:recent-rooms')!);
    stored.push({ roomId: 'stale', name: 'Stale', expiresAt: Date.now() - 10000 });
    localStorage.setItem('hushroom:recent-rooms', JSON.stringify(stored));

    const rooms = getRecentRooms();
    expect(rooms.map(r => r.roomId)).toEqual(['fresh']);
  });

  it('rejects saving an already-expired room', () => {
    saveRecentRoom({ roomId: 'born-dead', name: 'Dead', expiresAt: Date.now() - 1 });
    expect(getRecentRooms()).toEqual([]);
  });

  it('rejects saving a room with non-finite expiresAt', () => {
    saveRecentRoom({ roomId: 'bad', name: 'Bad', expiresAt: NaN });
    expect(getRecentRooms()).toEqual([]);
  });
});

describe('removeRecentRoom', () => {
  it('removes the targeted entry, leaves the rest', () => {
    saveRecentRoom({ roomId: 'a', name: 'A', expiresAt: Date.now() + HOUR });
    saveRecentRoom({ roomId: 'b', name: 'B', expiresAt: Date.now() + HOUR });
    saveRecentRoom({ roomId: 'c', name: 'C', expiresAt: Date.now() + HOUR });

    removeRecentRoom('b');

    const ids = getRecentRooms().map(r => r.roomId).sort();
    expect(ids).toEqual(['a', 'c']);
  });

  it('is a noop for unknown roomId', () => {
    saveRecentRoom({ roomId: 'a', name: 'A', expiresAt: Date.now() + HOUR });
    removeRecentRoom('not-there');
    expect(getRecentRooms()).toHaveLength(1);
  });
});

describe('robustness against bad localStorage state', () => {
  it('returns empty list when localStorage has invalid JSON', () => {
    localStorage.setItem('hushroom:recent-rooms', 'not-json{{{');
    expect(getRecentRooms()).toEqual([]);
  });

  it('returns empty list when stored value is not an array', () => {
    localStorage.setItem('hushroom:recent-rooms', '{"foo":"bar"}');
    expect(getRecentRooms()).toEqual([]);
  });

  it('filters out malformed entries', () => {
    const stored = [
      { roomId: 'good', name: 'Good', expiresAt: Date.now() + HOUR },
      { roomId: 123, name: 'BadId', expiresAt: Date.now() + HOUR },
      { name: 'NoId', expiresAt: Date.now() + HOUR },
    ];
    localStorage.setItem('hushroom:recent-rooms', JSON.stringify(stored));
    expect(getRecentRooms()).toHaveLength(1);
  });
});

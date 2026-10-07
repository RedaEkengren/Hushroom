// Persists a small list of recently visited rooms in localStorage so a
// user who accidentally closes the tab can find their way back. We
// deliberately do NOT store the encryption passphrase (#key= fragment) —
// that lives only in URL history / bookmarks; if it's lost, the room is
// inaccessible by design.

const STORAGE_KEY = 'hushroom:recent-rooms';
const MAX_ROOMS = 5;

export type RecentRoom = {
  roomId: string;
  name: string;
  expiresAt: number;
};

function readAll(): RecentRoom[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r): r is RecentRoom =>
      r && typeof r.roomId === 'string' && typeof r.name === 'string' && typeof r.expiresAt === 'number'
    );
  } catch {
    return [];
  }
}

function writeAll(rooms: RecentRoom[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  } catch {
    // localStorage may be unavailable (private mode, quota); fail silently
  }
}

export function getRecentRooms(): RecentRoom[] {
  const now = Date.now();
  const fresh = readAll().filter(r => r.expiresAt > now);
  // Prune expired entries opportunistically
  if (fresh.length !== readAll().length) writeAll(fresh);
  return fresh.sort((a, b) => b.expiresAt - a.expiresAt);
}

export function saveRecentRoom(room: RecentRoom): void {
  if (!room.roomId || !room.name || !Number.isFinite(room.expiresAt)) return;
  if (room.expiresAt <= Date.now()) return;
  const existing = readAll().filter(r => r.roomId !== room.roomId && r.expiresAt > Date.now());
  const next = [room, ...existing].slice(0, MAX_ROOMS);
  writeAll(next);
}

export function removeRecentRoom(roomId: string): void {
  writeAll(readAll().filter(r => r.roomId !== roomId));
}

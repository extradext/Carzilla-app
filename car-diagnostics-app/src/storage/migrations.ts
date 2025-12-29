/**
 * /src/storage/migrations.ts
 * LOCAL-FIRST, SYNC-READY
 */

// TODO: Define schema migrations for local storage.

export type Migration = {
  version: number;
  up: (state: unknown) => unknown;
};

export const MIGRATIONS: Migration[] = [
  // TODO
];

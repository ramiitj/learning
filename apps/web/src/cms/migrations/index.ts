import * as migration_20261015_102216_initial from './20261015_102216_initial';

export const migrations = [
  {
    up: migration_20261015_102216_initial.up,
    down: migration_20261015_102216_initial.down,
    name: '20261015_102216_initial'
  },
];

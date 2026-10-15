import * as migration_20261015_102216_initial from './20261015_102216_initial';
import * as migration_20261015_103821_console_modules from './20261015_103821_console_modules';

export const migrations = [
  {
    up: migration_20261015_102216_initial.up,
    down: migration_20261015_102216_initial.down,
    name: '20261015_102216_initial',
  },
  {
    up: migration_20261015_103821_console_modules.up,
    down: migration_20261015_103821_console_modules.down,
    name: '20261015_103821_console_modules'
  },
];

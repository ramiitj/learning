import * as migration_20261015_102216_initial from './20261015_102216_initial';
import * as migration_20261015_103821_console_modules from './20261015_103821_console_modules';
import * as migration_20261015_110132_analytics from './20261015_110132_analytics';

export const migrations = [
  {
    up: migration_20261015_102216_initial.up,
    down: migration_20261015_102216_initial.down,
    name: '20261015_102216_initial',
  },
  {
    up: migration_20261015_103821_console_modules.up,
    down: migration_20261015_103821_console_modules.down,
    name: '20261015_103821_console_modules',
  },
  {
    up: migration_20261015_110132_analytics.up,
    down: migration_20261015_110132_analytics.down,
    name: '20261015_110132_analytics'
  },
];

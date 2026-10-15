import * as migration_20261015_102216_initial from './20261015_102216_initial';
import * as migration_20261015_103821_console_modules from './20261015_103821_console_modules';
import * as migration_20261015_110132_analytics from './20261015_110132_analytics';
import * as migration_20261015_112809_phase6_ops_lti from './20261015_112809_phase6_ops_lti';
import * as migration_20261015_135955_pilot_passkeys from './20261015_135955_pilot_passkeys';

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
    name: '20261015_110132_analytics',
  },
  {
    up: migration_20261015_112809_phase6_ops_lti.up,
    down: migration_20261015_112809_phase6_ops_lti.down,
    name: '20261015_112809_phase6_ops_lti',
  },
  {
    up: migration_20261015_135955_pilot_passkeys.up,
    down: migration_20261015_135955_pilot_passkeys.down,
    name: '20261015_135955_pilot_passkeys'
  },
];

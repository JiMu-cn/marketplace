const { execSync } = require('child_process');
const path = require('path');

const SCRIPTS_DIR = __dirname;
const reset = process.argv.includes('--reset');

const env = Object.assign({}, process.env, {
  ALLOW_SOURCE_DIRTY: '1',
});

if (reset) {
  env.RESET_BASELINE = '1';
  console.log('[build-all] --reset mode: all versions will be forced to 1.0.0');
  console.log('');
}

const scripts = [
  'build-skills-index.js',
  'build-agents-index.js',
  'build-mcps-index.js',
  'build-teams-index.js',
];

let failed = false;

for (const script of scripts) {
  const scriptPath = path.join(SCRIPTS_DIR, script);
  console.log('--- ' + script + ' ---');
  try {
    execSync('node "' + scriptPath + '"', {
      env: env,
      stdio: 'inherit',
      cwd: path.join(SCRIPTS_DIR, '..'),
    });
  } catch (e) {
    failed = true;
  }
  console.log('');
}

console.log('--- validate-registry.js ---');
try {
  execSync('node "' + path.join(SCRIPTS_DIR, 'validate-registry.js') + '"', {
    stdio: 'inherit',
    cwd: path.join(SCRIPTS_DIR, '..'),
  });
} catch (e) {
  failed = true;
}

if (failed) {
  console.error('');
  console.error('[build-all] Some steps failed.');
  process.exit(1);
} else {
  console.log('');
  console.log('[build-all] All done.');
}

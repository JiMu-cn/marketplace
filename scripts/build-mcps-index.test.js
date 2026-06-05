const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const resourceRoot = path.join(__dirname, '..');
const registryPath = path.join(resourceRoot, 'registry', 'mcps.json');
const scriptPath = path.join(__dirname, 'build-mcps-index.js');
const filesystemPath = path.join(resourceRoot, 'mcps', 'filesystem.json');
const memoryPath = path.join(resourceRoot, 'mcps', 'server-memory.json');

const readRegistry = () => JSON.parse(fs.readFileSync(registryPath, 'utf8'));

test('build-mcps-index generates two MCP entries with builtin and requires_config categories', () => {
  const filesystemFile = JSON.parse(fs.readFileSync(filesystemPath, 'utf8'));
  assert.ok(filesystemFile.filesystem);
  assert.equal(filesystemFile.filesystem.command, 'cmd');

  const memoryFile = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
  assert.ok(memoryFile['server-memory']);
  assert.equal(memoryFile['server-memory'].type, 'stdio');

  execFileSync(process.execPath, [scriptPath], {
    cwd: resourceRoot,
    env: { ...process.env, ALLOW_SOURCE_DIRTY: '1' },
    stdio: 'pipe',
  });

  const registry = readRegistry();

  assert.equal(registry.total, 6);
  assert.ok(Array.isArray(registry.mcps));
  assert.equal(registry.mcps.length, 6);

  const ids = registry.mcps.map(item => item.id).sort();
  assert.deepEqual(ids, ['builtin_todo', 'exa-search', 'filesystem', 'github', 'sequential-thinking', 'server-memory']);

  const filesystem = registry.mcps.find(item => item.id === 'filesystem');
  assert.equal(filesystem.setup_mode, 'requires_config');
  assert.equal(filesystem.builtin, false);
  assert.equal(filesystem.transport_type, 'stdio');
  assert.ok(Array.isArray(filesystem.variables));
  assert.equal(filesystem.variables.length, 1);
  assert.equal(filesystem.variables[0].key, 'ROOT_PATH');

  const memory = registry.mcps.find(item => item.id === 'server-memory');
  assert.equal(memory.setup_mode, 'builtin');
  assert.equal(memory.builtin, true);
  assert.ok(Array.isArray(memory.variables));
  assert.equal(memory.variables.length, 0);
});

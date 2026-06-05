const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const REGISTRY_DIR = path.join(REPO_ROOT, 'registry');

const registries = [
  { file: 'skills.json', key: 'skills', dir: 'skills', idField: 'name', specFile: 'SKILL.md' },
  { file: 'mcps.json',   key: 'mcps',   dir: 'mcps',   idField: 'id',   specFile: null },
  { file: 'agents.json', key: 'agents', dir: 'agents', idField: 'name', specFile: null },
  { file: 'teams.json',  key: 'teams',  dir: 'teams',  idField: 'id',   specFile: null },
];

let errors = 0;

for (const reg of registries) {
  const indexPath = path.join(REGISTRY_DIR, reg.file);
  if (!fs.existsSync(indexPath)) {
    console.log(`[SKIP] ${reg.file} not found`);
    continue;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (e) {
    console.error(`[ERROR] ${reg.file}: invalid JSON - ${e.message}`);
    errors++;
    continue;
  }

  const items = data[reg.key];
  if (!Array.isArray(items)) {
    console.error(`[ERROR] ${reg.file}: missing "${reg.key}" array`);
    errors++;
    continue;
  }

  console.log(`[CHECK] ${reg.file}: ${items.length} entries`);

  const ids = new Set();
  for (const item of items) {
    const id = (item[reg.idField] || '').trim();
    if (!id) {
      console.error(`  [ERROR] entry with empty ${reg.idField}`);
      errors++;
      continue;
    }
    if (ids.has(id)) {
      console.error(`  [ERROR] duplicate ${reg.idField}: ${id}`);
      errors++;
    }
    ids.add(id);

    // Check path exists (directory for skills, file for agents/mcps)
    const itemPath = path.join(REPO_ROOT, reg.dir, item.path || id);
    if (!fs.existsSync(itemPath)) {
      console.error(`  [ERROR] ${id}: not found at ${reg.dir}/${item.path || id}`);
      errors++;
      continue;
    }

    // Check spec file exists (if applicable, only for directory-based resources)
    if (reg.specFile && fs.statSync(itemPath).isDirectory()) {
      const specPath = path.join(itemPath, reg.specFile);
      if (!fs.existsSync(specPath)) {
        console.error(`  [ERROR] ${id}: missing ${reg.specFile}`);
        errors++;
      }
    }
  }
}

if (errors > 0) {
  console.error('');
  console.error('Validation failed with ' + errors + ' error(s)');
  process.exit(1);
} else {
  console.log('');
  console.log('All registries valid.');
}

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..');
const SKILLS_DIR = path.join(REPO_ROOT, 'skills');
const INDEX_PATH = path.join(REPO_ROOT, 'registry', 'skills.json');
const RESET_BASELINE = process.env.RESET_BASELINE === '1';
const ALLOW_SOURCE_DIRTY = process.env.ALLOW_SOURCE_DIRTY === '1';

function parseFrontmatter(content) {
  const result = {};
  const normalized = content.replace(/^\uFEFF/, '');
  let text = '';

  if (normalized.startsWith('---')) {
    const match = normalized.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
    if (!match) return result;
    text = match[1];
  } else {
    // Legacy fallback: only parse the initial contiguous metadata-like header.
    const headerLines = [];
    for (const line of normalized.split('\n')) {
      if (!line.trim()) break;
      if (/^\s/.test(line) || !line.includes(':')) break;
      headerLines.push(line);
    }
    text = headerLines.join('\n');
  }

  const lines = text.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const idx = line.indexOf(':');
    if (idx === -1 || /^\s/.test(line)) { i++; continue; }
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val === '|' || val === '>') {
      const folded = val === '>';
      const multiLines = [];
      i++;
      while (i < lines.length && /^\s/.test(lines[i])) {
        multiLines.push(lines[i].trim());
        i++;
      }
      val = folded ? multiLines.join(' ') : multiLines.join('\n');
      val = val.trim();
    } else {
      i++;
    }
    if (key && val !== undefined) result[key] = val;
  }
  return result;
}

function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.')) files.push(...walkDir(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function relative(dir, fullPath) {
  return fullPath.replace(dir + path.sep, '');
}

function normalizeVersion(version) {
  return String(version || '1.0.0').trim() || '1.0.0';
}

function parseSemver(version) {
  return normalizeVersion(version)
    .replace(/^v/i, '')
    .split('.')
    .map(part => Number.parseInt(part, 10) || 0);
}

function compareSemver(a, b) {
  const av = parseSemver(a);
  const bv = parseSemver(b);
  const len = Math.max(av.length, bv.length);
  for (let i = 0; i < len; i++) {
    const ai = av[i] || 0;
    const bi = bv[i] || 0;
    if (ai > bi) return 1;
    if (ai < bi) return -1;
  }
  return 0;
}

function bumpPatch(version) {
  const parts = parseSemver(version);
  while (parts.length < 3) parts.push(0);
  parts[2] += 1;
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

function loadExistingIndex() {
  if (RESET_BASELINE) return null;
  if (!fs.existsSync(INDEX_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function assertCleanSourcePaths() {
  if (RESET_BASELINE || ALLOW_SOURCE_DIRTY) return;
  const output = execSync('git status --porcelain -- skills agents scripts', {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  }).trim();
  if (!output) return;

  const dirtyLines = output
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !line.includes('registry/'));

  if (dirtyLines.length > 0) {
    throw new Error('Refusing to generate registry from dirty source files. Commit or stash source changes first, or set ALLOW_SOURCE_DIRTY=1. Dirty entries: ' + dirtyLines.join('; '));
  }
}

function normalizeTextValue(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function computeSourceHash(skillDir, entry, files) {
  const hash = crypto.createHash('sha256');
  hash.update(`name:${normalizeTextValue(entry.name)}\n`);
  hash.update(`path:${normalizeTextValue(entry.path)}\n`);
  hash.update(`author:${normalizeTextValue(entry.author)}\n`);
  hash.update(`description:${normalizeTextValue(entry.description)}\n`);
  hash.update(`license:${normalizeTextValue(entry.license)}\n`);
  hash.update(`category:${normalizeTextValue(entry.category)}\n`);
  hash.update(`tags:${normalizeTextValue(entry.tags)}\n`);
  hash.update(`cnb_repo:${normalizeTextValue(entry.cnb_repo)}\n`);
  for (const rel of files.slice().sort()) {
    const abs = path.join(skillDir, rel);
    hash.update(`file:${rel}\n`);
    hash.update(fs.readFileSync(abs));
    hash.update('\n');
  }
  return hash.digest('hex');
}

function buildRegistry(existingIndex) {
  const registry = [];
  const knownPaths = new Set();

  // Retain existing entries whose source directory still exists
  if (existingIndex && Array.isArray(existingIndex.skills) && existingIndex.skills.length > 0) {
    for (const item of existingIndex.skills) {
      const entry = {
        name: String(item.name || '').trim(),
        path: String(item.path || item.name || '').trim(),
        version: normalizeVersion(item.version),
        enabled: item.enabled !== false,
      };
      if (!entry.name || !entry.path) continue;
      const skillMdPath = path.join(SKILLS_DIR, entry.path, 'SKILL.md');
      if (!fs.existsSync(skillMdPath)) {
        console.log('Removed skill (source directory deleted):', entry.path);
        continue;
      }
      registry.push(entry);
      knownPaths.add(entry.path);
    }
  }

  // Discover new skill directories not yet in registry
  const dirs = fs.readdirSync(SKILLS_DIR).filter(f => {
    if (f.startsWith('.') || knownPaths.has(f)) return false;
    const full = path.join(SKILLS_DIR, f);
    return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'SKILL.md'));
  });

  for (const dir of dirs) {
    registry.push({
      name: dir,
      path: dir,
      version: '1.0.0',
      enabled: true,
    });
    console.log('Discovered new skill:', dir);
  }

  return registry;
}

assertCleanSourcePaths();

const existingIndex = loadExistingIndex();
const existingMap = new Map((existingIndex?.skills || []).map(item => [item.name, item]));
const isRegistryMigration = !!(existingIndex && Array.isArray(existingIndex.skills) && existingIndex.skills.some(item => !('path' in item) || !('enabled' in item)));

const registry = buildRegistry(existingIndex);

// 校验：name 不能重复
const nameSet = new Set();
for (const item of registry) {
  if (nameSet.has(item.name)) {
    throw new Error(`Duplicate skill name in registry: ${item.name}`);
  }
  nameSet.add(item.name);
}

const skills = [];

for (const item of registry) {
  if (item.enabled === false) continue;

  const skillDir = path.join(SKILLS_DIR, item.path);
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    throw new Error(`Missing SKILL.md for registered skill: ${item.name} -> skills/${item.path}`);
  }

  const content = fs.readFileSync(skillMdPath, 'utf8');
  const fm = parseFrontmatter(content);
  const skillName = String(fm.name || '').trim();
  if (!skillName) {
    throw new Error(`Missing frontmatter name in skills/${item.path}/SKILL.md`);
  }
  if (skillName !== item.name) {
    throw new Error(`Registry mismatch for skills/${item.path}: registry name=${item.name}, SKILL.md name=${skillName}`);
  }

  const allFiles = walkDir(skillDir)
    .filter(f => !f.includes(path.sep + 'node_modules' + path.sep))
    .map(f => relative(skillDir, f));

  let totalSize = 0;
  for (const f of allFiles) {
    try { totalSize += fs.statSync(path.join(skillDir, f)).size; } catch {}
  }

  const licenseFiles = ['LICENSE', 'LICENSE.txt', 'LICENSE.md'];
  let license = '';
  for (const lf of licenseFiles) {
    const lp = path.join(skillDir, lf);
    if (fs.existsSync(lp)) {
      try { license = fs.readFileSync(lp, 'utf8').slice(0, 100); break; } catch {}
    }
  }

  const baseEntry = {
    name: item.name,
    path: item.path,
    version: normalizeVersion(item.version),
    enabled: item.enabled !== false,
    author: fm.author || '',
    description: fm.description || '',
    license: fm.license || license,
    category: fm.category || '',
    tags: fm.tags || '',
    cnb_repo: 'jimu/mat/skill',
    download_url: '',
    sha256: '',
    file_count: allFiles.length,
    total_size: totalSize,
    files: allFiles,
    updated_at: fs.statSync(skillMdPath).mtime.toISOString(),
  };

  const source_hash = computeSourceHash(skillDir, baseEntry, allFiles);
  const prev = existingMap.get(item.name);

  let version = '1.0.0';
  if (!RESET_BASELINE) {
    version = normalizeVersion(item.version);
    if (prev) {
      const prevVersion = normalizeVersion(prev.version);
      const prevHash = normalizeTextValue(prev.source_hash);
      if (isRegistryMigration || !prevHash) {
        version = prevVersion;
      } else if (prevHash === source_hash) {
        version = prevVersion;
      } else if (compareSemver(item.version, prevVersion) > 0) {
        version = normalizeVersion(item.version);
      } else {
        version = bumpPatch(prevVersion);
      }
    }
  }

  skills.push({
    ...baseEntry,
    version,
    source_hash,
  });
}

const index = {
  version: '1.0.0',
  generated_at: new Date().toISOString(),
  total: skills.length,
  skills,
};

fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2), 'utf8');
console.log('Generated', INDEX_PATH, ':', index.total, 'skills');

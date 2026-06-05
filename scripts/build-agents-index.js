const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..');
const AGENTS_DIR = path.join(REPO_ROOT, 'agents');
const INDEX_PATH = path.join(REPO_ROOT, 'registry', 'agents.json');
const RESET_BASELINE = process.env.RESET_BASELINE === '1';
const ALLOW_SOURCE_DIRTY = process.env.ALLOW_SOURCE_DIRTY === '1';

/**
 * Lightweight YAML parser for agent YAML files.
 * Handles top-level scalar fields and the multi-line systemPrompt block.
 * Does NOT handle nested arrays/objects beyond simple "- item" lists.
 */
function parseAgentYaml(content) {
  const result = {};
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Skip blank lines and comments
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }
    // Must be a top-level key (no leading whitespace)
    if (/^\s/.test(line)) { i++; continue; }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) { i++; continue; }

    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();

    // Block scalar: | or >
    if (val === '|' || val === '>') {
      const folded = val === '>';
      const multiLines = [];
      i++;
      while (i < lines.length && (/^\s/.test(lines[i]) || lines[i].trim() === '')) {
        multiLines.push(lines[i].replace(/^ {2}/, ''));
        i++;
      }
      // Trim trailing empty lines
      while (multiLines.length > 0 && multiLines[multiLines.length - 1].trim() === '') {
        multiLines.pop();
      }
      val = folded ? multiLines.map(l => l.trim()).join(' ') : multiLines.join('\n');
      val = val.trim();
    }
    // Simple list: next lines start with "  - "
    else if (val === '') {
      i++;
      const items = [];
      while (i < lines.length && /^\s+-\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s+-\s*/, '').trim());
        i++;
      }
      if (items.length > 0) {
        result[key] = items;
        continue;
      }
      // Empty value, no list follows
      result[key] = '';
      continue;
    } else {
      // Strip quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      i++;
    }

    if (key) result[key] = val;
  }
  return result;
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
  return parts.join('.');
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

function computeSourceHash(agentFilePath, entry) {
  const hash = crypto.createHash('sha256');
  hash.update('name:' + normalizeTextValue(entry.name) + '\n');
  hash.update('path:' + normalizeTextValue(entry.path) + '\n');
  hash.update('description:' + normalizeTextValue(entry.description) + '\n');
  hash.update('file:' + entry.path + '\n');
  hash.update(fs.readFileSync(agentFilePath));
  hash.update('\n');
  return hash.digest('hex');
}

function buildRegistry(existingIndex) {
  const registry = [];
  const knownPaths = new Set();

  // Retain existing entries whose source file still exists
  if (existingIndex && Array.isArray(existingIndex.agents) && existingIndex.agents.length > 0) {
    for (const item of existingIndex.agents) {
      const entry = {
        name: String(item.name || '').trim(),
        path: String(item.path || '').trim(),
        version: normalizeVersion(item.version),
        enabled: item.enabled !== false,
      };
      if (!entry.name || !entry.path) continue;
      const filePath = path.join(AGENTS_DIR, entry.path);
      if (!fs.existsSync(filePath)) {
        console.log('Removed agent (source file deleted):', entry.path);
        continue;
      }
      registry.push(entry);
      knownPaths.add(entry.path);
    }
  }

  // Discover new files not yet in registry
  const files = fs.readdirSync(AGENTS_DIR).filter(f => {
    return (f.endsWith('.yaml') || f.endsWith('.yml')) && !knownPaths.has(f);
  });

  for (const f of files) {
    const content = fs.readFileSync(path.join(AGENTS_DIR, f), 'utf8');
    const parsed = parseAgentYaml(content);
    registry.push({
      name: parsed.name || path.basename(f, path.extname(f)),
      path: f,
      version: '1.0.0',
      enabled: true,
    });
    console.log('Discovered new agent:', f);
  }

  return registry;
}

// --- Main ---
assertCleanSourcePaths();

const existingIndex = loadExistingIndex();
const existingMap = new Map((existingIndex?.agents || []).map(item => [item.name, item]));

const registry = buildRegistry(existingIndex);

// Validate: no duplicate names
const nameSet = new Set();
for (const item of registry) {
  if (nameSet.has(item.name)) {
    throw new Error('Duplicate agent name in registry: ' + item.name);
  }
  nameSet.add(item.name);
}

const agents = [];

for (const item of registry) {
  if (item.enabled === false) continue;

  const agentFilePath = path.join(AGENTS_DIR, item.path);
  if (!fs.existsSync(agentFilePath)) {
    throw new Error('Missing agent file for registered agent: ' + item.name + ' -> agents/' + item.path);
  }

  const content = fs.readFileSync(agentFilePath, 'utf8');
  const parsed = parseAgentYaml(content);

  const displayName = parsed.displayName || parsed.display_name || '';
  const description = parsed.description || '';
  const author = parsed.author || '';
  const tags = Array.isArray(parsed.tags) ? parsed.tags : [];
  const tools = Array.isArray(parsed.tools) ? parsed.tools : [];
  const systemPrompt = parsed.systemPrompt || parsed.system_prompt || '';
  const fileSize = fs.statSync(agentFilePath).size;

  const baseEntry = {
    name: item.name,
    path: item.path,
    version: normalizeVersion(item.version),
    enabled: item.enabled !== false,
    display_name: displayName,
    description: description,
    author: author,
    tags: tags,
    tools: tools,
    system_prompt: systemPrompt,
    file_size: fileSize,
    updated_at: fs.statSync(agentFilePath).mtime.toISOString(),
  };

  const source_hash = computeSourceHash(agentFilePath, baseEntry);
  const prev = existingMap.get(item.name);

  let version = '1.0.0';
  if (!RESET_BASELINE) {
    version = normalizeVersion(item.version);
    if (prev) {
      const prevVersion = normalizeVersion(prev.version);
      const prevHash = normalizeTextValue(prev.source_hash);
      if (!prevHash) {
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

  agents.push({
    ...baseEntry,
    version,
    source_hash,
  });
}

const index = {
  version: '1.0.0',
  generated_at: new Date().toISOString(),
  total: agents.length,
  agents,
};

fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2), 'utf8');
console.log('Generated', INDEX_PATH, ':', index.total, 'agents');

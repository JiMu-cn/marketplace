const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..');
const MCPS_DIR = path.join(REPO_ROOT, 'mcps');
const INDEX_PATH = path.join(REPO_ROOT, 'registry', 'mcps.json');
const RESET_BASELINE = process.env.RESET_BASELINE === '1';
const ALLOW_SOURCE_DIRTY = process.env.ALLOW_SOURCE_DIRTY === '1';

const MCP_METADATA_CATALOG = {
  'filesystem': {
    displayName: '文件系统访问',
    description: '允许 AI 读写本地文件系统，支持文件的创建、读取、修改和删除操作。',
    author: 'ModelContextProtocol',
    version: '1.0.0',
    icon: '📁',
    homepage: 'https://www.npmjs.com/package/@modelcontextprotocol/server-filesystem',
    tags: ['官方', '热门', '必备'],
    setupMode: 'requires_config',
    builtin: false,
    variables: [
      {
        key: 'ROOT_PATH',
        label: '允许访问目录',
        type: 'path',
        required: true,
        secret: false,
        description: 'MCP 可访问的本地目录路径，填入后会自动替换模板中的中文提示。例如：D:/Work、C:/Users/你的用户名/Documents'
      }
    ],
    requirements: {
      platforms: ['win32', 'darwin', 'linux'],
      runtimes: ['node', 'npx']
    },
    permissions: {
      filesystem: 'read_write',
      network: false,
      shell: false
    }
  },
  'builtin_todo': {
    displayName: '待办事项管理',
    description: '内置待办事项管理 MCP，帮助 AI 追踪和管理任务清单。无需配置即可使用。',
    author: '积木',
    version: '1.0.0',
    icon: '📝',
    homepage: '',
    tags: ['官方', '内置', '必备'],
    setupMode: 'builtin',
    builtin: true,
    variables: [],
    requirements: {
      platforms: ['win32', 'darwin', 'linux'],
      runtimes: ['node', 'npx']
    },
    permissions: {
      filesystem: 'none',
      network: false,
      shell: false
    }
  },
  'server-memory': {
    displayName: '内存知识图谱',
    description: '为 AI 提供持久化记忆能力。',
    author: 'ModelContextProtocol',
    version: '1.0.0',
    icon: '💾',
    homepage: 'https://www.npmjs.com/package/@modelcontextprotocol/server-memory',
    tags: ['官方', '记忆'],
    setupMode: 'builtin',
    builtin: true,
    variables: [],
    requirements: {
      platforms: ['win32', 'darwin', 'linux'],
      runtimes: ['node', 'npx']
    },
    permissions: {
      filesystem: 'none',
      network: false,
      shell: false
    }
  },
  'sequential-thinking': {
    displayName: '顺序思维',
    description: '帮助 AI 进行结构化顺序思考，提升复杂问题处理能力。',
    author: 'ModelContextProtocol',
    version: '1.0.0',
    icon: '🧠',
    homepage: '',
    tags: ['官方', 'AI增强'],
    setupMode: 'builtin',
    builtin: true,
    variables: [],
    requirements: {
      platforms: ['win32', 'darwin', 'linux'],
      runtimes: ['node', 'npx']
    },
    permissions: {
      filesystem: 'none',
      network: false,
      shell: false
    }
  },
  'exa-search': {
    displayName: 'Exa 智能搜索',
    description: '使用 Exa AI 进行高质量网络搜索，支持语义搜索和精确查询。',
    author: 'Exa',
    version: '1.0.0',
    icon: '🔎',
    homepage: 'https://exa.ai',
    tags: ['AI增强', '搜索'],
    setupMode: 'requires_config',
    builtin: false,
    variables: [
      {
        key: 'EXA_API_KEY',
        label: 'Exa API Key',
        type: 'secret',
        required: true,
        secret: true,
        description: '请替换为你自己的 Exa API Key，否则该 MCP 无法正常调用搜索服务。'
      }
    ],
    requirements: {
      platforms: ['win32', 'darwin', 'linux'],
      runtimes: ['node', 'npx']
    },
    permissions: {
      filesystem: 'none',
      network: true,
      shell: false
    }
  }
};

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
  const output = execSync('git status --porcelain -- mcps scripts', {
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

function computeSourceHash(mcpFilePath, entry) {
  const hash = crypto.createHash('sha256');
  hash.update('id:' + normalizeTextValue(entry.id) + '\n');
  hash.update('path:' + normalizeTextValue(entry.path) + '\n');
  hash.update('display_name:' + normalizeTextValue(entry.display_name) + '\n');
  hash.update('description:' + normalizeTextValue(entry.description) + '\n');
  hash.update('author:' + normalizeTextValue(entry.author) + '\n');
  hash.update('tags:' + normalizeTextValue(entry.tags) + '\n');
  hash.update('setup_mode:' + normalizeTextValue(entry.setup_mode) + '\n');
  hash.update('builtin:' + normalizeTextValue(entry.builtin) + '\n');
  hash.update('transport_type:' + normalizeTextValue(entry.transport_type) + '\n');
  hash.update('command:' + normalizeTextValue(entry.command) + '\n');
  hash.update('args:' + normalizeTextValue(entry.args) + '\n');
  hash.update('env:' + normalizeTextValue(entry.env) + '\n');
  hash.update('variables:' + normalizeTextValue(entry.variables) + '\n');
  hash.update('requirements:' + normalizeTextValue(entry.requirements) + '\n');
  hash.update('permissions:' + normalizeTextValue(entry.permissions) + '\n');
  hash.update('file:' + entry.path + '\n');
  hash.update(fs.readFileSync(mcpFilePath));
  hash.update('\n');
  return hash.digest('hex');
}

function readDirectMCPFile(mcpFilePath) {
  const content = JSON.parse(fs.readFileSync(mcpFilePath, 'utf8'));
  const keys = Object.keys(content);
  if (keys.length !== 1) {
    throw new Error(`MCP file must contain exactly one top-level server entry: ${mcpFilePath}`);
  }
  const id = String(keys[0] || '').trim();
  if (!id) {
    throw new Error(`MCP file has empty top-level server key: ${mcpFilePath}`);
  }
  const transport = content[id];
  if (!transport || typeof transport !== 'object' || Array.isArray(transport)) {
    throw new Error(`MCP file top-level entry must be an object: ${mcpFilePath}`);
  }
  return { id, transport, raw: content };
}

function inferVariables(args, env) {
  const vars = [];
  const seen = new Set();

  for (const arg of args) {
    if (typeof arg !== 'string') continue;
    const upper = arg.toUpperCase();
    if (upper.includes('请替换为你要授权') || upper.includes('D:/WORK') || upper.includes('C:/USERS/你的用户名/DOCUMENTS')) {
      if (!seen.has('ROOT_PATH')) {
        seen.add('ROOT_PATH');
        vars.push({
          key: 'ROOT_PATH',
          label: '授权目录路径',
          type: 'path',
          required: true,
          secret: false,
          description: '请将该字符串替换成你要授权给 MCP 访问的本地目录路径。'
        });
      }
      continue;
    }
    const matches = [...arg.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)];
    for (const match of matches) {
      const key = match[1];
      if (!key || seen.has(key)) continue;
      seen.add(key);
      vars.push({
        key,
        label: key,
        type: key.includes('PATH') ? 'path' : 'string',
        required: true,
        secret: false,
        description: '使用前请填写该变量。'
      });
    }
  }

  if (env && typeof env === 'object') {
    for (const key of Object.keys(env)) {
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const upper = key.toUpperCase();
      const isSecret = upper.includes('KEY') || upper.includes('TOKEN') || upper.includes('SECRET') || upper.includes('PASSWORD');
      vars.push({
        key,
        label: key,
        type: isSecret ? 'secret' : 'string',
        required: true,
        secret: isSecret,
        description: '运行该 MCP 所需的环境变量。'
      });
    }
  }

  return vars;
}

function buildRegistry(existingIndex) {
  const registry = [];
  const knownPaths = new Set();

  // Retain existing entries whose source file still exists
  if (existingIndex && Array.isArray(existingIndex.mcps) && existingIndex.mcps.length > 0) {
    for (const item of existingIndex.mcps) {
      const entry = {
        id: String(item.id || '').trim(),
        path: String(item.path || '').trim(),
        version: normalizeVersion(item.version),
        enabled: item.enabled !== false,
      };
      if (!entry.id || !entry.path) continue;
      const filePath = path.join(MCPS_DIR, entry.path);
      if (!fs.existsSync(filePath)) {
        console.log('Removed MCP (source file deleted):', entry.path);
        continue;
      }
      registry.push(entry);
      knownPaths.add(entry.path);
    }
  }

  // Discover new files not yet in registry
  const files = fs.readdirSync(MCPS_DIR).filter(file =>
    file.endsWith('.json') && !file.startsWith('.') && !knownPaths.has(file)
  );

  for (const file of files) {
    const parsed = readDirectMCPFile(path.join(MCPS_DIR, file));
    registry.push({
      id: parsed.id,
      path: file,
      version: normalizeVersion(MCP_METADATA_CATALOG[parsed.id]?.version),
      enabled: true,
    });
    console.log('Discovered new MCP:', file);
  }

  return registry;
}

assertCleanSourcePaths();

const existingIndex = loadExistingIndex();
const existingMap = new Map((existingIndex?.mcps || []).map(item => [item.id, item]));
const registry = buildRegistry(existingIndex);

const idSet = new Set();
for (const item of registry) {
  if (idSet.has(item.id)) {
    throw new Error('Duplicate MCP id in registry: ' + item.id);
  }
  idSet.add(item.id);
}

const mcps = [];

for (const item of registry) {
  if (item.enabled === false) continue;

  const mcpFilePath = path.join(MCPS_DIR, item.path);
  if (!fs.existsSync(mcpFilePath)) {
    throw new Error('Missing MCP file for registered MCP: ' + item.id + ' -> mcps/' + item.path);
  }

  const parsed = readDirectMCPFile(mcpFilePath);
  if (parsed.id !== item.id) {
    throw new Error(`Registry mismatch for mcps/${item.path}: registry id=${item.id}, file id=${parsed.id}`);
  }

  const meta = MCP_METADATA_CATALOG[item.id] || {};
  const transport = parsed.transport || {};
  const transportType = String(transport.type || '').trim();
  const command = String(transport.command || '').trim();
  const args = Array.isArray(transport.args) ? transport.args : [];
  const env = transport.env && typeof transport.env === 'object' ? transport.env : {};
  const variables = Array.isArray(meta.variables) ? meta.variables : inferVariables(args, env);
  const requirements = meta.requirements && typeof meta.requirements === 'object' ? meta.requirements : {};
  const permissions = meta.permissions && typeof meta.permissions === 'object' ? meta.permissions : {};
  const tags = Array.isArray(meta.tags) ? meta.tags : [];
  const builtin = typeof meta.builtin === 'boolean'
    ? meta.builtin
    : !(variables.length > 0 || Object.keys(env).length > 0 || args.some(arg => typeof arg === 'string' && (arg.includes('{{') || arg.includes('请替换'))));
  const setupMode = String(meta.setupMode || (builtin ? 'builtin' : 'requires_config')).trim() || 'requires_config';
  const fileSize = fs.statSync(mcpFilePath).size;

  const baseEntry = {
    id: item.id,
    path: item.path,
    version: normalizeVersion(item.version || meta.version),
    enabled: item.enabled !== false,
    display_name: String(meta.displayName || item.id).trim(),
    description: String(meta.description || '').trim(),
    author: String(meta.author || '').trim(),
    icon: String(meta.icon || '').trim(),
    homepage: String(meta.homepage || '').trim(),
    tags,
    setup_mode: setupMode,
    builtin,
    transport_type: transportType,
    command,
    args,
    env,
    variables,
    requirements,
    permissions,
    file_size: fileSize,
    updated_at: fs.statSync(mcpFilePath).mtime.toISOString(),
  };

  const source_hash = computeSourceHash(mcpFilePath, baseEntry);
  const prev = existingMap.get(item.id);

  let version = '1.0.0';
  if (!RESET_BASELINE) {
    version = normalizeVersion(item.version || meta.version);
    if (prev) {
      const prevVersion = normalizeVersion(prev.version);
      const prevHash = normalizeTextValue(prev.source_hash);
      if (!prevHash) {
        version = prevVersion;
      } else if (prevHash === source_hash) {
        version = prevVersion;
      } else if (compareSemver(item.version || meta.version, prevVersion) > 0) {
        version = normalizeVersion(item.version || meta.version);
      } else {
        version = bumpPatch(prevVersion);
      }
    }
  }

  mcps.push({
    ...baseEntry,
    version,
    source_hash,
  });
}

const index = {
  version: '1.0.0',
  generated_at: new Date().toISOString(),
  total: mcps.length,
  mcps,
};

fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2), 'utf8');
console.log('Generated', INDEX_PATH, ':', index.total, 'mcps');

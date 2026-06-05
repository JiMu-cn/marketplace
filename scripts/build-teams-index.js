const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const REPO_ROOT = path.join(__dirname, "..");
const TEAMS_DIR = path.join(REPO_ROOT, "teams");
const INDEX_PATH = path.join(REPO_ROOT, "registry", "teams.json");
const RESET_BASELINE = process.env.RESET_BASELINE === "1";
const ALLOW_SOURCE_DIRTY = process.env.ALLOW_SOURCE_DIRTY === "1";

const TEAM_METADATA_CATALOG = {
  team: {
    displayName: "\u5F00\u53D1\u56E2\u961F",
    description:
      "\u5B8C\u6574\u7684\u5E94\u7528\u5F00\u53D1\u56E2\u961F\u914D\u7F6E\uFF0C\u5305\u542B\u9879\u76EE\u7ECF\u7406\u3001\u8BBE\u8BA1\u5E08\u3001\u524D\u540E\u7AEF\u5F00\u53D1\u3001\u6D4B\u8BD5\u548C DevOps \u5DE5\u7A0B\u5E08\u3002",
    author: "\u79EF\u6728",
    version: "1.0.0",
    icon: "\uD83D\uDC65",
    tags: ["\u5B98\u65B9", "\u5F00\u53D1", "\u5B8C\u6574\u56E2\u961F"],
  },
};

/**
 * Lightweight YAML parser for team YAML files.
 */
function parseTeamYaml(content) {
  var result = { members: [] };
  var lines = content.split(/\r?\n/);
  var i = 0;

  function getIndent(line) {
    var m = line.match(/^(\s*)/);
    return m ? m[1].length : 0;
  }

  while (i < lines.length) {
    var line = lines[i];
    if (!line.trim() || line.trim().charAt(0) === "#") {
      i++;
      continue;
    }
    if (/^\s/.test(line)) {
      i++;
      continue;
    }

    var colonIdx = line.indexOf(":");
    if (colonIdx === -1) {
      i++;
      continue;
    }

    var key = line.slice(0, colonIdx).trim();
    var val = line.slice(colonIdx + 1).trim();

    if (key === "members") {
      i++;
      while (i < lines.length) {
        var mLine = lines[i];
        if (!mLine.trim() || mLine.trim().charAt(0) === "#") {
          i++;
          continue;
        }
        if (getIndent(mLine) === 0 && mLine.trim()) break;

        if (/^\s+-\s+\w+/.test(mLine)) {
          var member = {};
          var firstMatch = mLine.match(/^\s+-\s+(\w+):\s*(.*)/);
          if (firstMatch) {
            member[firstMatch[1]] = firstMatch[2].trim();
          }
          i++;
          var memberIndent = getIndent(mLine) + 2;

          while (i < lines.length) {
            var subLine = lines[i];
            if (!subLine.trim()) {
              i++;
              continue;
            }
            var subIndent = getIndent(subLine);
            if (subIndent < memberIndent) break;

            var subColonIdx = subLine.indexOf(":");
            if (subColonIdx === -1) {
              i++;
              continue;
            }

            var subKey = subLine.slice(0, subColonIdx).trim();
            var subVal = subLine.slice(subColonIdx + 1).trim();

            if (subVal === "|-" || subVal === "|" || subVal === ">") {
              var multiLines = [];
              i++;
              while (
                i < lines.length &&
                (getIndent(lines[i]) > subIndent || lines[i].trim() === "")
              ) {
                multiLines.push(
                  lines[i].replace(/^ {6}/, "").replace(/^ {4}/, "")
                );
                i++;
              }
              while (
                multiLines.length > 0 &&
                multiLines[multiLines.length - 1].trim() === ""
              ) {
                multiLines.pop();
              }
              member[subKey] = multiLines.join("\n").trim();
              continue;
            }

            if (subVal === "") {
              i++;
              var items = [];
              while (
                i < lines.length &&
                /^\s+-\s/.test(lines[i]) &&
                getIndent(lines[i]) > subIndent
              ) {
                items.push(lines[i].replace(/^\s+-\s*/, "").trim());
                i++;
              }
              if (items.length > 0) {
                member[subKey] = items;
                continue;
              }
              member[subKey] = "";
              continue;
            }

            member[subKey] = subVal;
            i++;
          }
          result.members.push(member);
        } else {
          i++;
        }
      }
      continue;
    }

    if (val === "|" || val === "|-" || val === ">") {
      var blockLines = [];
      i++;
      while (
        i < lines.length &&
        (/^\s/.test(lines[i]) || lines[i].trim() === "")
      ) {
        blockLines.push(lines[i].replace(/^ {2}/, ""));
        i++;
      }
      while (
        blockLines.length > 0 &&
        blockLines[blockLines.length - 1].trim() === ""
      ) {
        blockLines.pop();
      }
      result[key] = blockLines.join("\n").trim();
      continue;
    }

    if (val === "") {
      i++;
      var listItems = [];
      while (i < lines.length && /^\s+-\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s+-\s*/, "").trim());
        i++;
      }
      if (listItems.length > 0) {
        result[key] = listItems;
        continue;
      }
      result[key] = "";
      continue;
    }

    result[key] = val;
    i++;
  }

  return result;
}

function normalizeVersion(version) {
  return String(version || "1.0.0").trim() || "1.0.0";
}

function parseSemver(version) {
  return normalizeVersion(version)
    .replace(/^v/i, "")
    .split(".")
    .map(function (part) {
      return Number.parseInt(part, 10) || 0;
    });
}

function compareSemver(a, b) {
  var av = parseSemver(a);
  var bv = parseSemver(b);
  var len = Math.max(av.length, bv.length);
  for (var j = 0; j < len; j++) {
    var ai = av[j] || 0;
    var bi = bv[j] || 0;
    if (ai > bi) return 1;
    if (ai < bi) return -1;
  }
  return 0;
}

function bumpPatch(version) {
  var parts = parseSemver(version);
  while (parts.length < 3) parts.push(0);
  parts[2] += 1;
  return parts.join(".");
}

function loadExistingIndex() {
  if (RESET_BASELINE) return null;
  if (!fs.existsSync(INDEX_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  } catch (e) {
    return null;
  }
}

function assertCleanSourcePaths() {
  if (RESET_BASELINE || ALLOW_SOURCE_DIRTY) return;
  var output = execSync("git status --porcelain -- teams scripts", {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).trim();
  if (!output) return;

  var dirtyLines = output
    .split("\n")
    .map(function (l) {
      return l.trim();
    })
    .filter(Boolean)
    .filter(function (l) {
      return l.indexOf("registry/") === -1;
    });

  if (dirtyLines.length > 0) {
    throw new Error(
      "Refusing to generate registry from dirty source files. Commit or stash source changes first, or set ALLOW_SOURCE_DIRTY=1. Dirty entries: " +
        dirtyLines.join("; ")
    );
  }
}

function normalizeTextValue(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function computeSourceHash(filePath, entry) {
  var hash = crypto.createHash("sha256");
  hash.update("id:" + normalizeTextValue(entry.id) + "\n");
  hash.update("path:" + normalizeTextValue(entry.path) + "\n");
  hash.update("display_name:" + normalizeTextValue(entry.display_name) + "\n");
  hash.update("description:" + normalizeTextValue(entry.description) + "\n");
  hash.update("author:" + normalizeTextValue(entry.author) + "\n");
  hash.update("tags:" + normalizeTextValue(entry.tags) + "\n");
  hash.update("member_count:" + normalizeTextValue(entry.member_count) + "\n");
  hash.update("members:" + normalizeTextValue(entry.members) + "\n");
  hash.update(
    "depends_on_agents:" + normalizeTextValue(entry.depends_on_agents) + "\n"
  );
  hash.update(
    "depends_on_skills:" + normalizeTextValue(entry.depends_on_skills) + "\n"
  );
  hash.update("file:" + entry.path + "\n");
  hash.update(fs.readFileSync(filePath));
  hash.update("\n");
  return hash.digest("hex");
}

function buildRegistry(existingIndex) {
  var registry = [];
  var knownPaths = new Set();

  if (
    existingIndex &&
    Array.isArray(existingIndex.teams) &&
    existingIndex.teams.length > 0
  ) {
    for (var ei = 0; ei < existingIndex.teams.length; ei++) {
      var item = existingIndex.teams[ei];
      var entry = {
        id: String(item.id || "").trim(),
        path: String(item.path || "").trim(),
        version: normalizeVersion(item.version),
        enabled: item.enabled !== false,
      };
      if (!entry.id || !entry.path) continue;
      var filePath = path.join(TEAMS_DIR, entry.path);
      if (!fs.existsSync(filePath)) {
        console.log("Removed Team (source file deleted):", entry.path);
        continue;
      }
      registry.push(entry);
      knownPaths.add(entry.path);
    }
  }

  var files = fs.readdirSync(TEAMS_DIR).filter(function (file) {
    return (
      (file.endsWith(".yaml") || file.endsWith(".yml")) &&
      !file.startsWith(".") &&
      !file.startsWith("_") &&
      !knownPaths.has(file)
    );
  });

  for (var fi = 0; fi < files.length; fi++) {
    var file = files[fi];
    var content = fs.readFileSync(path.join(TEAMS_DIR, file), "utf8");
    var parsed = parseTeamYaml(content);
    var id = String(
      parsed.name || path.basename(file, path.extname(file))
    ).trim();
    registry.push({
      id: id,
      path: file,
      version: normalizeVersion(
        TEAM_METADATA_CATALOG[id] ? TEAM_METADATA_CATALOG[id].version : "1.0.0"
      ),
      enabled: true,
    });
    console.log("Discovered new Team:", file);
  }

  return registry;
}

// --- Main ---

assertCleanSourcePaths();

var existingIndex = loadExistingIndex();
var existingMap = new Map(
  (existingIndex && existingIndex.teams ? existingIndex.teams : []).map(
    function (item) {
      return [item.id, item];
    }
  )
);
var registry = buildRegistry(existingIndex);

var idSet = new Set();
for (var ri = 0; ri < registry.length; ri++) {
  if (idSet.has(registry[ri].id)) {
    throw new Error("Duplicate Team id in registry: " + registry[ri].id);
  }
  idSet.add(registry[ri].id);
}

var teams = [];

for (var ti = 0; ti < registry.length; ti++) {
  var item = registry[ti];
  if (item.enabled === false) continue;

  var teamFilePath = path.join(TEAMS_DIR, item.path);
  if (!fs.existsSync(teamFilePath)) {
    throw new Error(
      "Missing Team file for registered Team: " +
        item.id +
        " -> teams/" +
        item.path
    );
  }

  var content = fs.readFileSync(teamFilePath, "utf8");
  var parsed = parseTeamYaml(content);
  var meta = TEAM_METADATA_CATALOG[item.id] || {};

  var members = (parsed.members || []).map(function (m) {
    return {
      role: String(m.role || "").trim(),
      description: String(m.description || "").trim(),
      agent: String(m.agent || "").trim() || null,
      system_prompt: String(m.system_prompt || "").trim() || null,
      model: String(m.model || "").trim() || null,
      skills: Array.isArray(m.skills) ? m.skills : [],
      tools: Array.isArray(m.tools) ? m.tools : [],
    };
  });

  var agentSet = new Set();
  var skillSet = new Set();
  for (var mi = 0; mi < members.length; mi++) {
    if (members[mi].agent) agentSet.add(members[mi].agent);
    var mSkills = members[mi].skills || [];
    for (var si = 0; si < mSkills.length; si++) {
      skillSet.add(mSkills[si]);
    }
  }
  var dependsOnAgents = Array.from(agentSet);
  var dependsOnSkills = Array.from(skillSet);
  var tags = Array.isArray(meta.tags) ? meta.tags : [];
  var fileSize = fs.statSync(teamFilePath).size;

  var baseEntry = {
    id: item.id,
    path: item.path,
    version: normalizeVersion(item.version || meta.version),
    enabled: item.enabled !== false,
    display_name: String(
      parsed.displayName || meta.displayName || item.id
    ).trim(),
    description: String(
      parsed.description || meta.description || ""
    ).trim(),
    author: String(meta.author || "").trim(),
    icon: String(meta.icon || "\uD83D\uDC65").trim(),
    tags: tags,
    member_count: members.length,
    members: members,
    depends_on_agents: dependsOnAgents,
    depends_on_skills: dependsOnSkills,
    file_size: fileSize,
    updated_at: fs.statSync(teamFilePath).mtime.toISOString(),
  };

  var source_hash = computeSourceHash(teamFilePath, baseEntry);
  var prev = existingMap.get(item.id);

  var version = "1.0.0";
  if (!RESET_BASELINE) {
    version = normalizeVersion(item.version || meta.version);
    if (prev) {
      var prevVersion = normalizeVersion(prev.version);
      var prevHash = normalizeTextValue(prev.source_hash);
      if (!prevHash) {
        version = prevVersion;
      } else if (prevHash === source_hash) {
        version = prevVersion;
      } else if (
        compareSemver(item.version || meta.version, prevVersion) > 0
      ) {
        version = normalizeVersion(item.version || meta.version);
      } else {
        version = bumpPatch(prevVersion);
      }
    }
  }

  baseEntry.version = version;
  baseEntry.source_hash = source_hash;
  teams.push(baseEntry);
}

var index = {
  version: "1.0.0",
  generated_at: new Date().toISOString(),
  total: teams.length,
  teams: teams,
};

fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2), "utf8");
console.log("Generated", INDEX_PATH, ":", index.total, "teams");

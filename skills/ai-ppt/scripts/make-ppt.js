/**
 * make-ppt.js - 一口价 PPT 生成器
 *
 * 将 chart-script-gen + python charts + build-ppt 三步合并为一步。
 * 这是 ai-ppt skill 的"工程化落地"入口。
 *
 * 用法:
 *   node make-ppt.js <outline.json> [output.pptx] [--theme <id>] [--skip-charts] [--preview]
 *
 * 示例:
 *   node make-ppt.js my_ppt.json
 *   node make-ppt.js my_ppt.json output.pptx --theme light-business
 *   node make-ppt.js my_ppt.json --skip-charts   # 已跑过图表，跳过
 *   node make-ppt.js my_ppt.json --preview       # 生成 HTML 预览
 */

var fs = require('fs');
var path = require('path');
var cp = require('child_process');

// ============================================================
// CLI 入口
// ============================================================

function main() {
  var args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: node make-ppt.js <outline.json> [output.pptx] [--theme <id>] [--skip-charts] [--preview]');
    console.log('');
    console.log('Options:');
    console.log('  --theme <id>     强制指定主题 (覆盖自动推荐)');
    console.log('  --skip-charts    跳过图表生成 (已生成过图表时使用)');
    console.log('  --preview        生成 HTML 结构预览 (浏览器打开, 建议首次运行使用)');
    console.log('  --density <mode> 卡片密度: compact(紧凑) | normal(默认) | spacious(呼吸感)');
    console.log('');
    var themes = require('./themes');
    console.log('Available themes: ' + themes.listThemes().map(function(t) { return t.id; }).join(', '));
    process.exit(1);
  }

  var jsonPath = args[0];
  if (!fs.existsSync(jsonPath)) {
    console.error('Error: File not found: ' + jsonPath);
    process.exit(1);
  }

  // 解析参数
  var outputPath = null;
  var themeId = null;
  var skipCharts = false;
  var doPreview = false;
  var density = null;

  for (var i = 1; i < args.length; i++) {
    if (args[i] === '--theme' && args[i + 1]) {
      themeId = args[i + 1];
      i++;
    } else if (args[i] === '--skip-charts') {
      skipCharts = true;
    } else if (args[i] === '--preview') {
      doPreview = true;
    } else if (args[i] === '--density' && args[i + 1]) {
      density = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--') && !outputPath) {
      outputPath = args[i];
    }
  }

  if (!outputPath) {
    outputPath = jsonPath.replace(/\.json$/, '.pptx');
  }

  console.log('========================================');
  console.log('  AI-PPT 一口价生成器 v1.3.0');
  console.log('========================================');
  console.log('  Outline: ' + jsonPath);
  console.log('  Output:  ' + outputPath);
  if (themeId) console.log('  Theme:   ' + themeId + ' (manual)');
  if (density) console.log('  Density: ' + density);
  if (doPreview) console.log('  Preview: ON');
  console.log('========================================\n');

  // ========== 步骤 1: 大纲校验 ==========
  console.log('[1/3] Validating outline...');
  var outline = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  var data = outline.ppt_outline || outline;
  var validator = require('./validate-outline');
  var vResult = validator.validate(data);

  if (vResult.warnings.length > 0) {
    vResult.warnings.forEach(function(w) { console.log('  \u26A0 ' + w); });
  }
  if (!vResult.valid) {
    vResult.errors.forEach(function(e) { console.error('  \u2717 ' + e); });
    console.error('\nOutline validation failed. Fix errors above before generating.');
    process.exit(1);
  }
  console.log('  \u2713 Valid (' + vResult.warnings.length + ' warnings)\n');

  // ========== 预览 (可选, 借鉴 guizang-ppt-skill) ==========
  if (doPreview) {
    console.log('========================================');
    console.log('  HTML Preview (借鉴 guizang-ppt-skill)');
    console.log('========================================');
    var preview = require('./preview-html');
    var previewPath = jsonPath.replace(/\.json$/, '_preview.html');
    preview.render(outline, previewPath);
    console.log('  预览文件: ' + previewPath);
    console.log('  请在浏览器中打开确认结构无误后继续。\n');
  }

  // ========== 步骤 2: 生成图表 ==========
  if (!skipCharts) {
    console.log('[2/3] Generating charts...');
    var csg = require('./chart-script-gen');
    var charts = csg.extractCharts(data);
    var nativeOnlyCount = 0;

    charts.forEach(function(c) {
      if (c.spec.chart_type === 'radar' || c.spec.chart_type === 'scatter') {
        nativeOnlyCount++;
      }
    });

    var needsPython = charts.length - nativeOnlyCount;

    if (needsPython === 0) {
      console.log('  \u2139 No Python charts needed (' + charts.length + ' native charts only)');
    } else {
      // 生成 Python 脚本
      var projectDir = path.dirname(path.resolve(jsonPath));
      var script = csg.generateScript(data, { outputDir: './slides' });

      if (script) {
        var pyPath = path.join(projectDir, 'generate_charts.py');
        fs.writeFileSync(pyPath, script, 'utf-8');
        console.log('  Generated: generate_charts.py (' + needsPython + ' charts)');

        // 运行 Python
        try {
          var result = cp.execSync('python ' + pyPath, {
            cwd: projectDir,
            encoding: 'utf-8',
            timeout: 60000,
            stdio: ['pipe', 'pipe', 'pipe']
          });
          if (result) console.log('  ' + result.trim().split('\n').map(function(l) { return '  ' + l; }).join('\n'));
          console.log('  \u2713 Charts generated');
        } catch (e) {
          console.error('  \u2717 Python chart generation failed:');
          console.error('    ' + (e.stderr || e.message).trim().split('\n').join('\n    '));
          console.error('\n  You can retry manually:');
          console.error('    cd ' + projectDir);
          console.error('    python generate_charts.py');
          console.error('\n  Or skip charts with --skip-charts if already generated.');
          process.exit(1);
        }
      }
    }
  } else {
    console.log('[2/3] Skipping chart generation (--skip-charts)');
  }

  // ========== 步骤 3: 构建 PPTX ==========
  console.log('\n[3/3] Building PPTX...');
  var buildPptx = require('./build-ppt');

  // 手动调用 buildPptx (绕过 CLI，因为我们已经在同一进程里)
  // 先确定主题
  var tId = themeId;
  if (!tId) {
    var themes = require('./themes');
    var title = (data.cover ? data.cover.title : '') || '';
    var autoTheme = themes.recommendTheme(title);
    if (autoTheme !== 'dark-gold' || !(outline.meta || {}).theme) {
      tId = autoTheme;
    } else {
      tId = (outline.meta || {}).theme || 'dark-gold';
    }
    if ((outline.meta || {}).theme && (outline.meta || {}).theme !== tId) {
      console.log('  Theme override: "' + outline.meta.theme + '" -> "' + tId + '" (auto-recommended)');
    }
  }
  console.log('  Theme: ' + tId);

  // 注入 density 到 meta 中，传递给 slide builders
  var meta = outline.meta || {};
  if (density) meta.density = density;

  buildPptx.buildPptx(data, meta, tId, outputPath, jsonPath);

  // 等待 pptxgenjs 写入完成后退出
  setTimeout(function() {
    console.log('\n========================================');
    console.log('  Done! Output: ' + outputPath);
    console.log('========================================');
    process.exit(0);
  }, 1000);
}

main();

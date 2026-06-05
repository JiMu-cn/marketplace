#!/usr/bin/env node
/**
 * UI-TARS Desktop Agent CLI
 * Lightweight CLI for AI skill invocation.
 *
 * Usage:
 *   node ui-tars-agent.js run -i "打开浏览器" --base-url http://... --api-key sk-... --model ui-tars
 *   node ui-tars-agent.js config --base-url ... --api-key ... --model ...
 *   node ui-tars-agent.js check
 */

const { spawn, execFileSync } = require('child_process');
const { program } = require('commander');
const { GUIAgent } = require('@ui-tars/sdk');
const { NutJSOperator } = require('@ui-tars/operator-nut-js');
const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_PATH = path.join(os.homedir(), '.skills', 'auto-desktop.json');
const EDGE_FEEDBACK_OVERLAY_ARG = '--edge-feedback-overlay';

// 火山方舟云端默认配置（用户只需提供 API Key 即可使用）
const DEFAULT_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const DEFAULT_MODEL = 'doubao-seed-2-0-pro-260215';

function loadConfig(configPath) {
  const target = configPath || CONFIG_PATH;
  if (fs.existsSync(target)) {
    try {
      const raw = JSON.parse(fs.readFileSync(target, 'utf-8'));
      return {
        apiKey: raw.apiKey || raw.api_key,
        baseURL: raw.baseURL || raw.base_url,
        model: raw.model,
        useResponsesApi: raw.useResponsesApi,
      };
    } catch { return {}; }
  }
  return {};
}

function saveConfig(config) {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch {}
}

function jsonLog(type, data) {
  console.log(JSON.stringify({ type, timestamp: Date.now(), ...data }));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getForegroundWindowInfo() {
  if (process.platform !== 'win32') return null;
  try {
    const script = String.raw`
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class Win32 {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", SetLastError=true)] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);
  [DllImport("user32.dll", SetLastError=true)] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
"@
$hwnd = [Win32]::GetForegroundWindow()
if ($hwnd -eq [IntPtr]::Zero) { return }
$sb = New-Object System.Text.StringBuilder 1024
[void][Win32]::GetWindowText($hwnd, $sb, $sb.Capacity)
$rect = New-Object Win32+RECT
if (-not [Win32]::GetWindowRect($hwnd, [ref]$rect)) { return }
[PSCustomObject]@{
  title = $sb.ToString()
  left = $rect.Left
  top = $rect.Top
  right = $rect.Right
  bottom = $rect.Bottom
} | ConvertTo-Json -Compress
`;
    const stdout = execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 4000,
    }).trim();
    if (!stdout) return null;
    const info = JSON.parse(stdout);
    if (!info || typeof info.left !== 'number' || typeof info.top !== 'number' || typeof info.right !== 'number' || typeof info.bottom !== 'number') {
      return null;
    }
    const title = String(info.title || '').trim();
    if (/积木|Jimu/i.test(title)) return null;
    const width = info.right - info.left;
    const height = info.bottom - info.top;
    if (width < 80 || height < 80) return null;
    return {
      title,
      left: info.left,
      top: info.top,
      width,
      height,
    };
  } catch {
    return null;
  }
}

async function cropScreenshotToWindow(base64, windowInfo) {
  if (!base64 || !windowInfo) return null;
  try {
    const image = await Jimp.fromBuffer(Buffer.from(base64, 'base64'));
    const screenWidth = image.bitmap.width;
    const screenHeight = image.bitmap.height;
    const x = clamp(Math.round(windowInfo.left), 0, screenWidth - 1);
    const y = clamp(Math.round(windowInfo.top), 0, screenHeight - 1);
    const maxWidth = screenWidth - x;
    const maxHeight = screenHeight - y;
    const width = clamp(Math.round(windowInfo.width), 1, maxWidth);
    const height = clamp(Math.round(windowInfo.height), 1, maxHeight);
    const cropped = image.clone().crop({ x, y, w: width, h: height });
    const buffer = await cropped.getBuffer('image/png');
    return {
      base64: buffer.toString('base64'),
      width,
      height,
      x,
      y,
    };
  } catch {
    return null;
  }
}

function createWindowAwareOperator(baseOperator) {
  let lastScreenshotMode = 'screen';
  let lastWindowContext = null;
  return {
    async screenshot() {
      const shot = await baseOperator.screenshot();
      const fullImage = await Jimp.fromBuffer(Buffer.from(shot.base64, 'base64'));
      const activeWindow = getForegroundWindowInfo();
      const cropped = await cropScreenshotToWindow(shot.base64, activeWindow);
      if (cropped) {
        lastScreenshotMode = 'window';
        lastWindowContext = {
          mode: 'window',
          title: activeWindow.title,
          left: cropped.x,
          top: cropped.y,
          width: cropped.width,
          height: cropped.height,
          scaleFactor: shot.scaleFactor,
          screenWidth: fullImage.bitmap.width,
          screenHeight: fullImage.bitmap.height,
        };
        return {
          base64: cropped.base64,
          scaleFactor: shot.scaleFactor,
          windowContext: lastWindowContext,
        };
      }
      lastScreenshotMode = 'screen';
      lastWindowContext = null;
      return {
        ...shot,
        windowContext: null,
      };
    },
    async execute(params) {
      if (lastScreenshotMode === 'window' && lastWindowContext) {
        const mappedParams = {
          ...params,
          screenWidth: lastWindowContext.screenWidth,
          screenHeight: lastWindowContext.screenHeight,
          parsedPrediction: {
            ...params.parsedPrediction,
            action_inputs: {
              ...(params.parsedPrediction?.action_inputs || {}),
            },
          },
        };
        const remapBox = (boxStr) => {
          if (!boxStr) return boxStr;
          const coords = boxStr.replace('[', '').replace(']', '').split(',').map((num) => parseFloat(num.trim()));
          const [x1, y1, x2 = x1, y2 = y1] = coords;
          const toScreenX = (v) => (lastWindowContext.left + v * lastWindowContext.width) / lastWindowContext.screenWidth;
          const toScreenY = (v) => (lastWindowContext.top + v * lastWindowContext.height) / lastWindowContext.screenHeight;
          return `[${toScreenX(x1)},${toScreenY(y1)},${toScreenX(x2)},${toScreenY(y2)}]`;
        };
        mappedParams.parsedPrediction.action_inputs.start_box = remapBox(mappedParams.parsedPrediction.action_inputs.start_box);
        if (mappedParams.parsedPrediction.action_inputs.end_box) {
          mappedParams.parsedPrediction.action_inputs.end_box = remapBox(mappedParams.parsedPrediction.action_inputs.end_box);
        }
        return baseOperator.execute(mappedParams);
      }
      return baseOperator.execute(params);
    },
  };
}

async function runEdgeFeedbackOverlayWindow() {
  const { app, BrowserWindow, screen, ipcMain } = require('electron');

  // Communication file paths passed via args
  const msgFilePath = process.argv[process.argv.indexOf(EDGE_FEEDBACK_OVERLAY_ARG) + 1];
  const stopFilePath = process.argv[process.argv.indexOf(EDGE_FEEDBACK_OVERLAY_ARG) + 2];

  let overlayWindow = null;
  let statusBarWindow = null;
  let stopBtnWindow = null;
  let lastMsgContent = '';

  const createOverlayWindow = () => {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { x, y, width, height } = primaryDisplay.bounds;

    overlayWindow = new BrowserWindow({
      width,
      height,
      x,
      y,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      hasShadow: false,
      thickFrame: false,
      paintWhenInitiallyHidden: true,
      type: 'panel',
      backgroundColor: '#00000000',
      webPreferences: {
        backgroundThrottling: false,
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    overlayWindow.setFocusable(false);
    overlayWindow.setContentProtection(false);
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    overlayWindow.setAlwaysOnTop(true, 'screen-saver');

    overlayWindow.loadURL(`data:text/html;charset=UTF-8,
      <html>
        <head>
          <style id="water-flow-animation">
            html, body {
              margin: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
              background: transparent;
            }

            html::before {
              content: "";
              position: fixed;
              top: 0; right: 0; bottom: 0; left: 0;
              pointer-events: none;
              z-index: 9999;
              background:
                linear-gradient(to right, rgba(30, 144, 255, 0.52), transparent 44%) left,
                linear-gradient(to left, rgba(30, 144, 255, 0.52), transparent 44%) right,
                linear-gradient(to bottom, rgba(30, 144, 255, 0.52), transparent 44%) top,
                linear-gradient(to top, rgba(30, 144, 255, 0.52), transparent 44%) bottom;
              background-repeat: no-repeat;
              background-size: 12% 100%, 12% 100%, 100% 12%, 100% 12%;
              animation: waterflow 5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
              filter: blur(10px);
            }

            @keyframes waterflow {
              0%, 100% {
                background-image:
                  linear-gradient(to right, rgba(30, 144, 255, 0.52), transparent 44%),
                  linear-gradient(to left, rgba(30, 144, 255, 0.52), transparent 44%),
                  linear-gradient(to bottom, rgba(30, 144, 255, 0.52), transparent 44%),
                  linear-gradient(to top, rgba(30, 144, 255, 0.52), transparent 44%);
                transform: scale(1);
              }
              25% {
                background-image:
                  linear-gradient(to right, rgba(30, 144, 255, 0.5), transparent 47%),
                  linear-gradient(to left, rgba(30, 144, 255, 0.5), transparent 47%),
                  linear-gradient(to bottom, rgba(30, 144, 255, 0.5), transparent 47%),
                  linear-gradient(to top, rgba(30, 144, 255, 0.5), transparent 47%);
                transform: scale(1.018);
              }
              50% {
                background-image:
                  linear-gradient(to right, rgba(30, 144, 255, 0.48), transparent 50%),
                  linear-gradient(to left, rgba(30, 144, 255, 0.48), transparent 50%),
                  linear-gradient(to bottom, rgba(30, 144, 255, 0.48), transparent 50%),
                  linear-gradient(to top, rgba(30, 144, 255, 0.48), transparent 50%);
                transform: scale(1.035);
              }
              75% {
                background-image:
                  linear-gradient(to right, rgba(30, 144, 255, 0.5), transparent 47%),
                  linear-gradient(to left, rgba(30, 144, 255, 0.5), transparent 47%),
                  linear-gradient(to bottom, rgba(30, 144, 255, 0.5), transparent 47%),
                  linear-gradient(to top, rgba(30, 144, 255, 0.5), transparent 47%);
                transform: scale(1.018);
              }
            }
          </style>
        </head>
        <body></body>
      </html>
    `);

    overlayWindow.on('closed', () => {
      overlayWindow = null;
    });
  };

  const createStatusBar = () => {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.bounds;
    const btnWidth = 68;
    const gap = 4;
    const textWidth = 450;
    const barHeight = 36;
    const totalWidth = textWidth + gap + btnWidth;
    const startX = primaryDisplay.bounds.x + Math.round((screenWidth - totalWidth) / 2);
    const barY = primaryDisplay.bounds.y + screenHeight - barHeight - 68;

    // --- Thought text window (fully click-through) ---
    statusBarWindow = new BrowserWindow({
      width: textWidth,
      height: barHeight,
      x: startX,
      y: barY,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      hasShadow: false,
      resizable: false,
      thickFrame: false,
      backgroundColor: '#00000000',
      webPreferences: {
        backgroundThrottling: false,
        nodeIntegration: true,
        contextIsolation: false,
      },
    });
    statusBarWindow.setContentProtection(false);
    statusBarWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    statusBarWindow.setIgnoreMouseEvents(true);
    statusBarWindow.on('closed', () => { statusBarWindow = null; });

    const thoughtHTML = `<!DOCTYPE html>
<html><head><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:100%;height:100%;overflow:hidden;background:transparent!important;user-select:none;-webkit-user-select:none}
  #bar{display:flex;align-items:center;height:${barHeight}px;padding:0 14px;
    background:rgba(12,12,20,0.92);
    border:1px solid rgba(255,255,255,0.22);
    border-right:none;
    border-radius:${barHeight / 2}px 0 0 ${barHeight / 2}px;
  }
  #dot{width:7px;height:7px;border-radius:50%;background:#4fc3f7;margin-right:10px;flex-shrink:0;animation:pulse 2s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:1;box-shadow:0 0 4px #4fc3f7}50%{opacity:.4;box-shadow:none}}
  #thought{flex:1;color:rgba(255,255,255,.85);font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
    font-family:-apple-system,'Segoe UI','Microsoft YaHei',sans-serif;line-height:${barHeight}px}
</style></head><body>
  <div id="bar"><div id="dot"></div><div id="thought">AI \u51C6\u5907\u4E2D...</div></div>
  <script>
    const{ipcRenderer}=require('electron');
    ipcRenderer.on('update-thought',(_,t)=>{document.getElementById('thought').textContent=t||''});
  </script>
</body></html>`;
    statusBarWindow.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(thoughtHTML));

    // --- Stop button window (clickable, NOT click-through) ---
    stopBtnWindow = new BrowserWindow({
      width: btnWidth,
      height: barHeight,
      x: startX + textWidth + gap,
      y: barY,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: true,
      hasShadow: false,
      resizable: false,
      thickFrame: false,
      backgroundColor: '#00000000',
      webPreferences: {
        backgroundThrottling: false,
        nodeIntegration: true,
        contextIsolation: false,
      },
    });
    stopBtnWindow.setContentProtection(false);
    stopBtnWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    // NOT setting setIgnoreMouseEvents — this window captures clicks
    // Prevent focus steal from disrupting automation
    stopBtnWindow.on('focus', () => { stopBtnWindow.blur(); });
    stopBtnWindow.on('closed', () => { stopBtnWindow = null; });

    ipcMain.on('stop-clicked', () => {
      if (stopFilePath) {
        try { fs.writeFileSync(stopFilePath, 'stop'); } catch {}
      }
    });

    const btnHTML = `<!DOCTYPE html>
<html><head><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:100%;height:100%;overflow:hidden;background:transparent!important;user-select:none;-webkit-user-select:none}
  #btn{display:flex;align-items:center;justify-content:center;width:100%;height:${barHeight}px;
    background:rgba(200,45,45,0.92);
    border:1px solid rgba(255,255,255,0.22);
    border-left:none;
    border-radius:0 ${barHeight / 2}px ${barHeight / 2}px 0;
    color:#fff;font-size:12px;cursor:pointer;
    font-family:-apple-system,'Segoe UI','Microsoft YaHei',sans-serif;
    transition:background .15s;
  }
  #btn:hover{background:rgba(230,55,55,0.95)}
  #btn:active{background:rgba(160,35,35,0.95)}
</style></head><body>
  <div id="btn">\u505C\u6B62</div>
  <script>
    const{ipcRenderer}=require('electron');
    document.getElementById('btn').addEventListener('click',()=>{
      ipcRenderer.send('stop-clicked');
      const b=document.getElementById('btn');
      b.textContent='\u5DF2\u505C\u6B62';b.style.background='rgba(80,80,80,0.8)';b.style.cursor='default';
    });
  </script>
</body></html>`;
    stopBtnWindow.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(btnHTML));
  };

  await app.whenReady();
  createOverlayWindow();
  createStatusBar();

  // Poll message file for commands from main process
  if (msgFilePath) {
    setInterval(() => {
      try {
        if (!fs.existsSync(msgFilePath)) return;
        const content = fs.readFileSync(msgFilePath, 'utf-8').trim();
        if (!content || content === lastMsgContent) return;
        lastMsgContent = content;
        const lines = content.split('\n');
        const lastLine = lines[lines.length - 1];
        const msg = JSON.parse(lastLine);
        if (msg.type === 'hide') {
          if (statusBarWindow && !statusBarWindow.isDestroyed()) statusBarWindow.hide();
          if (stopBtnWindow && !stopBtnWindow.isDestroyed()) stopBtnWindow.hide();
        } else if (msg.type === 'show') {
          if (statusBarWindow && !statusBarWindow.isDestroyed()) statusBarWindow.showInactive();
          if (stopBtnWindow && !stopBtnWindow.isDestroyed()) stopBtnWindow.showInactive();
        } else if (msg.type === 'thought') {
          if (statusBarWindow && !statusBarWindow.isDestroyed()) {
            statusBarWindow.webContents.send('update-thought', msg.text || '');
          }
        }
      } catch {}
    }, 80);
  }

  app.on('window-all-closed', () => {
    app.quit();
  });
}

function startEdgeFeedbackOverlay() {
  try {
    const electronPath = require('electron');
    const tmpDir = os.tmpdir();
    const msgFile = path.join(tmpDir, `jimu-overlay-msg-${process.pid}.json`);
    const stopFile = path.join(tmpDir, `jimu-overlay-stop-${process.pid}`);

    // Clean up any stale files
    try { fs.unlinkSync(msgFile); } catch {}
    try { fs.unlinkSync(stopFile); } catch {}

    const proc = spawn(electronPath, [__filename, EDGE_FEEDBACK_OVERLAY_ARG, msgFile, stopFile], {
      stdio: 'ignore',
      windowsHide: true,
    });

    return { process: proc, msgFile, stopFile };
  } catch {
    return null;
  }
}

function stopEdgeFeedbackOverlay(overlay) {
  if (!overlay) return;
  const proc = overlay.process;
  if (proc && !proc.killed) {
    try { proc.kill(); } catch {}
  }
  // Clean up temp files
  try { fs.unlinkSync(overlay.msgFile); } catch {}
  try { fs.unlinkSync(overlay.stopFile); } catch {}
}

function sendOverlayMessage(overlay, msg) {
  if (overlay && overlay.msgFile) {
    try {
      fs.writeFileSync(overlay.msgFile, JSON.stringify(msg));
    } catch {}
  }
}

function hideOverlay(overlay) {
  sendOverlayMessage(overlay, { type: 'hide' });
}

function showOverlay(overlay) {
  sendOverlayMessage(overlay, { type: 'show' });
}

function updateOverlayThought(overlay, text) {
  sendOverlayMessage(overlay, { type: 'thought', text });
}

function watchOverlayStop(overlay, callback) {
  if (!overlay || !overlay.stopFile) return null;
  const interval = setInterval(() => {
    try {
      if (fs.existsSync(overlay.stopFile)) {
        clearInterval(interval);
        callback();
      }
    } catch {}
  }, 150);
  return interval;
}

function createOverlayAwareOperator(baseOperator, getOverlay) {
  return {
    async screenshot() {
      const ov = getOverlay();
      hideOverlay(ov);
      await sleep(120);
      try {
        return await baseOperator.screenshot();
      } finally {
        showOverlay(ov);
      }
    },
    async execute(params) {
      const ov = getOverlay();
      hideOverlay(ov);
      await sleep(60);
      try {
        return await baseOperator.execute(params);
      } finally {
        await sleep(30);
        showOverlay(ov);
      }
    },
  };
}

function registerCleanup(cleanup) {
  process.once('exit', cleanup);
  process.once('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });
}

function runCli() {
  program
    .name('ui-tars-agent')
    .description('UI-TARS Desktop Agent - AI-driven GUI automation')
    .version('1.0.0');

  program
    .command('run')
    .description('Execute a GUI automation task')
    .requiredOption('-i, --instruction <text>', 'Task instruction in natural language')
    .option('--base-url <url>', 'VLM model API base URL')
    .option('--api-key <key>', 'VLM model API key')
    .option('--model <name>', 'VLM model name')
    .option('--use-responses-api', 'Use OpenAI Responses API', false)
    .option('--max-loop <n>', 'Max loop count', '50')
    .option('--loop-interval <ms>', 'Interval between loops in ms', '150')
    .option('--config <path>', 'Path to config JSON file')
    .option('--max-tokens <n>', 'Max output tokens for model response (lower = faster)', '500')
    .option('--screen-watch <ms>', 'Screen change detection interval in ms (0=disabled)', '0')
    .option('--json', 'Output structured JSON (for AI consumption)', false)
    .action(async (opts) => {
      const fileConfig = loadConfig(opts.config);

      const config = {
        baseURL: opts.baseUrl || process.env.UI_TARS_BASE_URL || fileConfig.baseURL || DEFAULT_BASE_URL,
        apiKey: opts.apiKey || process.env.UI_TARS_API_KEY || fileConfig.apiKey || '',
        model: opts.model || process.env.UI_TARS_MODEL || fileConfig.model || DEFAULT_MODEL,
        useResponsesApi: opts.useResponsesApi || fileConfig.useResponsesApi || false,
      };

      if (!config.apiKey) {
        const msg = 'Missing required config: apiKey. Use --api-key, env var UI_TARS_API_KEY, or --config file. Get your API Key from 火山方舟: https://www.volcengine.com/product/ark';
        if (opts.json) { jsonLog('error', { message: msg }); } else { console.error('Error: ' + msg); }
        process.exit(1);
      }

      saveConfig(config);

      const baseOperator = createWindowAwareOperator(new NutJSOperator());
      const abortController = new AbortController();
      process.on('SIGINT', () => { abortController.abort(); });

      let stepCount = 0;
      let edgeFeedbackOverlay = startEdgeFeedbackOverlay();
      const cleanupEdgeFeedback = () => {
        stopEdgeFeedbackOverlay(edgeFeedbackOverlay);
        edgeFeedbackOverlay = null;
      };

      // 监听 overlay 停止按钮信号
      let stopWatchInterval = null;
      if (edgeFeedbackOverlay) {
        stopWatchInterval = watchOverlayStop(edgeFeedbackOverlay, () => {
          abortController.abort();
          cleanupEdgeFeedback();
        });
      }

      // 包装 operator，截图和点击时自动隐藏 overlay
      const operator = createOverlayAwareOperator(baseOperator, () => edgeFeedbackOverlay);

      registerCleanup(cleanupEdgeFeedback);
      await sleep(300);

      // 自定义 system prompt，支持多动作输出
      const systemPrompt = `You are a GUI agent. You are given a task and your action history, with screenshots. You need to perform the next action to complete the task.

## Output Format
Thought: <brief plan in 1-2 sentences>
Action: <function_call>

## Multi-Action Support
When actions can be performed in sequence WITHOUT needing to see the screen result between them, you MAY output 1-6 function calls after a single Action: keyword, separated by a blank line. Only the FIRST call has the "Action:" prefix.

Prefer combining actions whenever it is safe and deterministic, because fewer model rounds usually means faster execution.

Example 1 - select one card then click play:
\`\`\`
Thought: Select the 3 of hearts and click play.
Action: click(start_box='<point>500 750</point>')

click(start_box='<point>600 500</point>')
\`\`\`

Example 2 - select two cards then click play (3 actions):
\`\`\`
Thought: Select pair of Kings and click play.
Action: click(start_box='<point>400 750</point>')

click(start_box='<point>430 750</point>')

click(start_box='<point>600 500</point>')
\`\`\`

Example 3 - drag to scroll or move an element:
\`\`\`
Thought: The content is below the visible area, I need to drag upward to see it.
Action: drag(start_box='<point>500 800</point>', end_box='<point>500 400</point>')
\`\`\`

Example 4 - game flow with several stable UI actions:
\`\`\`
Thought: The reward popup, confirm button, and start button are all visible and stable, so I can clear them in one batch.
Action: click(start_box='<point>640 180</point>')

click(start_box='<point>520 520</point>')

click(start_box='<point>700 620</point>')
\`\`\`

Use multi-action ONLY when:
- All target elements are already visible on the current screenshot
- Earlier actions will not change the layout or invalidate later targets
- The action sequence is simple and deterministic
- In game scenarios, the next few taps are obvious and not dependent on animation, turn changes, random popups, or opponent actions

Use 5-6 actions ONLY for highly stable flows such as clearing fixed popups, opening known menus, confirming dialogs, or executing an obvious piece-selection-then-placement sequence where all targets are already known.

If there is any uncertainty, reduce the action count immediately. It is better to output 1-2 reliable actions than 5-6 risky ones.

When in doubt, output fewer actions and wait for the next screenshot.

Use drag when:
- You need to scroll or pan the screen content
- You need to move an element from one position to another
- Elements are outside the visible area and need to be revealed

## Action Space
click(start_box='[x1, y1, x2, y2]')
left_double(start_box='[x1, y1, x2, y2]')
right_single(start_box='[x1, y1, x2, y2]')
drag(start_box='[x1, y1, x2, y2]', end_box='[x3, y3, x4, y4]')
hotkey(key='')
type(content='') #If you want to submit your input, use "\\n" at the end of \`content\`.
scroll(start_box='[x1, y1, x2, y2]', direction='down or up or right or left')
wait() #Sleep for 5s and take a screenshot to check for any changes.
finished()
call_user() # Submit the task and call the user when the task is unsolvable, or when you need the user's help.

## Note
- Write a small plan and finally summarize your next action (with its target element) in one sentence in \`Thought\` part.
- The screenshot you receive is usually ONLY the currently active window, not the whole desktop.
- Your coordinates must always be interpreted relative to the screenshot you receive.
- If the screenshot is an active window, output coordinates relative to that window's content area shown in the screenshot.
- Only when there is no usable active window will the system fall back to a full-screen screenshot.
- Base every action only on the latest screenshot provided.
- In real-time or game scenarios, prioritize LOW LATENCY over verbose reasoning.
- Keep Thought short. Do not over-analyze obvious situations.
- If the next several actions are clear and stable, batch them in one response to reduce timeout risk.
- If the scene is changing quickly or the next target is uncertain, use fewer actions immediately.

## User Instruction
`;

      const guiAgent = new GUIAgent({
        model: { baseURL: config.baseURL, apiKey: config.apiKey, model: config.model, useResponsesApi: config.useResponsesApi, max_tokens: parseInt(opts.maxTokens) },
        operator,
        systemPrompt,
        signal: abortController.signal,
        maxLoopCount: parseInt(opts.maxLoop),
        loopIntervalInMs: parseInt(opts.loopInterval),
        screenWatchIntervalMs: parseInt(opts.screenWatch) || 0,
        onData: ({ data }) => {
          if (!data.conversations || data.conversations.length === 0) {
            if (opts.json) jsonLog('status', { status: data.status });
            return;
          }
          const last = data.conversations[data.conversations.length - 1];
          if (last.from === 'gpt' && last.predictionParsed) {
            stepCount++;
            const firstThought = last.predictionParsed[0]?.thought || '';
            if (firstThought && edgeFeedbackOverlay) {
              updateOverlayThought(edgeFeedbackOverlay, firstThought);
            }
            last.predictionParsed.forEach((pred, index) => {
              const actionIndex = index + 1;
              if (opts.json) {
                jsonLog('action', { step: stepCount, actionIndex, action_type: pred.action_type, action_inputs: pred.action_inputs, thought: pred.thought || '', reflection: pred.reflection || '' });
              } else {
                console.log(`\n[Step ${stepCount}.${actionIndex}] ${pred.thought || ''}`);
                console.log(`  Action: ${pred.action_type}(${JSON.stringify(pred.action_inputs)})`);
                if (pred.reflection) console.log(`  Reflection: ${pred.reflection}`);
              }
            });
          }
        },
        onError: ({ error }) => {
          if (opts.json) { jsonLog('error', { message: error?.message || 'Unknown error' }); }
          else { console.error(`\nError: ${error?.message || error}`); }
        },
      });

      // Safety: prepend constraint to never close the Jimu (积木) host window
      const safetyPrefix = '【重要约束】绝对不要关闭、最小化或以任何方式操作"积木"(Jimu)应用窗口，因为当前进程运行在其中，关闭它会导致任务终止。如果"积木"窗口挡住了操作区域，请通过点击目标应用的任务栏图标来切换窗口，而不是关闭"积木"。\n\n【任务】';
      const fullInstruction = safetyPrefix + opts.instruction;

      if (opts.json) { jsonLog('start', { instruction: opts.instruction, model: config.model }); }
      else { console.log(`UI-TARS Agent | Model: ${config.model} | Instruction: ${opts.instruction}\n---`); }

      try {
        await guiAgent.run(fullInstruction);
        if (opts.json) { jsonLog('complete', { steps: stepCount }); }
        else { console.log(`\nDone. Steps: ${stepCount}`); }
      } catch (err) {
        if (opts.json) { jsonLog('error', { message: err.message }); }
        else { console.error(`Failed: ${err.message}`); }
        process.exitCode = 1;
      } finally {
        if (stopWatchInterval) clearInterval(stopWatchInterval);
        cleanupEdgeFeedback();
      }
    });

  program
    .command('config')
    .description('Save model configuration to ~/.skills/auto-desktop.json')
    .requiredOption('--base-url <url>', 'VLM model API base URL')
    .requiredOption('--api-key <key>', 'VLM model API key')
    .requiredOption('--model <name>', 'VLM model name')
    .option('--use-responses-api', 'Use OpenAI Responses API', false)
    .action((opts) => {
      saveConfig({ baseURL: opts.baseUrl, apiKey: opts.apiKey, model: opts.model, useResponsesApi: opts.useResponsesApi });
      console.log(`Config saved to ${CONFIG_PATH}`);
    });

  program
    .command('check')
    .description('Check system requirements')
    .action(async () => {
      console.log(`Node.js: ${process.version} | Platform: ${process.platform} | Arch: ${process.arch}`);
      try {
        const { screen } = require('@computer-use/nut-js');
        const w = await screen.width();
        console.log(`nut-js: OK (screen width: ${w}px)`);
      } catch (err) { console.error(`nut-js: FAILED - ${err.message}`); }
      if (fs.existsSync(CONFIG_PATH)) {
        const c = loadConfig();
        console.log(`Config: ${CONFIG_PATH}\n  Model: ${c.model || 'N/A'}\n  URL: ${c.baseURL || 'N/A'}\n  Key: ${c.apiKey ? '***' : 'N/A'}`);
      } else { console.log(`Config: not found (${CONFIG_PATH})`); }
    });

  program.parse();
}

if (process.argv.includes(EDGE_FEEDBACK_OVERLAY_ARG)) {
  runEdgeFeedbackOverlayWindow().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  runCli();
}

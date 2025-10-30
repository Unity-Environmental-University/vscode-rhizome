"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate,
  ensureOpenAIKeyConfigured: () => ensureOpenAIKeyConfigured
});
module.exports = __toCommonJS(extension_exports);
var vscode6 = __toESM(require("vscode"));

// src/commands/personaCommands.ts
var vscode5 = __toESM(require("vscode"));

// src/services/personaService.ts
var vscode3 = __toESM(require("vscode"));

// src/services/rhizomeService.ts
var vscode = __toESM(require("vscode"));
var { execSync } = require("child_process");
async function queryPersona(text, persona, timeoutMs = 3e4, workspaceRoot) {
  const cwd = workspaceRoot || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  console.log(
    `[vscode-rhizome:rhizomeService] queryPersona invoked \u2014 persona: ${persona}, textLength: ${text.length}, cwd: ${cwd ?? "unknown"}`
  );
  const queryPromise = new Promise((resolve, reject) => {
    try {
      const response = execSync(`rhizome query --persona ${persona}`, {
        input: text,
        encoding: "utf-8",
        timeout: timeoutMs,
        cwd,
        stdio: ["pipe", "pipe", "pipe"],
        maxBuffer: 10 * 1024 * 1024,
        env: process.env
        // Pass environment variables to child process
      });
      resolve(response);
    } catch (error) {
      console.log("[vscode-rhizome:rhizomeService] queryPersona execSync failed", {
        message: error?.message,
        status: error?.status,
        stdout: error?.stdout,
        stderr: error?.stderr
      });
      reject(error);
    }
  });
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      const timeoutMessage = `${persona} timed out after ${timeoutMs}ms`;
      console.log("[vscode-rhizome:rhizomeService] queryPersona timeout", { persona, timeoutMs, cwd });
      reject(new Error(timeoutMessage));
    }, timeoutMs + 1e3);
  });
  return Promise.race([queryPromise, timeoutPromise]);
}
async function getAvailablePersonas() {
  const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  try {
    try {
      const jsonOutput = execSync("rhizome persona list --json", {
        encoding: "utf-8",
        timeout: 5e3,
        stdio: "pipe",
        cwd,
        env: process.env
      });
      const personasObj = JSON.parse(jsonOutput);
      const personas = /* @__PURE__ */ new Map();
      for (const [name, data] of Object.entries(personasObj)) {
        const role = data.role || "-";
        personas.set(name, role);
      }
      return personas;
    } catch (jsonError) {
      const output = execSync("rhizome persona list", {
        encoding: "utf-8",
        timeout: 5e3,
        stdio: "pipe",
        cwd,
        env: process.env
      });
      const personas = /* @__PURE__ */ new Map();
      const lines = output.split("\n");
      for (const line of lines) {
        if (!line.trim())
          continue;
        const match = line.match(/^\s*(\S+)\s+\|\s+role:\s+(.+?)\s+\|\s+source:/);
        if (match) {
          const name = match[1].trim();
          const role = match[2].trim();
          personas.set(name, role);
        }
      }
      return personas;
    }
  } catch (error) {
    return /* @__PURE__ */ new Map([
      ["don-socratic", "Socratic questioning"],
      ["dev-guide", "Mentor: What were you trying to accomplish?"],
      ["code-reviewer", "Skeptic: What's your evidence?"],
      ["ux-advocate", "Curator: Have we watched someone use this?"],
      ["dev-advocate", "Strategist: What trade-off are we making?"]
    ]);
  }
}

// src/services/initService.ts
var vscode2 = __toESM(require("vscode"));

// src/utils/rhizomePath.ts
var fs = __toESM(require("fs"));
var os = __toESM(require("os"));
var path = __toESM(require("path"));
var import_child_process = require("child_process");
var RHIZOME_BINARY_NAME = "rhizome";
var DEFAULT_RHIZOME_LOCATIONS = [
  path.join(os.homedir(), ".local", "bin", RHIZOME_BINARY_NAME),
  path.join(os.homedir(), "bin", RHIZOME_BINARY_NAME),
  path.join(os.homedir(), ".rhizome", "bin", RHIZOME_BINARY_NAME),
  "/usr/local/bin/rhizome",
  "/usr/bin/rhizome"
];
function parseCustomLocations() {
  const envPaths = process.env.RHIZOME_CUSTOM_PATHS;
  if (!envPaths) {
    return [];
  }
  return envPaths.split(path.delimiter).map((entry) => entry.trim()).filter((entry) => entry.length > 0);
}
function getCandidateLocations() {
  const combined = [...parseCustomLocations(), ...DEFAULT_RHIZOME_LOCATIONS];
  const seen = /* @__PURE__ */ new Set();
  const deduped = [];
  for (const location of combined) {
    const normalized = path.normalize(location);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      deduped.push(normalized);
    }
  }
  return deduped;
}
function findRhizomeOnDisk(pathExists = fs.existsSync) {
  for (const candidate of getCandidateLocations()) {
    if (pathExists(candidate)) {
      return candidate;
    }
  }
  return null;
}
function isRhizomeInstalled() {
  if (findRhizomeOnDisk()) {
    return true;
  }
  try {
    (0, import_child_process.execSync)(`${RHIZOME_BINARY_NAME} --version`, {
      encoding: "utf-8",
      timeout: 2e3,
      stdio: "pipe"
    });
    return true;
  } catch {
    return false;
  }
}
function ensureLocalBinOnPath() {
  const localBin = path.join(os.homedir(), ".local", "bin");
  const pathValue = process.env.PATH ?? "";
  const segments = pathValue.length > 0 ? pathValue.split(path.delimiter) : [];
  if (!segments.includes(localBin)) {
    segments.unshift(localBin);
    process.env.PATH = segments.join(path.delimiter);
  }
}

// src/services/initService.ts
var { execSync: execSync3 } = require("child_process");
var fs2 = require("fs");
var path2 = require("path");
var REQUIRED_PERSONAS = [
  path2.join("custom", "don-socratic.yml"),
  path2.join("custom", "dev-guide.yml"),
  path2.join("custom", "code-reviewer.yml"),
  path2.join("custom", "dev-advocate.yml")
];
async function ensureBaselinePersonas(workspaceRoot) {
  try {
    const sourceRoot = path2.join(__dirname, "..", ".rhizome", "personas.d");
    if (!fs2.existsSync(sourceRoot)) {
      console.log("[vscode-rhizome:init] Baseline personas not found in extension package.");
      return;
    }
    const personasRoot = path2.join(workspaceRoot, ".rhizome", "personas.d");
    await fs2.promises.mkdir(personasRoot, { recursive: true });
    let copied = false;
    for (const relativePath of REQUIRED_PERSONAS) {
      const sourcePath = path2.join(sourceRoot, relativePath);
      const targetPath = path2.join(personasRoot, relativePath);
      if (!fs2.existsSync(sourcePath)) {
        console.log(`[vscode-rhizome:init] Missing packaged persona: ${relativePath}`);
        continue;
      }
      const targetExists = await fs2.promises.access(targetPath, fs2.constants.F_OK).then(() => true).catch(() => false);
      if (targetExists) {
        continue;
      }
      await fs2.promises.mkdir(path2.dirname(targetPath), { recursive: true });
      await fs2.promises.copyFile(sourcePath, targetPath);
      copied = true;
      console.log(`[vscode-rhizome:init] Installed baseline persona: ${relativePath}`);
    }
    if (copied) {
      try {
        execSync3("rhizome persona merge", {
          cwd: workspaceRoot,
          encoding: "utf-8",
          timeout: 5e3,
          stdio: "pipe",
          env: process.env
        });
        console.log("[vscode-rhizome:init] Refreshed persona cache after installing baselines.");
      } catch (mergeError) {
        console.log("[vscode-rhizome:init] Failed to merge personas after install", mergeError?.message ?? mergeError);
      }
    }
  } catch (error) {
    console.log("[vscode-rhizome:init] Failed to ensure baseline personas", error?.message ?? error);
  }
}
async function initializeRhizomeIfNeeded(workspaceRoot) {
  if (!isRhizomeInstalled()) {
    const isMember = await isUEUMember();
    if (isMember) {
      const response = await vscode2.window.showErrorMessage(
        "rhizome CLI not found. You are a member of Unity-Environmental-University. Install rhizome now?",
        "Install rhizome",
        "View Guide"
      );
      if (response === "Install rhizome") {
        try {
          vscode2.window.showInformationMessage("Installing rhizome...");
          execSync3("npm install -g @rhizome/cli", {
            encoding: "utf-8",
            timeout: 6e4,
            stdio: "inherit"
          });
          vscode2.window.showInformationMessage("rhizome installed successfully!");
          if (!isRhizomeInstalled()) {
            vscode2.window.showWarningMessage(
              "Installation completed but rhizome still not found in PATH. You may need to restart VSCode."
            );
            return false;
          }
          return await initializeRhizomeIfNeeded(workspaceRoot);
        } catch (error) {
          vscode2.window.showErrorMessage(`Failed to install rhizome: ${error.message}`);
          return false;
        }
      } else if (response === "View Guide") {
        vscode2.env.openExternal(vscode2.Uri.parse("https://github.com/your-rhizome-repo#installation"));
      }
      return false;
    } else {
      const response = await vscode2.window.showWarningMessage(
        "rhizome CLI not found. Please install it to use vscode-rhizome.",
        "View Installation Guide"
      );
      if (response === "View Installation Guide") {
        vscode2.env.openExternal(vscode2.Uri.parse("https://github.com/your-rhizome-repo#installation"));
      }
      return false;
    }
  }
  const rhizomePath = vscode2.Uri.joinPath(vscode2.Uri.file(workspaceRoot), ".rhizome");
  try {
    await vscode2.workspace.fs.stat(rhizomePath);
    await ensureBaselinePersonas(workspaceRoot);
    const keyConfigured = await ensureOpenAIKeyConfigured(workspaceRoot);
    return keyConfigured;
  } catch {
    try {
      vscode2.window.showInformationMessage("Initializing rhizome in workspace...");
      execSync3("rhizome init --force", {
        cwd: workspaceRoot,
        encoding: "utf-8",
        timeout: 1e4
      });
      vscode2.window.showInformationMessage("Rhizome initialized in workspace");
      await ensureBaselinePersonas(workspaceRoot);
      const keyConfigured = await ensureOpenAIKeyConfigured(workspaceRoot);
      return keyConfigured;
    } catch (error) {
      vscode2.window.showErrorMessage(`Failed to initialize rhizome: ${error.message}`);
      return false;
    }
  }
}
async function ensureOpenAIKeyConfigured(workspaceRoot, options = {}) {
  const configPath = vscode2.Uri.joinPath(vscode2.Uri.file(workspaceRoot), ".rhizome", "config.json");
  const forcePrompt = options.forcePrompt ?? false;
  const promptReason = options.promptReason ?? "";
  try {
    if (process.env.OPENAI_API_KEY && !forcePrompt) {
      return true;
    }
    if (!forcePrompt) {
      const configExists = await vscode2.workspace.fs.stat(configPath);
      if (configExists) {
        const configContent = await vscode2.workspace.fs.readFile(configPath);
        const config = JSON.parse(new TextDecoder().decode(configContent));
        if (config.ai?.openai_key) {
          process.env.OPENAI_API_KEY = config.ai.openai_key;
          return true;
        }
      }
    }
  } catch {
  }
  const key = await vscode2.window.showInputBox({
    prompt: promptReason ? `${promptReason}

Enter your OpenAI API key (stored locally in .rhizome/config.json)` : "Enter your OpenAI API key (stored locally in .rhizome/config.json)",
    password: true,
    ignoreFocusOut: true
  });
  if (!key) {
    vscode2.window.showWarningMessage("OpenAI API key is required for don-socratic");
    return false;
  }
  const sanitizedKey = key.trim();
  if (/^\s*OPENAI_API_KEY\s*=/i.test(sanitizedKey) || sanitizedKey.includes("=")) {
    vscode2.window.showErrorMessage('Please enter only the OpenAI secret value (omit any "OPENAI_API_KEY=" prefix).');
    return false;
  }
  const keyPattern = /^sk-(proj-)?[A-Za-z0-9_-]{20,}$/;
  if (!keyPattern.test(sanitizedKey)) {
    vscode2.window.showErrorMessage(`That doesn't look like an OpenAI API key (expected to start with "sk-" and contain letters, numbers, "-" or "_").`);
    return false;
  }
  const validationOk = await validateOpenAIKey(sanitizedKey);
  if (!validationOk) {
    return false;
  }
  try {
    const rhizomePath = vscode2.Uri.joinPath(vscode2.Uri.file(workspaceRoot), ".rhizome");
    const configPath2 = vscode2.Uri.joinPath(rhizomePath, "config.json");
    let config = {};
    try {
      const existing = await vscode2.workspace.fs.readFile(configPath2);
      config = JSON.parse(new TextDecoder().decode(existing));
    } catch {
    }
    if (!config.ai)
      config.ai = {};
    config.ai.openai_key = sanitizedKey;
    const configContent = new TextEncoder().encode(JSON.stringify(config, null, 2));
    await vscode2.workspace.fs.writeFile(configPath2, configContent);
    process.env.OPENAI_API_KEY = sanitizedKey;
    await addToGitignore(workspaceRoot, ".rhizome/config.json");
    vscode2.window.showInformationMessage("OpenAI API key configured and stored securely");
    return true;
  } catch (error) {
    vscode2.window.showErrorMessage(`Failed to save API key: ${error.message}`);
    return false;
  }
}
async function validateOpenAIKey(key) {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`
      }
    });
    if (response.ok) {
      return true;
    }
    const errorText = await response.text();
    let message = "OpenAI rejected the provided API key.";
    try {
      const parsed = JSON.parse(errorText);
      if (parsed?.error?.message) {
        message += ` ${parsed.error.message}`;
      }
    } catch {
      if (errorText) {
        message += ` ${errorText}`;
      }
    }
    vscode2.window.showErrorMessage(message.trim());
    return false;
  } catch (error) {
    vscode2.window.showErrorMessage(`Failed to validate OpenAI API key: ${error.message}`);
    return false;
  }
}
async function addToGitignore(workspaceRoot, entry) {
  const gitignorePath = vscode2.Uri.joinPath(vscode2.Uri.file(workspaceRoot), ".gitignore");
  let content = "";
  try {
    const existing = await vscode2.workspace.fs.readFile(gitignorePath);
    content = new TextDecoder().decode(existing);
  } catch {
  }
  if (!content.includes(entry)) {
    content += (content.endsWith("\n") ? "" : "\n") + entry + "\n";
    const encoded = new TextEncoder().encode(content);
    await vscode2.workspace.fs.writeFile(gitignorePath, encoded);
  }
}
async function clearStoredOpenAIKey(workspaceRoot) {
  try {
    delete process.env.OPENAI_API_KEY;
    const configPathFs = path2.join(workspaceRoot, ".rhizome", "config.json");
    if (!fs2.existsSync(configPathFs)) {
      return;
    }
    const raw = await fs2.promises.readFile(configPathFs, "utf-8");
    const config = JSON.parse(raw);
    if (config.ai?.openai_key) {
      delete config.ai.openai_key;
      if (Object.keys(config.ai).length === 0) {
        delete config.ai;
      }
    }
    if (Object.keys(config).length === 0) {
      await fs2.promises.unlink(configPathFs).catch(() => void 0);
      return;
    }
    await fs2.promises.writeFile(configPathFs, JSON.stringify(config, null, 2));
  } catch (error) {
    console.log("[vscode-rhizome:init] Failed to clear stored OpenAI key", error?.message ?? error);
  }
}
async function isUEUMember() {
  try {
    execSync3("gh auth status", {
      encoding: "utf-8",
      timeout: 2e3,
      stdio: "pipe"
    });
  } catch {
    return false;
  }
  try {
    const org = execSync3("git config user.organization", {
      encoding: "utf-8",
      timeout: 2e3,
      stdio: "pipe"
    }).trim();
    if (org === "Unity-Environmental-University") {
      return true;
    }
  } catch {
  }
  try {
    const orgs = execSync3("gh org list", {
      encoding: "utf-8",
      timeout: 5e3
    }).split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    return orgs.includes("Unity-Environmental-University");
  } catch {
    return false;
  }
}

// src/services/personaService.ts
async function askPersonaWithPrompt(persona, personaDisplayName, prompt, context) {
  console.log(
    `[vscode-rhizome:persona] askPersonaWithPrompt \u2014 persona: ${persona}, promptLength: ${prompt.length}, hasContext: ${context ? "yes" : "no"}`
  );
  const workspaceRoot = vscode3.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode3.window.showErrorMessage("No workspace folder open");
    throw new Error("No workspace folder");
  }
  const initialized = await initializeRhizomeIfNeeded(workspaceRoot);
  if (!initialized) {
    vscode3.window.showErrorMessage("Could not initialize rhizome. Check workspace permissions.");
    throw new Error("Rhizome initialization failed");
  }
  try {
    const response = await queryPersona(prompt, persona, 3e4, workspaceRoot);
    console.log(
      `[vscode-rhizome:persona] queryPersona success \u2014 persona: ${persona}, responseLength: ${response.length}`
    );
    return response;
  } catch (error) {
    console.log("[vscode-rhizome:persona] queryPersona failed", error);
    throw error;
  }
}

// src/utils/helpers.ts
var vscode4 = __toESM(require("vscode"));
function detectLanguage(languageId) {
  if (languageId === "typescript" || languageId === "javascript") {
    return "typescript";
  }
  if (languageId === "python") {
    return "python";
  }
  return null;
}

// src/commands/commentParser.ts
function parseCommentInsertion(response, fileLines, commentPrefix = "//") {
  const insertions = [];
  const linePattern = /(?:line|lines?)\s*(\d+)(?:-(\d+))?:?\s*(.+?)(?=line|\n|$)/gi;
  let match;
  while ((match = linePattern.exec(response)) !== null) {
    const startLine = parseInt(match[1], 10) - 1;
    const endLine = match[2] ? parseInt(match[2], 10) - 1 : startLine;
    const comment = match[3].trim();
    const context = fileLines.slice(Math.max(0, startLine), Math.min(fileLines.length, endLine + 1)).join("\n");
    if (startLine >= 0 && startLine < fileLines.length) {
      insertions.push({
        lineNumber: startLine,
        comment: `${commentPrefix} ${comment}`,
        context
      });
    }
  }
  if (insertions.length === 0) {
    insertions.push({
      lineNumber: 0,
      comment: `${commentPrefix}
${commentPrefix} REVIEW:
${response.split("\n").map((line) => `${commentPrefix} ${line}`).join("\n")}`
    });
  }
  return insertions;
}
function formatInsertionPreview(insertions, fileLines) {
  return insertions.map((ins, idx) => {
    const lineNum = ins.lineNumber + 1;
    const codeLine = fileLines[ins.lineNumber] || "";
    return `[${idx + 1}] Line ${lineNum}:
${ins.comment}

${codeLine}
`;
  }).join("\n---\n\n");
}

// src/commands/personaCommands.ts
var import_child_process2 = require("child_process");
function getUserFriendlyError(error) {
  const message = error.message || String(error);
  if (message.includes("401") || message.includes("Unauthorized") || message.includes("403")) {
    return 'OpenAI API error: Check that your API key is valid and has credits remaining. Run: export OPENAI_API_KEY="sk-..." and restart VSCode';
  }
  if (message.includes("not found") || message.includes("Persona context")) {
    return "Rhizome persona context issue. Try: rhizome persona list to verify personas are available";
  }
  if (message.includes("timed out")) {
    return "Request timed out. Check internet connection and OpenAI API status";
  }
  if (message.includes("rhizome") && message.includes("not found")) {
    return "Rhizome CLI not found. Make sure rhizome is installed and in your PATH: which rhizome";
  }
  return `Error: ${message.substring(0, 150)}`;
}
async function ensurePersonaReady(workspaceRoot, persona) {
  const personas = await getAvailablePersonas();
  if (personas.has(persona)) {
    return true;
  }
  const choice = await vscode5.window.showWarningMessage(
    `${persona} persona is not available in this workspace. Initialize rhizome first?`,
    "Run rhizome init",
    "Rebuild personas",
    "Cancel"
  );
  if (!choice || choice === "Cancel") {
    return false;
  }
  try {
    if (choice === "Run rhizome init") {
      const initialized = await initializeRhizomeIfNeeded(workspaceRoot);
      if (!initialized) {
        return false;
      }
    } else if (choice === "Rebuild personas") {
      (0, import_child_process2.execSync)("rhizome persona merge", {
        cwd: workspaceRoot,
        encoding: "utf-8",
        stdio: "pipe",
        env: process.env
      });
    }
  } catch (error) {
    console.log("[vscode-rhizome:persona] Failed to repair persona context", error);
    vscode5.window.showErrorMessage(`Failed to prepare personas: ${error.message}`);
    return false;
  }
  const refreshed = await getAvailablePersonas();
  if (!refreshed.has(persona)) {
    vscode5.window.showErrorMessage(
      `${persona} persona is still missing. Please run "rhizome init" in the workspace and try again.`
    );
    return false;
  }
  return true;
}
function isOpenAIAuthError(error) {
  const message = (error?.message || "").toLowerCase();
  const stdout = typeof error?.stdout === "string" ? error.stdout.toLowerCase() : "";
  return message.includes("401") || message.includes("unauthorized") || stdout.includes("401") || stdout.includes("unauthorized");
}
async function handleOpenAIAuthError(workspaceRoot, error) {
  if (!isOpenAIAuthError(error)) {
    return false;
  }
  console.log("[vscode-rhizome] Detected OpenAI auth error. Clearing stored key and prompting user.");
  await clearStoredOpenAIKey(workspaceRoot);
  const reconfigured = await ensureOpenAIKeyConfigured(workspaceRoot, {
    forcePrompt: true,
    promptReason: "OpenAI rejected the stored API key (HTTP 401). Please enter a new key."
  });
  if (reconfigured) {
    vscode5.window.showInformationMessage("OpenAI API key updated. Please run the command again.");
  } else {
    vscode5.window.showWarningMessage("OpenAI API key remains unset. Command cancelled.");
  }
  return true;
}
var askPersonaCommand = async () => {
  const editor = vscode5.window.activeTextEditor;
  if (!editor || editor.selection.isEmpty) {
    vscode5.window.showErrorMessage("Please select code");
    return;
  }
  const workspaceRoot = vscode5.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode5.window.showErrorMessage("No workspace folder open");
    return;
  }
  if (!await ensureOpenAIKeyConfigured(workspaceRoot)) {
    return;
  }
  const selectedText = editor.document.getText(editor.selection).trim();
  const personas = await getAvailablePersonas();
  if (personas.size === 0) {
    vscode5.window.showErrorMessage("No personas available");
    return;
  }
  const personaOptions = Array.from(personas.entries()).map(([name, role]) => ({
    label: name,
    description: role
  }));
  const picked = await vscode5.window.showQuickPick(personaOptions, {
    placeHolder: "Choose a persona"
  });
  if (!picked) {
    return;
  }
  const question = await vscode5.window.showInputBox({
    title: `Ask ${picked.label}`,
    prompt: "What would you like to ask?",
    ignoreFocusOut: true
  });
  if (!question) {
    return;
  }
  try {
    await vscode5.window.withProgress(
      {
        location: vscode5.ProgressLocation.Notification,
        title: `${picked.label} is thinking...`,
        cancellable: false
      },
      async (progress) => {
        progress.report({ message: "Waiting for response..." });
        const prompt = `${question}

${selectedText}`;
        const response = await askPersonaWithPrompt(picked.label, picked.label, prompt);
        const language = detectLanguage(editor.document.languageId);
        const commentPrefix = language === "python" ? "#" : "//";
        const commentLines = response.split("\n").map((line) => `${commentPrefix} ${line}`);
        const comment = commentLines.join("\n");
        const insertPos = editor.selection.start;
        const edit = new vscode5.TextEdit(
          new vscode5.Range(insertPos, insertPos),
          `${commentPrefix} === ${picked.label} says:
${comment}
`
        );
        const workspaceEdit = new vscode5.WorkspaceEdit();
        workspaceEdit.set(editor.document.uri, [edit]);
        await vscode5.workspace.applyEdit(workspaceEdit);
        progress.report({ message: "Response inserted! \u2713" });
      }
    );
  } catch (error) {
    if (workspaceRoot && await handleOpenAIAuthError(workspaceRoot, error)) {
      return;
    }
    console.log("[vscode-rhizome:ask-persona] Command failed", error);
    const friendlyError = getUserFriendlyError(error);
    vscode5.window.showErrorMessage(friendlyError);
  }
};
var redPenReviewCommand = async () => {
  const editor = vscode5.window.activeTextEditor;
  if (!editor || editor.selection.isEmpty) {
    vscode5.window.showErrorMessage("Please select code to review");
    return;
  }
  const workspaceRoot = vscode5.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode5.window.showErrorMessage("No workspace folder open");
    return;
  }
  if (!await ensureOpenAIKeyConfigured(workspaceRoot)) {
    return;
  }
  if (!await ensurePersonaReady(workspaceRoot, "don-socratic")) {
    return;
  }
  const selectedText = editor.document.getText(editor.selection);
  console.log(
    `[vscode-rhizome:red-pen] Command invoked \u2014 file: ${editor.document.fileName}, language: ${editor.document.languageId}, selectionLength: ${selectedText.length}`
  );
  try {
    const language = detectLanguage(editor.document.languageId);
    const commentPrefix = language === "python" ? "#" : "//";
    await vscode5.window.withProgress(
      {
        location: vscode5.ProgressLocation.Notification,
        title: "Red pen review (don-socratic)...",
        cancellable: false
      },
      async (progress) => {
        progress.report({ message: "Analyzing code..." });
        const prompt = `You are the don-socratic. Read this. What questions does it raise?

For each place that invites questioning, write a comment (in ${commentPrefix} syntax):

Format: "${commentPrefix} Line X: [observation]. [question]?"

Examples:
${commentPrefix} Line 5: User could be undefined. What happens then?
${commentPrefix} Lines 12-15: Checking membership in an array. Have you measured the cost?

Here:

${selectedText}`;
        const response = await askPersonaWithPrompt("don-socratic", "don-socratic", prompt);
        console.log(`[vscode-rhizome:red-pen] Persona response received \u2014 length: ${response.length}`);
        const fileLines = editor.document.getText().split("\n");
        const insertions = parseCommentInsertion(response, fileLines, commentPrefix);
        console.log(`[vscode-rhizome:red-pen] Parsed insertions \u2014 count: ${insertions.length}`);
        const preview = formatInsertionPreview(insertions, fileLines);
        const approved = await vscode5.window.showInformationMessage(
          `Found ${insertions.length} suggested comments. Insert them?`,
          "Show Preview",
          "Insert All",
          "Cancel"
        );
        if (approved === "Cancel") {
          return;
        }
        if (approved === "Show Preview") {
          const doc = await vscode5.workspace.openTextDocument({
            language: language === "python" ? "python" : "typescript",
            content: preview
          });
          await vscode5.window.showTextDocument(doc);
          return;
        }
        const sortedInsertions = [...insertions].sort((a, b) => b.lineNumber - a.lineNumber);
        const edits = sortedInsertions.map((ins) => {
          const insertPos = new vscode5.Position(ins.lineNumber, 0);
          return new vscode5.TextEdit(
            new vscode5.Range(insertPos, insertPos),
            `${commentPrefix} \u{1F534} ${ins.comment}
`
          );
        });
        const workspaceEdit = new vscode5.WorkspaceEdit();
        workspaceEdit.set(editor.document.uri, edits);
        await vscode5.workspace.applyEdit(workspaceEdit);
        progress.report({ message: `${insertions.length} reviews inserted! \u2713` });
      }
    );
  } catch (error) {
    if (await handleOpenAIAuthError(workspaceRoot, error)) {
      return;
    }
    const friendlyError = getUserFriendlyError(error);
    vscode5.window.showErrorMessage(friendlyError);
  }
};
var redPenReviewFileCommand = async (fileUri) => {
  let targetUri = fileUri;
  let activeEditor;
  const workspaceRoot = vscode5.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode5.window.showErrorMessage("No workspace folder open");
    return;
  }
  if (!targetUri) {
    activeEditor = vscode5.window.activeTextEditor;
    if (!activeEditor) {
      vscode5.window.showErrorMessage("No file open");
      return;
    }
    targetUri = activeEditor.document.uri;
  } else {
    activeEditor = vscode5.window.visibleTextEditors.find(
      (editor) => editor.document.uri.fsPath === targetUri.fsPath
    );
  }
  if (!await ensureOpenAIKeyConfigured(workspaceRoot)) {
    return;
  }
  if (!await ensurePersonaReady(workspaceRoot, "don-socratic")) {
    return;
  }
  try {
    console.log(
      `[vscode-rhizome:red-pen-file] Command invoked \u2014 target: ${targetUri?.fsPath ?? "unknown"}, selectionActive: ${activeEditor && !activeEditor.selection.isEmpty}`
    );
    const fileContent = await vscode5.workspace.fs.readFile(targetUri);
    const fileText = new TextDecoder().decode(fileContent);
    const doc = await vscode5.workspace.openTextDocument(targetUri);
    const language = detectLanguage(doc.languageId);
    const commentPrefix = language === "python" ? "#" : "//";
    let textToReview = fileText;
    let selectionStartLine = 0;
    let selectionEndLine = fileText.split("\n").length;
    if (activeEditor && !activeEditor.selection.isEmpty) {
      textToReview = activeEditor.document.getText(activeEditor.selection);
      selectionStartLine = activeEditor.selection.start.line;
      selectionEndLine = activeEditor.selection.end.line;
    }
    await vscode5.window.withProgress(
      {
        location: vscode5.ProgressLocation.Notification,
        title: "Red pen review...",
        cancellable: false
      },
      async (progress) => {
        const scopeMessage = activeEditor && !activeEditor.selection.isEmpty ? "Analyzing selection..." : "Analyzing entire file...";
        progress.report({ message: scopeMessage });
        const prompt = `You are the don-socratic. Read this. What questions does it raise?

For each place that invites questioning, write a comment (in ${commentPrefix} syntax):

Format: "${commentPrefix} Line X: [observation]. [question]?"

Examples:
${commentPrefix} Line 12: Function imports from three places. Why those three?
${commentPrefix} Lines 45-50: Happy path handled. What about the sad one?

Here:

${textToReview}`;
        const response = await askPersonaWithPrompt("don-socratic", "don-socratic", prompt);
        console.log(
          `[vscode-rhizome:red-pen-file] Persona response received \u2014 length: ${response.length}`
        );
        const fileLines = fileText.split("\n");
        let insertions = parseCommentInsertion(response, fileLines, commentPrefix);
        console.log(
          `[vscode-rhizome:red-pen-file] Parsed insertions before selection filter \u2014 count: ${insertions.length}`
        );
        if (activeEditor && !activeEditor.selection.isEmpty) {
          insertions = insertions.filter(
            (ins) => ins.lineNumber >= selectionStartLine && ins.lineNumber <= selectionEndLine
          );
          console.log(
            `[vscode-rhizome:red-pen-file] Parsed insertions after selection filter \u2014 count: ${insertions.length}`
          );
        }
        const preview = formatInsertionPreview(insertions, fileLines);
        const approved = await vscode5.window.showInformationMessage(
          `Found ${insertions.length} suggested comments. Insert them?`,
          "Show Preview",
          "Insert All",
          "Cancel"
        );
        if (approved === "Cancel") {
          return;
        }
        if (approved === "Show Preview") {
          const previewDoc = await vscode5.workspace.openTextDocument({
            language: language === "python" ? "python" : "typescript",
            content: preview
          });
          await vscode5.window.showTextDocument(previewDoc);
          return;
        }
        const editor = await vscode5.window.showTextDocument(doc);
        const sortedInsertions = [...insertions].sort((a, b) => b.lineNumber - a.lineNumber);
        const edits = sortedInsertions.map((ins) => {
          const insertPos = new vscode5.Position(ins.lineNumber, 0);
          return new vscode5.TextEdit(
            new vscode5.Range(insertPos, insertPos),
            `${commentPrefix} \u{1F534} ${ins.comment}
`
          );
        });
        const workspaceEdit = new vscode5.WorkspaceEdit();
        workspaceEdit.set(targetUri, edits);
        await vscode5.workspace.applyEdit(workspaceEdit);
        progress.report({ message: `${insertions.length} reviews inserted! \u2713` });
      }
    );
  } catch (error) {
    if (await handleOpenAIAuthError(workspaceRoot, error)) {
      return;
    }
    console.log("[vscode-rhizome:red-pen-file] Command failed", error);
    const friendlyError = getUserFriendlyError(error);
    vscode5.window.showErrorMessage(friendlyError);
  }
};
function disposeCommands() {
}

// src/extension.ts
function activate(context) {
  console.log("[vscode-rhizome] ACTIVATION START");
  ensureLocalBinOnPath();
  context.subscriptions.push(
    new vscode6.Disposable(() => {
      disposeCommands();
    })
  );
  (async () => {
    try {
      const workspaceRoot = vscode6.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        console.log("[vscode-rhizome] No workspace folder open, skipping initialization");
        return;
      }
      console.log("[vscode-rhizome] Checking rhizome setup...");
      const initialized = await initializeRhizomeIfNeeded(workspaceRoot);
      if (initialized) {
        console.log("[vscode-rhizome] Rhizome is ready");
      } else {
        console.log("[vscode-rhizome] Rhizome initialization incomplete or cancelled");
      }
    } catch (error) {
      console.log("[vscode-rhizome] ERROR during initialization:", error.message);
    }
  })();
  (async () => {
    try {
      const personas = await getAvailablePersonas();
      console.log(`[vscode-rhizome] ${personas.size} personas available`);
    } catch (error) {
      console.log("[vscode-rhizome] ERROR fetching personas:", error.message);
    }
  })();
  context.subscriptions.push(
    vscode6.commands.registerCommand("vscode-rhizome.askPersona", askPersonaCommand)
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("vscode-rhizome.redPenReview", redPenReviewCommand)
  );
  context.subscriptions.push(
    vscode6.commands.registerCommand("vscode-rhizome.redPenReviewFile", redPenReviewFileCommand)
  );
  console.log("[vscode-rhizome] ACTIVATION COMPLETE");
}
function deactivate() {
  console.log("[vscode-rhizome] DEACTIVATION");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate,
  ensureOpenAIKeyConfigured
});
//# sourceMappingURL=extension.js.map

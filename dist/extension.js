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
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));

// src/stubGenerator.ts
function generateStub(functionName, params, returnType, language, options) {
  let todoComment = `TODO: Implement ${functionName}`;
  if (options?.timestamp) {
    todoComment += ` (stubbed ${options.timestamp}`;
    if (options?.userStory) {
      todoComment += `, ${options.userStory}`;
    }
    todoComment += ")";
  } else if (options?.userStory) {
    todoComment += ` (${options.userStory})`;
  }
  let stubBody;
  if (language === "python") {
    stubBody = `raise NotImplementedError('${functionName}')`;
  } else {
    stubBody = `throw new Error('Not implemented: ${functionName}');`;
  }
  return `${todoComment}
${stubBody}`;
}
function findStubComments(code, language) {
  const results = [];
  const lines = code.split("\n");
  const markerRegex = /@rhizome\s+stub/i;
  const tsJsFunctionRegex = /^(?:export\s+)?(?:const\s+)?(?:async\s+)?(?:function\s+)?(\w+)\s*(\([^)]*\))(?:\s*:\s*([\w<>\[\]|\s]+))?/;
  const pythonFunctionRegex = /^(?:async\s+)?def\s+(\w+)\s*(\([^)]*\))(?:\s*->\s*([\w\[\]]+))?:/;
  for (let i = 0; i < lines.length; i++) {
    if (markerRegex.test(lines[i])) {
      const markerLine = i;
      let signatureLine = i + 1;
      while (signatureLine < lines.length && lines[signatureLine].trim() === "") {
        signatureLine++;
      }
      if (signatureLine >= lines.length) {
        continue;
      }
      const sig = lines[signatureLine].trim();
      let match;
      let name, params, returnType;
      if (language === "python") {
        match = sig.match(pythonFunctionRegex);
        if (match) {
          name = match[1];
          params = match[2];
          returnType = match[3] || null;
        }
      } else {
        match = sig.match(tsJsFunctionRegex);
        if (match) {
          name = match[1];
          params = match[2];
          returnType = match[3]?.trim() || null;
        }
      }
      if (name && params) {
        results.push({
          line: markerLine,
          functionName: name,
          signature: sig,
          params,
          returnType: returnType ?? null
        });
      }
    }
  }
  return results;
}
function insertStub(code, line, stub, language) {
  const lineEnding = code.includes("\r\n") ? "\r\n" : "\n";
  const lines = code.split("\n");
  if (line < 0 || line >= lines.length) {
    throw new Error(`Invalid line number: ${line}`);
  }
  let signatureLine = line + 1;
  while (signatureLine < lines.length && lines[signatureLine].trim() === "") {
    signatureLine++;
  }
  if (signatureLine >= lines.length) {
    throw new Error("No function signature found after @rhizome stub marker");
  }
  const signatureText = lines[signatureLine];
  const indentation = signatureText.match(/^\s*/)?.[0] || "";
  let openingBraceLine = signatureLine;
  let openingBraceIndex = signatureText.indexOf("{");
  let openingColonIndex = signatureText.lastIndexOf(":");
  if (language === "python") {
    if (!signatureText.trimEnd().endsWith(":")) {
      openingBraceLine = signatureLine + 1;
      while (openingBraceLine < lines.length && !lines[openingBraceLine].trimEnd().endsWith(":")) {
        openingBraceLine++;
      }
    }
  } else {
    if (openingBraceIndex === -1) {
      openingBraceLine = signatureLine + 1;
      while (openingBraceLine < lines.length && lines[openingBraceLine].indexOf("{") === -1) {
        openingBraceLine++;
      }
    }
  }
  const stubLines = stub.split("\n");
  const bodyIndentation = indentation + "	";
  const indentedStub = stubLines.map((l) => {
    if (l === "")
      return "";
    return bodyIndentation + l;
  });
  if (language === "python") {
    lines.splice(openingBraceLine + 1, 0, ...indentedStub);
  } else {
    const hasBrace = lines[openingBraceLine].indexOf("{") !== -1;
    if (!hasBrace) {
      lines[openingBraceLine] = lines[openingBraceLine].trimEnd() + " {";
    }
    lines.splice(openingBraceLine + 1, 0, ...indentedStub);
    const nextLineAfterStub = openingBraceLine + indentedStub.length + 1;
    if (nextLineAfterStub >= lines.length || lines[nextLineAfterStub].trim() === "" || lines[nextLineAfterStub].trim().startsWith("}")) {
      if (!hasBrace || nextLineAfterStub < lines.length && !lines[nextLineAfterStub].trim().startsWith("}")) {
        lines.splice(nextLineAfterStub, 0, indentation + "}");
      }
    }
  }
  return lines.join(lineEnding);
}

// src/extension.ts
function activate(context) {
  console.log("vscode-rhizome activated");
  let donSocraticDisposable = vscode.commands.registerCommand("vscode-rhizome.donSocratic", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor");
      return;
    }
    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);
    if (!selectedText) {
      vscode.window.showErrorMessage("Please select code to question");
      return;
    }
    await vscode.window.showInformationMessage("Asking don-socratic...");
    const outputChannel = vscode.window.createOutputChannel("vscode-rhizome");
    outputChannel.show(true);
    outputChannel.appendLine("=".repeat(60));
    outputChannel.appendLine("don-socratic");
    outputChannel.appendLine("=".repeat(60));
    outputChannel.appendLine("Selected code:");
    outputChannel.appendLine("");
    outputChannel.appendLine(selectedText);
    outputChannel.appendLine("");
    outputChannel.appendLine("--- Waiting for persona response ---");
    outputChannel.appendLine("");
    try {
      const { execSync } = require("child_process");
      const response = execSync(`rhizome query --persona don-socratic`, {
        input: selectedText,
        encoding: "utf-8",
        timeout: 3e4
        // 30 second timeout
      });
      outputChannel.appendLine("");
      outputChannel.appendLine("Response from don-socratic:");
      outputChannel.appendLine("");
      outputChannel.appendLine(response);
    } catch (error) {
      outputChannel.appendLine("");
      outputChannel.appendLine("Error calling rhizome CLI:");
      outputChannel.appendLine(error.message);
      outputChannel.appendLine("");
      outputChannel.appendLine("Make sure rhizome is installed and in your PATH.");
    }
  });
  context.subscriptions.push(donSocraticDisposable);
  let stubDisposable = vscode.commands.registerCommand("vscode-rhizome.stub", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor");
      return;
    }
    const document = editor.document;
    const code = document.getText();
    const ext = document.languageId;
    const language = ext === "typescript" || ext === "javascript" ? "typescript" : ext === "python" ? "python" : null;
    if (!language) {
      vscode.window.showErrorMessage(`Unsupported language: ${ext}. Use TypeScript, JavaScript, or Python.`);
      return;
    }
    const stubs = findStubComments(code, language);
    if (stubs.length === 0) {
      vscode.window.showWarningMessage("No @rhizome stub comments found in this file");
      return;
    }
    let targetStub = stubs[0];
    if (stubs.length > 1) {
      const picked = await vscode.window.showQuickPick(
        stubs.map((s) => `Line ${s.line}: ${s.functionName}`),
        { placeHolder: "Which function to stub?" }
      );
      if (!picked)
        return;
      const index = stubs.map((s) => `Line ${s.line}: ${s.functionName}`).indexOf(picked);
      targetStub = stubs[index];
    }
    const stub = generateStub(targetStub.functionName, targetStub.params, targetStub.returnType, language);
    const modifiedCode = insertStub(code, targetStub.line, stub, language);
    const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(code.length));
    const edit = new vscode.TextEdit(fullRange, modifiedCode);
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.set(document.uri, [edit]);
    await vscode.workspace.applyEdit(workspaceEdit);
    vscode.window.showInformationMessage(`Stub created for ${targetStub.functionName}`);
  });
  context.subscriptions.push(stubDisposable);
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as cp from 'child_process';

import { preprocess, postprocess } from './process_levant'

const hclfmtPathConfig = 'hclformat.path';
const levantSupportConfig = 'hclformat.levant_support';

const output = vscode.window.createOutputChannel('HCL Format');

export function activate(context: vscode.ExtensionContext) {
    let clipath = vscode.workspace.getConfiguration().get<string>(hclfmtPathConfig);
    let cliexist = false;
    try {
        cliexist = fs.existsSync(clipath);
    } catch (err) {
        console.error(err);
    }

    if (!cliexist) {
        vscode.window.showWarningMessage(
            `hclfmt binary does not exist, please download the binary and configure "hclformat.path" accordingly.`
        );
    }

    function formatDocumentWithContent(document: vscode.TextDocument): vscode.TextEdit[] {
        let clipath = vscode.workspace.getConfiguration().get<string>(hclfmtPathConfig);
        let cliexist = false;
        try {
            cliexist = fs.existsSync(clipath);
        } catch (err) {
            console.error(err);
        }
        if (!cliexist) {
            vscode.window.showErrorMessage(`hclfmt path: ${clipath} does not exist`);
        }

        const start = new vscode.Position(0, 0);
        const end = new vscode.Position(
            document.lineCount - 1,
            document.lineAt(document.lineCount - 1).text.length
        );
        const range = new vscode.Range(start, end);
        let originalContent = document.getText(range);
        let mapping = undefined;
        let content = undefined;

        let levant = vscode.workspace.getConfiguration().get<boolean>(levantSupportConfig);
        if (levant) {
            output.appendLine('preprocess levant lines');
            let processed = preprocess(originalContent);
            mapping = processed.mapping;
            content = processed.content;
        } else {
            content = originalContent;
        }

        let ret: cp.SpawnSyncReturns<Buffer> = cp.spawnSync(clipath, [], { input: content });
        if (ret.status != 0) {
            output.appendLine('format error');
            output.appendLine(ret.stderr.toString())
            vscode.window.showErrorMessage(`hclfmt: ${ret.stderr.toString()}`)
            return []
        }
        let formatted = ret.stdout.toString();
        output.appendLine('formatted')

        if (levant) {
            output.appendLine('postprocess levant lines');
            formatted = postprocess(mapping, formatted);
        }
        return [vscode.TextEdit.replace(range, formatted)];
    }


    // 👍 formatter implemented using API
    vscode.languages.registerDocumentFormattingEditProvider('hcl', {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            return formatDocumentWithContent(document);
        }
    });
}

export function deactivate() { }


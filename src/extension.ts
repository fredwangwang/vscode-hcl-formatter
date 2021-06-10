import * as vscode from 'vscode';
import * as fs from 'fs';
import * as cp from 'child_process';
import * as path from 'path';

import { preprocess, postprocess } from './process_levant';
import { hasbin } from './hasbin';
import { Uri } from 'vscode';
import { getApi, FileDownloader } from "@microsoft/vscode-file-downloader-api";

const hclfmtPathConfig = 'hclformat.hclfmt_path';
const levantSupportConfig = 'hclformat.levant_support';

const output = vscode.window.createOutputChannel('HCL Format');

export async function activate(context: vscode.ExtensionContext) {
    const downloadedHclfmtPath = path.join(context.globalStorageUri.fsPath, getHclfmtName())
    output.appendLine(context.extensionPath)
    let cliPathConfig = vscode.workspace.getConfiguration().get<string>(hclfmtPathConfig);
    let [hclfmtPath, cliexist] = hasHclfmt(cliPathConfig);

    if (cliexist) {
        output.appendLine(`hclfmt found: ${hclfmtPath}`)
    }

    if (!cliexist) {
        const selectedInstall = await vscode.window.showInformationMessage(`Hclfmt not found. Install now?`, 'Install', 'Cancel');
        if (selectedInstall === 'Install') {
            await downloadHclfmt()
            hclfmtPath = downloadedHclfmtPath
            vscode.window.showInformationMessage(`Hclfmt downloaded.`)
        }
    }
    function hasHclfmt(hclfmtPath: string): [string, boolean] {
        let exist = false;
        if (hclfmtPath === "") {
            hclfmtPath = path.join(context.extensionPath, 'bin', getHclfmtName())
        }

        try {
            exist = fs.existsSync(hclfmtPath);
        } catch (err) {
            console.error(err);
        }
        if (exist) {
            return [hclfmtPath, true]
        }

        try {
            exist = fs.existsSync(downloadedHclfmtPath);
        } catch (err) {
            console.error(err);
        }
        if (exist) {
            return [downloadedHclfmtPath, true]
        }

        if (hasbin('hclfmt')) {
            return ['hclfmt', true]
        }

        if (hasbin('hclfmt.exe')) {
            return ['hclfmt', true]
        }
        return [hclfmtPath, false]
    }

    function getHclfmtName(): string {
        if (process.platform == 'darwin') {
            return 'hclfmt-darwin'
        }
        else if (process.platform == 'linux') {
            return 'hclfmt-linux'
        }
        return 'hclfmt-windows.exe'
    }

    async function downloadHclfmt() {
        const fileDownloader: FileDownloader = await getApi();
        const file: Uri = await fileDownloader.downloadFile(
            Uri.parse('https://github.com/fredwangwang/vscode-hcl-formatter/releases/download/0.4.0/' + getHclfmtName()),
            'hclfmt',
            context,
            undefined,
            undefined
        );
        output.appendLine(file.fsPath)
        fs.renameSync(file.fsPath, downloadedHclfmtPath)
        fs.chmodSync(downloadedHclfmtPath, 0o755)
    }

    function formatDocumentWithContent(document: vscode.TextDocument): vscode.TextEdit[] {
        let cliexist = false;
        try {
            cliexist = fs.existsSync(hclfmtPath);
        } catch (err) {
            console.error(err);
        }
        if (!cliexist) {
            vscode.window.showErrorMessage(`hclfmt path: ${hclfmtPath} does not exist`);
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

        let ret: cp.SpawnSyncReturns<Buffer> = cp.spawnSync(hclfmtPath, [], { input: content });
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

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Logger } from '../util/logger';

export class YamlDefinitionProvider implements vscode.DefinitionProvider {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    public async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): Promise<vscode.Location | undefined> {
        this.logger.log('provideDefinition called');
        const lineText = document.lineAt(position.line).text;
        const importFiles = this.getImports(document);

        for (const importPath of importFiles) {
            const resolvedPath = path.resolve(
                path.dirname(document.fileName),
                importPath
            );

            if (lineText.includes(importPath) && fs.existsSync(resolvedPath)) {
                this.logger.log(`Navigating to import path: ${resolvedPath}`);
                return new vscode.Location(
                    vscode.Uri.file(resolvedPath),
                    new vscode.Position(0, 0)
                );
            }
        }

        const wordRange = document.getWordRangeAtPosition(position);
        const word = document.getText(wordRange);

        this.logger.log(
            `Import files detected: ${JSON.stringify(importFiles)}`
        );
        this.logger.log(`Word at position: ${word}`);

        const start = wordRange.start
        var anchorName;
        if (word.startsWith('*')) {
            anchorName = word.substring(1);
        } else if (document.getText(wordRange.with(start.translate(0, -1), start)) === '*') {
            anchorName = word
        } else {
            this.logger.log('No anchor found (does not start with "*")');
            return undefined;
        }

        for (const filePath of importFiles) {
            this.logger.log(`Checking: ${filePath}`);
            const fullPath = path.resolve(
                path.dirname(document.fileName),
                filePath
            );
            if (fs.existsSync(fullPath)) {
                this.logger.log(`Reading file: ${fullPath}`);
                const fileContent = fs.readFileSync(fullPath, 'utf8');

                const anchorPattern = new RegExp(`&${anchorName}\\b`, 'm');

                const match = fileContent.match(anchorPattern);
                if (match) {
                    const matchIndex = match.index || 0;
                    const lines = fileContent.slice(0, matchIndex).split('\n');
                    const lineNumber = lines.length - 1;
                    const characterIndex = lines[lineNumber].length;

                    this.logger.log(
                        `Anchor found in ${fullPath} at line ${lineNumber}, character ${characterIndex}`
                    );

                    return new vscode.Location(
                        vscode.Uri.file(fullPath),
                        new vscode.Position(lineNumber, characterIndex)
                    );
                }
            } else {
                this.logger.log(`File does not exist: ${fullPath}`);
            }
        }

        this.logger.log('No definition found');
        return undefined;
    }

    private getImports(document: vscode.TextDocument): string[] {
        const text = document.getText();
        this.logger.log(`Document text: ${text}`);

        const sections = text.split(/^-{3,}\s*$/m);
        const importsSection = sections[0];

        const parsedDoc = yaml.load(importsSection);
        if (
            parsedDoc &&
            typeof parsedDoc === 'object' &&
            'import' in parsedDoc
        ) {
            return (parsedDoc as Record<string, unknown>)['import'] as string[];
        }
        return [];
    }
}

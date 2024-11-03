import * as vscode from 'vscode';
import { YamlDefinitionProvider } from './providers/YamlDefinitionProvider';
import { Logger } from './util/logger';

export function activate(context: vscode.ExtensionContext) {
    const configuration = vscode.workspace.getConfiguration('yamlExtension');
    const isLoggingEnabled = configuration.get<boolean>('enableLogging', false);

    const logChannel = vscode.window.createOutputChannel('YAML Extension Logs');
    const logger = new Logger(isLoggingEnabled, logChannel);

    const yamlDefinitionProvider = new YamlDefinitionProvider(logger);
    const yamlProviderRegistration =
        vscode.languages.registerDefinitionProvider(
            [
                { scheme: 'file', language: 'yaml' },
                { scheme: 'file', language: 'yml' },
            ],
            yamlDefinitionProvider
        );

    context.subscriptions.push(yamlProviderRegistration);
    logChannel.appendLine(
        'Extension started and ready to provide YAML definitions'
    );
    logChannel.show();
}

export function deactivate() {
    console.log('Extension deactivated');
}

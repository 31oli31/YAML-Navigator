import * as vscode from 'vscode';

export class Logger {
    private isEnabled: boolean;
    private channel?: vscode.OutputChannel;

    constructor(isEnabled: boolean, channel?: vscode.OutputChannel) {
        this.isEnabled = isEnabled;
        this.channel = channel;
    }

    public setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }

    public log(message: string) {
        if (this.isEnabled) {
            console.log(message);
            if (this.channel) {
                this.channel.appendLine(message);
            }
        }
    }
}

import { defineExtension } from 'reactive-vscode'
import * as vscode from 'vscode';
import { getSections, getRuleBySlug } from './data'


export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('myView', new MyViewProvider(context))
  );
}

class MyViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true
    };

    webviewView.webview.html = this.getHtmlContent();
  }

  private getHtmlContent(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>My Sidebar</title>
      </head>
      <body>
        <h1>Hello from My Sidebar!</h1>
      </body>
      </html>
    `;
  }
}

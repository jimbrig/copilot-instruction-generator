import type { Section } from './data'
import * as vscode from 'vscode'

interface WebviewContentParams {
  title: string
  content: string
  sectionNames: string[]
  sections: Section[]
  currentSection?: string
  currentRule?: string
  uri: vscode.Uri
}

function getNonce() {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

export function getWebviewContent(webview: vscode.Webview, params: WebviewContentParams): string {
  const { title, content, sectionNames, sections, currentSection, currentRule, uri } = params
  const cssUris = ['reset.css', 'vscode.css', 'main.css'].map(file =>
    webview.asWebviewUri(vscode.Uri.joinPath(uri, 'media', file)),
  )
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(uri, 'media', 'main.js'))

  // 获取当前 section 的 rules
  const currentSectionRules = currentSection
    ? sections.find(s => s.tag === currentSection)?.rules || []
    : []

  const nonce = getNonce()

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
    <title>AI Prompt Preview</title>
    ${cssUris.map(uri => `<link rel="stylesheet" href="${uri}">`).join('')}
</head>
<body>
    <h1>${title}</h1>
    <select id="sectionSelect">
        <option value="">Select a section</option>
        ${sectionNames.map(name => `<option value="${name}" ${name === currentSection ? 'selected' : ''}>${name}</option>`).join('')}
    </select>
    <select id="ruleSelect">
        <option value="">Select a rule</option>
        ${currentSectionRules.map(rule =>
          `<option value="${rule.title}" ${rule.title === currentRule ? 'selected' : ''}>${rule.title}</option>`,
        ).join('')}
    </select>
    <div id="content">${content}</div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`
}

import type { RuleBlock } from './data/builtin-rules/types'
import * as vscode from 'vscode'

/**
 * Represents a section of rules
 */
interface Section {
  /** Tag identifier for the section */
  tag: string
  /** List of rules in this section */
  rules: RuleBlock[]
}

/**
 * Parameters for generating webview content
 */
interface WebviewContentParams {
  /** Title of the webview */
  title: string
  /** Main content to display */
  content: string
  /** List of available section names */
  sectionNames: string[]
  /** List of sections with their rules */
  sections: Section[]
  /** Currently selected section */
  currentSection?: string
  /** Currently selected rule */
  currentRule?: string
  /** Base URI for resource loading */
  uri: vscode.Uri
}

/**
 * Generate a random nonce for CSP
 */
function getNonce(): string {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  return text
}

/**
 * Generate HTML content for the webview
 */
export function getWebviewContent(webview: vscode.Webview, params: WebviewContentParams): string {
  const { title, content, sectionNames, sections, currentSection, currentRule, uri } = params

  // Load CSS resources
  const cssUris = ['reset.css', 'vscode.css', 'main.css'].map(file =>
    webview.asWebviewUri(vscode.Uri.joinPath(uri, 'media', file)),
  )

  // Load JavaScript resource
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(uri, 'media', 'main.js'))

  // Get rules for current section
  const currentSectionRules = currentSection
    ? sections.find(s => s.tag === currentSection)?.rules || []
    : []

  // Generate nonce for CSP
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

import type * as vscode from 'vscode'
import type { Section } from './data'

interface WebviewContentParams {
  title: string
  content: string
  sectionNames: string[]
  sections: Section[]
  currentSection?: string
  currentRule?: string
  scriptUri: vscode.Uri
}

function getNonce() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function getWebviewContent(params: WebviewContentParams): string {
  const { title, content, sectionNames, sections, currentSection, currentRule, scriptUri } = params
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Prompt Preview</title>
    <style>
        :root {
            --background: #ffffff;
            --foreground: #0f172a;
            --primary: #0f172a;
            --primary-foreground: #ffffff;
            --border: #e2e8f0;
            --ring: #94a3b8;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            background-color: var(--background);
            color: var(--foreground);
        }
        h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        select {
            width: 100%;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid var(--border);
            background-color: var(--background);
            color: var(--foreground);
            font-size: 14px;
            margin-bottom: 16px;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        select:focus {
            outline: none;
            border-color: var(--ring);
            box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.2);
        }
        #content {
            white-space: pre-wrap;
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 16px;
            margin-top: 20px;
            font-size: 14px;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <select id="sectionSelect">
        <option value="">Select a section</option>
        ${sectionNames.map(name => `<option value="${name}" ${name === currentSection ? 'selected' : ''}>${name}</option>`).join('')}
    </select>
    <select id="ruleSelect">
        <option value="">Select a rule</option>
        ${currentSection
          ? sections.find(s => s.tag === currentSection)?.rules.map(rule =>
            `<option value="${rule.title}" ${rule.title === currentRule ? 'selected' : ''}>${rule.title}</option>`,
          ).join('')
          : ''}
    </select>
    <div id="content">${content}</div>
    <script nonce="${getNonce()}" src="${scriptUri}"></script>
</body>
</html>`
}

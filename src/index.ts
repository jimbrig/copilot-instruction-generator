import { Buffer } from 'node:buffer'
import * as vscode from 'vscode'
import { Configs } from './config'
import { getSections } from './data'

const COPILOT_PATH = '.github/copilot-instructions.md'
const CURSOR_PATH = '.cursorrules'

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('cig.selectAIPrompt', async () => {
    const sections = getSections()
    const sectionNames = sections.map(section => section.tag)

    let currentSection: string | undefined
    let currentRule: string | undefined

    const panel = vscode.window.createWebviewPanel(
      'aiPromptPreview',
      'AI Prompt Preview',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      },
    )

    async function updatePanel() {
      const section = sections.find(s => s.tag === currentSection)
      const rule = section?.rules.find(r => r.title === currentRule)

      if (rule) {
        panel.webview.html = getWebviewContent(rule.title, rule.content)
      }
      else {
        panel.webview.html = getWebviewContent('Select a rule', 'Please select a section and a rule to preview.')
      }
    }

    panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'insert':
          if (currentRule) {
            const rule = sections.find(s => s.tag === currentSection)?.rules.find(r => r.title === currentRule)
            if (rule) {
              await insertPromptToFile(rule.content)
              vscode.window.showInformationMessage(`Prompt "${currentRule}" inserted successfully.`)
            }
          }
          break
        case 'changeSection':
          await selectSection()
          break
        case 'changeRule':
          await selectRule()
          break
      }
    })

    async function selectSection() {
      currentSection = await vscode.window.showQuickPick(sectionNames, {
        placeHolder: 'Select a section',
        canPickMany: false,
      })
      currentRule = undefined
      await selectRule()
    }

    async function selectRule() {
      const section = sections.find(s => s.tag === currentSection)
      const ruleNames = section?.rules.map(rule => rule.title) || []

      currentRule = await vscode.window.showQuickPick(ruleNames, {
        placeHolder: 'Select a rule',
        canPickMany: false,
      })
      await updatePanel()
    }

    await selectSection()

    context.subscriptions.push(panel)
  })

  context.subscriptions.push(disposable)
}

function getWebviewContent(title: string, content: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI Prompt Preview</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        pre { white-space: pre-wrap; word-wrap: break-word; }
        button { margin-right: 10px; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <pre>${content}</pre>
      <button onclick="insert()">Insert</button>
      <button onclick="changeSection()">Change Section</button>
      <button onclick="changeRule()">Change Rule</button>
      <script>
        const vscode = acquireVsCodeApi();
        function insert() {
          vscode.postMessage({ command: 'insert' });
        }
        function changeSection() {
          vscode.postMessage({ command: 'changeSection' });
        }
        function changeRule() {
          vscode.postMessage({ command: 'changeRule' });
        }
      </script>
    </body>
    </html>
  `
}

async function insertPromptToFile(promptText: string) {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace folder found.')
    return
  }

  const filePath = vscode.Uri.joinPath(workspaceFolders[0].uri, Configs.cursorRules ? CURSOR_PATH : COPILOT_PATH)

  try {
    const content = await vscode.workspace.fs.readFile(filePath)
    const updatedContent = `${content.toString()}\n\n${promptText}`
    await vscode.workspace.fs.writeFile(filePath, Buffer.from(updatedContent, 'utf8'))
  }
  catch (error) {
    const initialContent = `# ${Configs.cursorRules ? 'Cursor Rules' : 'Copilot Instructions'}\n\n${promptText}`
    await vscode.workspace.fs.writeFile(filePath, Buffer.from(initialContent, 'utf8'))
  }
}

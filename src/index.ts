import type { Rule, Section } from './data'
import { Buffer } from 'node:buffer'
import * as vscode from 'vscode'
import { Configs } from './config'
import { getSections } from './data'

import { getWebviewContent } from './webview'

const COPILOT_PATH = '.github/copilot-instructions.md'
const CURSOR_PATH = '.cursorrules'

export function activate(context: vscode.ExtensionContext) {
  let panel: vscode.WebviewPanel | undefined
  let currentSection: string | undefined
  let currentRule: string | undefined

  const sections = getSections()

  const disposable = vscode.commands.registerCommand('cig.selectAIPrompt', async () => {
    if (panel) {
      panel.reveal(vscode.ViewColumn.One)
    }
    else {
      panel = createWebviewPanel()
    }

    await updatePanelContent(sections)
  })

  function createWebviewPanel(): vscode.WebviewPanel {
    const newPanel = vscode.window.createWebviewPanel(
      'aiPromptPreview',
      'AI Prompt Preview',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')],
      },
    )

    newPanel.webview.onDidReceiveMessage(handleWebviewMessage)
    context.subscriptions.push(newPanel)

    return newPanel
  }

  async function updatePanelContent(sections: Section[]) {
    if (!panel)
      return

    const section = sections.find(s => s.tag === currentSection)
    const rule = section?.rules.find(r => r.title === currentRule)

    panel.webview.html = getWebviewContent(panel.webview, {
      title: rule ? rule.title : 'Select a rule',
      content: rule ? rule.content : 'Please select a section and a rule to preview.',
      sectionNames: sections.map(section => section.tag),
      sections, // Ensure sections are passed to getWebviewContent
      currentSection,
      currentRule,
      uri: context.extensionUri,
    })
  }

  async function handleWebviewMessage(message: any) {
    switch (message.command) {
      case 'changeSection':
        currentSection = message.section
        currentRule = undefined // Reset currentRule when changing section
        await updatePanelContent(sections)
        break
      case 'changeRule':
        currentRule = message.rule === '' ? undefined : message.rule // Handle empty selection
        await updatePanelContent(sections)
        if (currentRule) {
          await writeRuleToFile(sections)
        }
        break
    }
  }

  async function writeRuleToFile(sections: Section[]) {
    const rule = findCurrentRule(sections)
    if (rule) {
      await insertPromptToFile(rule.content)
      vscode.window.showInformationMessage(`Rule "${currentRule}" written successfully.`)
    }
  }

  function findCurrentRule(sections: Section[]): Rule | undefined {
    return sections
      .find(s => s.tag === currentSection)
      ?.rules
      .find(r => r.title === currentRule)
  }

  context.subscriptions.push(disposable)
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
  catch {
    const initialContent = `# ${Configs.cursorRules ? 'Cursor Rules' : 'Copilot Instructions'}\n\n${promptText}`
    await vscode.workspace.fs.writeFile(filePath, Buffer.from(initialContent, 'utf8'))
  }
}

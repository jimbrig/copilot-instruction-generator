import type { Rule, Section } from './data'
import { Buffer } from 'node:buffer'
import * as vscode from 'vscode'
import { Configs } from './config'
import { getSections, rules } from './data'
import { getLocaleMessages } from './i18n'

import { getWebviewContent } from './webview'

const COPILOT_PATH = '.github/copilot-instructions.md'
const CURSOR_PATH = '.cursorrules'
const IGNORED_WORKSPACES_KEY = 'cigIgnoredWorkspaces'

export function activate(context: vscode.ExtensionContext) {
  let panel: vscode.WebviewPanel | undefined
  let currentSection: string | undefined
  let currentRule: string | undefined

  const sections = getSections()

  // 预处理规则的搜索文本
  const rulesWithSearchText = rules.map(rule => ({
    ...rule,
    searchText: `${rule.title} ${rule.tags.join(' ')} ${rule.content}`.toLowerCase(),
  }))

  async function checkAIConfigFiles() {
    if (!Configs.enableAutoDetect)
      return

    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders)
      return

    const messages = getLocaleMessages()
    const workspaceFolder = workspaceFolders[0]
    const workspaceId = workspaceFolder.uri.toString()

    const ignoredWorkspaces: string[] = context.globalState.get(IGNORED_WORKSPACES_KEY, [])
    if (ignoredWorkspaces.includes(workspaceId))
      return

    const copilotFile = vscode.Uri.joinPath(workspaceFolder.uri, COPILOT_PATH)
    const cursorFile = vscode.Uri.joinPath(workspaceFolder.uri, CURSOR_PATH)

    try {
      await vscode.workspace.fs.stat(copilotFile)
      return
    }
    catch {}

    try {
      await vscode.workspace.fs.stat(cursorFile)
      return
    }
    catch {}

    const result = await vscode.window.showInformationMessage(
      messages.noAIConfigFound,
      messages.searchAndCreate,
      messages.ignoreProject,
      messages.cancel,
    )

    if (result === messages.searchAndCreate) {
      await vscode.commands.executeCommand('cig.searchAIPrompt')
    }
    else if (result === messages.ignoreProject) {
      ignoredWorkspaces.push(workspaceId)
      await context.globalState.update(IGNORED_WORKSPACES_KEY, ignoredWorkspaces)
    }
  }

  checkAIConfigFiles()

  const workspaceWatcher = vscode.workspace.onDidChangeWorkspaceFolders(() => {
    checkAIConfigFiles()
  })

  context.subscriptions.push(workspaceWatcher)

  const searchDisposable = vscode.commands.registerCommand('cig.searchAIPrompt', async () => {
    const messages = getLocaleMessages()
    const quickPick = vscode.window.createQuickPick()
    quickPick.placeholder = messages.searchPlaceholder

    // 初始显示所有规则
    const getAllItems = () => rulesWithSearchText.map(rule => ({
      label: rule.title,
      description: rule.tags.join(', '),
      rule,
    }))

    quickPick.items = getAllItems()

    // 使用防抖进行搜索
    let debounceTimer: NodeJS.Timeout
    quickPick.onDidChangeValue((value) => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        const searchQuery = value.toLowerCase()
        quickPick.items = searchQuery
          ? rulesWithSearchText
              .filter(rule => rule.searchText.includes(searchQuery))
              .map(rule => ({
                label: rule.title,
                description: rule.tags.join(', '),
                rule,
              }))
          : getAllItems()
      }, 100) // 100ms 的防抖延迟
    })

    quickPick.onDidAccept(async () => {
      const selected = quickPick.selectedItems[0] as { label: string, description: string, rule: Rule }
      if (selected) {
        await insertPromptToFile(selected.rule.content)
        vscode.window.showInformationMessage(messages.ruleAddedSuccess(selected.label))
      }
      quickPick.hide()
    })

    quickPick.show()
  })

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
      const messages = getLocaleMessages()
      const result = await vscode.window.showWarningMessage(
        messages.confirmOverwrite,
        messages.overwrite,
        messages.cancel,
      )

      if (result === messages.overwrite) {
        await insertPromptToFile(rule.content)
        vscode.window.showInformationMessage(messages.ruleAddedSuccess(currentRule!))
      }
    }
  }

  function findCurrentRule(sections: Section[]): Rule | undefined {
    return sections
      .find(s => s.tag === currentSection)
      ?.rules
      .find(r => r.title === currentRule)
  }

  const clearStateDisposable = vscode.commands.registerCommand('cig.clearGlobalState', async () => {
    const messages = getLocaleMessages()
    const result = await vscode.window.showWarningMessage(
      messages.clearStateConfirm,
      messages.yes,
      messages.no,
    )

    if (result === messages.yes) {
      await context.globalState.update(IGNORED_WORKSPACES_KEY, undefined)
      vscode.window.showInformationMessage(messages.clearStateSuccess)
    }
  })

  context.subscriptions.push(disposable, searchDisposable, clearStateDisposable)
}

async function insertPromptToFile(promptText: string) {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace folder found.')
    return
  }

  const filePath = vscode.Uri.joinPath(workspaceFolders[0].uri, Configs.cursorRules ? CURSOR_PATH : COPILOT_PATH)
  const initialContent = `# ${Configs.cursorRules ? 'Cursor Rules' : 'Copilot Instructions'}\n\n${promptText}`
  await vscode.workspace.fs.writeFile(filePath, Buffer.from(initialContent, 'utf8'))
}

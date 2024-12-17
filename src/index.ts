import type { Rule, Section } from './data'
import { Buffer } from 'node:buffer'
import * as vscode from 'vscode'
import { Configs } from './config'
import { getSections, rules } from './data'
import { deleteCustomRule, editCustomRule, getCustomRules, saveCustomRule } from './data/custom-rules'
import { getLocaleMessages } from './i18n'

import { getWebviewContent } from './webview'
import { getRuleEditorContent } from './webview/rule-editor'

const COPILOT_PATH = '.github/copilot-instructions.md'
const CURSOR_PATH = '.cursorrules'
const IGNORED_WORKSPACES_KEY = 'cigIgnoredWorkspaces'

export function activate(context: vscode.ExtensionContext) {
  // 创建 status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  )
  statusBarItem.command = 'ai-rules.openRuleFile'
  statusBarItem.text = '$(notebook-edit) AI Rules'
  statusBarItem.tooltip = 'Open AI Config File'
  statusBarItem.show()

  // 将 status bar item 添加到订阅列表
  context.subscriptions.push(statusBarItem)

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

  const searchDisposable = vscode.commands.registerCommand('ai-rules.searchAIPrompt', async () => {
    const messages = getLocaleMessages()
    const quickPick = vscode.window.createQuickPick()
    quickPick.placeholder = messages.searchPlaceholder

    // 获取所有规则，包括自定义规则
    const customRules = await getCustomRules(context)
    const allRules = [...rulesWithSearchText, ...customRules.map(rule => ({
      ...rule,
      searchText: `${rule.title} ${rule.tags.join(' ')} ${rule.content}`.toLowerCase(),
    }))]

    // 初始显示所有规则
    const getAllItems = () => [
      {
        label: '$(add) Create New Rule',
        description: messages.createNewRuleDescription,
        alwaysShow: true,
        rule: { type: 'create' } as any,
      },
      {
        label: 'Custom Rules',
        kind: vscode.QuickPickItemKind.Separator,
      },
      ...customRules.map(rule => ({
        label: `$(bookmark) ${rule.title}`,
        description: rule.tags.join(', '),
        rule,
      })),
      {
        label: 'Built-in Rules',
        kind: vscode.QuickPickItemKind.Separator,
      },
      ...allRules.map(rule => ({
        label: `$(symbol-constant) ${rule.title}`,
        description: rule.tags.join(', '),
        rule,
      })),
    ]

    quickPick.items = getAllItems()

    // 修改选择处理逻辑
    quickPick.onDidAccept(async () => {
      const selected = quickPick.selectedItems[0] as { label: string, description: string, rule: Rule }
      if (!selected)
        return

      if (selected.rule.type === 'create') {
        quickPick.hide()
        const title = await vscode.window.showInputBox({
          prompt: messages.enterRuleTitle,
          placeHolder: messages.ruleTitlePlaceholder,
        })
        if (!title)
          return

        const content = await vscode.window.showInputBox({
          prompt: messages.enterRuleContent,
          placeHolder: messages.ruleContentPlaceholder,
        })
        if (!content)
          return

        const tags = await vscode.window.showInputBox({
          prompt: messages.enterRuleTags,
          placeHolder: messages.ruleTagsPlaceholder,
        })

        const newRule: Rule = {
          title,
          slug: title.toLowerCase().replace(/\s+/g, '-'),
          content,
          tags: tags ? tags.split(',').map(t => t.trim()) : [],
          author: {
            name: 'Custom',
            url: '',
            avatar: '',
          },
        }

        await saveCustomRule(context, newRule)
        vscode.window.showInformationMessage(messages.customRuleAdded)
        return
      }

      const choice = await vscode.window.showQuickPick(
        [
          { label: messages.replaceContent, value: 'replace' },
          { label: messages.appendContent, value: 'append' },
        ],
        { placeHolder: messages.selectOperation },
      )

      if (choice) {
        if (choice.value === 'append')
          await appendPromptToFile(selected.rule.content)
        else
          await insertPromptToFile(selected.rule.content)

        vscode.window.showInformationMessage(messages.ruleAddedSuccess(selected.label))
      }
      quickPick.hide()
    })
  })

  const disposable = vscode.commands.registerCommand('ai-rules.selectAIPrompt', async () => {
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

  const clearStateDisposable = vscode.commands.registerCommand('ai-rules.clearGlobalState', async () => {
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

  const openRuleFileDisposable = vscode.commands.registerCommand('ai-rules.openRuleFile', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders) {
      vscode.window.showErrorMessage(messages.noWorkspaceFolder)
      return
    }

    const filePath = vscode.Uri.joinPath(workspaceFolders[0].uri, Configs.cursorRules ? CURSOR_PATH : COPILOT_PATH)
    try {
      const doc = await vscode.workspace.openTextDocument(filePath)
      await vscode.window.showTextDocument(doc)
    }
    catch {
      vscode.window.showErrorMessage(messages.fileNotFound)
    }
  })

  const manageCustomRulesDisposable = vscode.commands.registerCommand('ai-rules.manageCustomRules', async () => {
    const messages = getLocaleMessages()
    const customRules = await getCustomRules(context)

    const selectedRule = await vscode.window.showQuickPick(
      [
        { label: '$(add) Add New Rule', value: 'new' },
        ...customRules.map(rule => ({
          label: rule.title,
          description: rule.tags.join(', '),
          value: rule.slug,
        })),
      ],
      { placeHolder: messages.selectRuleToManage },
    )

    if (!selectedRule)
      return

    if (selectedRule.value === 'new') {
      // 实现新建规则的逻辑
      const title = await vscode.window.showInputBox({
        prompt: messages.enterRuleTitle,
        placeHolder: messages.ruleTitlePlaceholder,
      })
      if (!title)
        return

      const content = await vscode.window.showInputBox({
        prompt: messages.enterRuleContent,
        placeHolder: messages.ruleContentPlaceholder,
      })
      if (!content)
        return

      const tags = await vscode.window.showInputBox({
        prompt: messages.enterRuleTags,
        placeHolder: messages.ruleTagsPlaceholder,
      })

      const newRule: Rule = {
        title,
        slug: title.toLowerCase().replace(/\s+/g, '-'),
        content,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        author: {
          name: 'Custom',
          url: '',
          avatar: '',
        },
      }

      await saveCustomRule(context, newRule)
      vscode.window.showInformationMessage(messages.customRuleAdded)
      return
    }

    const action = await vscode.window.showQuickPick(
      [
        { label: messages.editRule, value: 'edit' },
        { label: messages.deleteRule, value: 'delete' },
      ],
      { placeHolder: messages.selectAction },
    )

    if (!action)
      return

    const rule = customRules.find(r => r.slug === selectedRule.value)
    if (!rule)
      return

    if (action.value === 'edit') {
      const title = await vscode.window.showInputBox({
        prompt: messages.enterRuleTitle,
        placeHolder: messages.ruleTitlePlaceholder,
        value: rule.title,
      })
      if (!title)
        return

      const content = await vscode.window.showInputBox({
        prompt: messages.enterRuleContent,
        placeHolder: messages.ruleContentPlaceholder,
        value: rule.content,
      })
      if (!content)
        return

      const tags = await vscode.window.showInputBox({
        prompt: messages.enterRuleTags,
        placeHolder: messages.ruleTagsPlaceholder,
        value: rule.tags.join(', '),
      })

      await editCustomRule(context, rule.slug, {
        title,
        content,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
      })
      vscode.window.showInformationMessage(messages.ruleUpdated)
    }
    else if (action.value === 'delete') {
      const confirm = await vscode.window.showWarningMessage(
        messages.confirmDelete(rule.title),
        messages.yes,
        messages.no,
      )
      if (confirm === messages.yes) {
        await deleteCustomRule(context, rule.slug)
        vscode.window.showInformationMessage(messages.ruleDeleted)
      }
    }
  })

  const createRuleDisposable = vscode.commands.registerCommand('ai-rules.createRule', async () => {
    const panel = vscode.window.createWebviewPanel(
      'ruleEditor',
      'Create New Rule',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    )

    panel.webview.html = getRuleEditorContent(panel.webview)

    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'saveRule') {
        await saveCustomRule(context, message.rule)
        vscode.window.showInformationMessage(messages.customRuleAdded)
        panel.dispose()
      }
    })
  })

  const searchRulesDisposable = vscode.commands.registerCommand('ai-rules.searchRules', async () => {
    const activeEditor = vscode.window.activeTextEditor
    if (!activeEditor)
      return

    const messages = getLocaleMessages()
    const quickPick = vscode.window.createQuickPick()
    quickPick.placeholder = messages.searchPlaceholder

    // 获取所有规则，包括自定义规则
    const customRules = await getCustomRules(context)
    const allRules = [...rulesWithSearchText, ...customRules.map(rule => ({
      ...rule,
      searchText: `${rule.title} ${rule.tags.join(' ')} ${rule.content}`.toLowerCase(),
    }))]

    // 初始显示所有规则
    const getAllItems = () => [
      {
        label: '$(add) Create New Rule',
        description: messages.createNewRuleDescription,
        alwaysShow: true,
        rule: { type: 'create' } as any,
      },
      {
        label: 'Custom Rules',
        kind: vscode.QuickPickItemKind.Separator,
      },
      ...customRules.map(rule => ({
        label: `$(bookmark) ${rule.title}`,
        description: rule.tags.join(', '),
        rule,
      })),
      {
        label: 'Built-in Rules',
        kind: vscode.QuickPickItemKind.Separator,
      },
      ...allRules.map(rule => ({
        label: `$(symbol-constant) ${rule.title}`,
        description: rule.tags.join(', '),
        rule,
      })),
    ]

    quickPick.items = getAllItems()

    // 使用防抖进行搜索
    let debounceTimer: NodeJS.Timeout
    quickPick.onDidChangeValue((value) => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        const searchQuery = value.toLowerCase()
        quickPick.items = searchQuery
          ? allRules
              .filter(rule => rule.searchText.includes(searchQuery))
              .map(rule => ({
                label: `$(symbol-constant) ${rule.title}`,
                description: rule.tags.join(', '),
                rule,
              }))
          : getAllItems()
      }, 100)
    })

    quickPick.onDidAccept(async () => {
      const selected = quickPick.selectedItems[0] as { label: string, description: string, rule: Rule }
      if (!selected)
        return

      if (selected.rule.type === 'create') {
        quickPick.hide()
        await vscode.commands.executeCommand('ai-rules.createRule')
        return
      }

      const choice = await vscode.window.showQuickPick(
        [
          { label: messages.replaceContent, value: 'replace' },
          { label: messages.appendContent, value: 'append' },
        ],
        { placeHolder: messages.selectOperation },
      )

      if (choice) {
        if (choice.value === 'append')
          await appendPromptToFile(selected.rule.content)
        else
          await insertPromptToFile(selected.rule.content)

        vscode.window.showInformationMessage(messages.ruleAddedSuccess(selected.label))
      }
      quickPick.hide()
    })

    quickPick.show()
  })

  context.subscriptions.push(disposable, searchDisposable, clearStateDisposable, openRuleFileDisposable, manageCustomRulesDisposable, createRuleDisposable, searchRulesDisposable)
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

async function appendPromptToFile(promptText: string) {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    vscode.window.showErrorMessage(messages.noWorkspaceFolder)
    return
  }

  const filePath = vscode.Uri.joinPath(workspaceFolders[0].uri, Configs.cursorRules ? CURSOR_PATH : COPILOT_PATH)
  try {
    const existingContent = await vscode.workspace.fs.readFile(filePath)
    const newContent = `${existingContent.toString()}\n\n${promptText}`
    await vscode.workspace.fs.writeFile(filePath, Buffer.from(newContent, 'utf8'))
  }
  catch {
    // 如果文件不存在，创建新文件
    await insertPromptToFile(promptText)
  }
}

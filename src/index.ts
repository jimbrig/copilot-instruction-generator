import type { RuleBlock } from './data/builtin-rules/types'
import { Buffer } from 'node:buffer'
import * as vscode from 'vscode'
import { Configs } from './config'
import { ensureMetaRule, generateBlockComment } from './data/builtin-rules/meta'
import { deleteCustomRule, getCustomRules, saveCustomRule } from './data/custom-rules'
import { cleanCodeRules } from './data/rules/clean-code'
import { pythonRules } from './data/rules/python'
import { getLocaleMessages } from './i18n'
import { MarkdownAssociation } from './language/markdown-association'
import { getRuleEditorContent } from './webview/rule-editor'

const COPILOT_PATH = '.github/copilot-instructions.md'
const CURSOR_PATH = '.cursorrules'

const builtinRules: RuleBlock[] = [...cleanCodeRules, ...pythonRules]

class RuleTreeItem extends vscode.TreeItem {
  constructor(
    public readonly rule: RuleBlock,
    public readonly type: 'builtin' | 'custom',
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(rule.title, collapsibleState)
    this.tooltip = rule.content
    this.description = rule.tags.join(', ')
    this.iconPath = type === 'builtin'
      ? new vscode.ThemeIcon('symbol-constant')
      : new vscode.ThemeIcon('bookmark')
    this.contextValue = type
  }
}

class RulesProvider implements vscode.TreeDataProvider<RuleTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<RuleTreeItem | undefined>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  constructor(public readonly context: vscode.ExtensionContext) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined)
  }

  getTreeItem(element: RuleTreeItem): vscode.TreeItem {
    return element
  }

  async getChildren(): Promise<RuleTreeItem[]> {
    // 获取内置规则和自定义规则
    const rules = [...builtinRules]
    const customRules = await getCustomRules(this.context)

    return [
      ...rules.map(rule => new RuleTreeItem(
        rule,
        'builtin',
        vscode.TreeItemCollapsibleState.None,
      )),
      ...customRules.map(rule => new RuleTreeItem(
        rule as RuleBlock,
        'custom',
        vscode.TreeItemCollapsibleState.None,
      )),
    ]
  }
}

// 创建全局的RulesProvider实例
let rulesProvider: RulesProvider

async function editRule(rule: RuleBlock) {
  const messages = getLocaleMessages()
  const panel = vscode.window.createWebviewPanel(
    'ruleEditor',
    `${messages.editRule}: ${rule.title}`,
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    },
  )

  panel.webview.html = getRuleEditorContent(panel.webview, rule)

  panel.webview.onDidReceiveMessage(async (message) => {
    try {
      switch (message.command) {
        case 'saveRule':
          await updateRuleInFile(rule, message.rule)
          vscode.window.showInformationMessage(messages.ruleUpdated)
          panel.dispose()
          break
        case 'error':
          vscode.window.showErrorMessage(message.message)
          break
      }
    }
    catch (error) {
      console.error('Error handling webview message:', error)
      vscode.window.showErrorMessage(messages.operationFailed)
    }
  })
}

async function updateRuleInFile(oldRule: RuleBlock, newRule: RuleBlock) {
  const messages = getLocaleMessages()
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    throw new Error(messages.noWorkspaceFolder)
  }

  const filePath = vscode.Uri.joinPath(
    workspaceFolders[0].uri,
    Configs.cursorRules ? CURSOR_PATH : COPILOT_PATH,
  )

  try {
    const fileContent = await vscode.workspace.fs.readFile(filePath)
    const content = fileContent.toString()

    // 验证新规则
    if (!newRule.title || newRule.title.length < 3 || newRule.title.length > 100) {
      throw new Error(messages.titleRequired)
    }
    if (!newRule.content || newRule.content.length < 10) {
      throw new Error(messages.contentRequired)
    }
    if (!newRule.importance || !['must', 'should', 'may'].includes(newRule.importance)) {
      throw new Error(messages.invalidImportance)
    }
    if (newRule.source && !newRule.source.match(/^https?:\/\/.+/)) {
      throw new Error(messages.ruleSourceOptional)
    }

    // 检查标题是否重复（排除当前规则）
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.includes('> @rule') && line.includes(newRule.title) && !line.includes(oldRule.title)) {
        throw new Error(`${messages.titleRequired}: ${newRule.title}`)
      }
    }

    // 更新规则内容
    const updatedContent = content.split('\n').map((line) => {
      if (line.includes(`> @rule`) && line.includes(oldRule.title)) {
        const blockComment = generateBlockComment(newRule)
        return blockComment
      }
      if (line === oldRule.content) {
        return newRule.content
      }
      return line
    }).join('\n')

    await vscode.workspace.fs.writeFile(filePath, Buffer.from(updatedContent))

    // 刷新树视图
    rulesProvider.refresh()
  }
  catch (error) {
    console.error('Error updating rule:', error)
    throw error
  }
}

async function insertRuleBlock(rule: RuleBlock) {
  const messages = getLocaleMessages()
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    vscode.window.showErrorMessage(messages.noWorkspaceFolder)
    return
  }

  const filePath = vscode.Uri.joinPath(
    workspaceFolders[0].uri,
    Configs.cursorRules ? CURSOR_PATH : COPILOT_PATH,
  )

  // Ensure file contains meta rule
  await ensureMetaRule(filePath.fsPath)

  // Generate rule block content
  const blockComment = generateBlockComment(rule)
  const content = `${blockComment}${rule.content}`

  try {
    // Read existing content
    let existingContent = ''
    try {
      const fileContent = await vscode.workspace.fs.readFile(filePath)
      existingContent = fileContent.toString()
    }
    catch {
      existingContent = `# ${Configs.cursorRules ? 'Cursor Rules' : 'Copilot Instructions'}`
    }

    // Check if rule already exists
    if (existingContent.includes(content)) {
      vscode.window.showInformationMessage(messages.customRuleAdded)
      return
    }

    // Append new content
    const newContent = `${existingContent}\n\n${content}`
    await vscode.workspace.fs.writeFile(filePath, Buffer.from(newContent))
    vscode.window.showInformationMessage(messages.ruleAddedSuccess(rule.title))
  }
  catch {
    vscode.window.showErrorMessage(messages.operationFailed)
  }
}

async function createRule() {
  const messages = getLocaleMessages()

  // 获取规则标题
  const title = await vscode.window.showInputBox({
    prompt: messages.enterRuleTitle,
    placeHolder: messages.ruleTitlePlaceholder,
    validateInput: (value) => {
      if (!value)
        return messages.titleRequired
      if (value.length < 3)
        return messages.titleRequired
      if (value.length > 100)
        return messages.titleRequired
      return null
    },
  })
  if (!title)
    return

  // 获取规则内容
  const content = await vscode.window.showInputBox({
    prompt: messages.enterRuleContent,
    placeHolder: messages.ruleContentPlaceholder,
    validateInput: (value) => {
      if (!value)
        return messages.contentRequired
      if (value.length < 10)
        return messages.contentRequired
      return null
    },
  })
  if (!content)
    return

  // 获取规则标签
  const tagsInput = await vscode.window.showInputBox({
    prompt: messages.enterRuleTags,
    placeHolder: messages.ruleTagsPlaceholder,
  })
  if (!tagsInput)
    return
  const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)

  // 获取规则重要性
  const importance = await vscode.window.showQuickPick(
    [
      { label: messages.importanceMust, value: 'must' },
      { label: messages.importanceShould, value: 'should' },
      { label: messages.importanceMay, value: 'may' },
    ],
    {
      placeHolder: messages.selectImportance,
    },
  )
  if (!importance)
    return

  // 获取规则来源（可选）
  const source = await vscode.window.showInputBox({
    prompt: messages.enterRuleSource,
    placeHolder: 'https://',
  })

  // 创建新规则
  const rule: RuleBlock = {
    title,
    content,
    tags,
    importance: importance.value as 'must' | 'should' | 'may',
    ...(source ? { source } : {}),
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    author: {
      name: 'Custom Rule',
      url: '',
      avatar: '',
    },
  }

  // 保存规则
  try {
    await saveCustomRule(rulesProvider.context, rule)
    await insertRuleBlock(rule)
    rulesProvider.refresh()
    vscode.window.showInformationMessage(messages.ruleAddedSuccess(title))
  }
  catch (error) {
    console.error('Error creating rule:', error)
    vscode.window.showErrorMessage(messages.operationFailed)
  }
}

export function activate(context: vscode.ExtensionContext) {
  // Create TreeView
  rulesProvider = new RulesProvider(context)
  const treeView = vscode.window.createTreeView('aiRules', {
    treeDataProvider: rulesProvider,
    showCollapseAll: true,
  })

  // Register apply rule command
  const applyRuleCommand = vscode.commands.registerCommand(
    'ai-rules.applyRule',
    async (item: RuleTreeItem) => {
      await insertRuleBlock(item.rule)
    },
  )

  // Register create rule command
  const createRuleCommand = vscode.commands.registerCommand(
    'ai-rules.createRule',
    async () => {
      await createRule()
    },
  )

  // Register edit rule command
  const editRuleCommand = vscode.commands.registerCommand(
    'ai-rules.editRule',
    async (item: RuleTreeItem) => {
      await editRule(item.rule)
    },
  )

  // Register delete rule command
  const deleteRuleCommand = vscode.commands.registerCommand(
    'ai-rules.deleteRule',
    async (item: RuleTreeItem) => {
      const messages = getLocaleMessages()
      const answer = await vscode.window.showWarningMessage(
        messages.confirmDelete(item.rule.title),
        { modal: true },
        messages.yes,
        messages.no,
      )
      if (answer === messages.yes) {
        try {
          await deleteCustomRule(context, item.rule.slug)
          rulesProvider.refresh()
          vscode.window.showInformationMessage(messages.ruleDeleted)
        }
        catch {
          vscode.window.showErrorMessage(messages.deleteRuleFailed)
        }
      }
    },
  )

  // Create status bar button
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  )
  statusBarItem.command = 'workbench.view.extension.aiRules'
  statusBarItem.text = '$(gear) AI Rules'
  statusBarItem.tooltip = 'Manage AI Rules'
  statusBarItem.show()

  // Register Markdown file association
  const markdownAssociation = MarkdownAssociation.register()

  // Add file watcher
  const fileWatcher = vscode.workspace.onDidOpenTextDocument(async (document) => {
    if (document.fileName.endsWith('.cursorrules') || document.fileName.endsWith('copilot-instructions.md'))
      await ensureMetaRule(document.fileName)
  })

  // Register all commands and views
  context.subscriptions.push(
    treeView,
    applyRuleCommand,
    createRuleCommand,
    editRuleCommand,
    deleteRuleCommand,
    statusBarItem,
    markdownAssociation,
    fileWatcher,
  )
}

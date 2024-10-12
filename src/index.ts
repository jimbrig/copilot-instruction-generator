import { Buffer } from 'node:buffer'
import { Effect } from 'effect'
import * as vscode from 'vscode'
import { Configs } from './config'
import { getSections } from './data'

const COPILOT_PATH = '.github/copilot-instructions.md'
const CURSOR_PATH = '.cursorrules'

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('cig.selectAIPrompt', () => {
    const pickInstruction = () => {
      const sections = getSections()
      const sectionNames = sections.map(section => section.tag)
      const pickRule = Effect.promise(() => vscode.window.showQuickPick(sectionNames))
      Effect.runPromise(pickRule).then((selectedSection) => {
        if (selectedSection) {
          const section = sections.find(section => section.tag === selectedSection)
          const ruleNames = section?.rules.map(rule => rule.title) || []
          vscode.window.showQuickPick(ruleNames).then((selectedRule) => {
            if (selectedRule) {
              const rule = section?.rules.find(rule => rule.title === selectedRule)
              insertPromptToFile(rule?.content || '')
            }
          })
        }
      })
    }

    pickInstruction()
  })

  context.subscriptions.push(disposable)
}

function insertPromptToFile(promptText: string) {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (workspaceFolders) {
    const filePath = vscode.Uri.joinPath(workspaceFolders[0].uri, Configs.cursorRules ? CURSOR_PATH : COPILOT_PATH)
    Promise.resolve(vscode.workspace.fs.readFile(filePath)).then((content) => {
      const updatedContent = `${content.toString()}\n\n${promptText}`
      vscode.workspace.fs.writeFile(filePath, Buffer.from(updatedContent, 'utf8'))
    }).catch(() => {
      const initialContent = `# ${Configs.cursorRules ? 'Cursor Rules' : 'Copilot Instructions'}\n\n${promptText}`
      vscode.workspace.fs.writeFile(filePath, Buffer.from(initialContent, 'utf8'))
    })
  }
}

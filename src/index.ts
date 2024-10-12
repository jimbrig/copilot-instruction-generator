import { Buffer } from 'node:buffer'
import { Effect } from 'effect'
import * as vscode from 'vscode'
import { getSections } from './data'

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('cig.selectAIPrompt', () => {
    const pickInstruction = () => {
      const sections = getSections()
      const sectionNames = sections.map(section => section.tag)
      const effect = Effect.promise(() => vscode.window.showQuickPick(sectionNames))
      Effect.runPromise(effect).then((selectedSection) => {
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
    const filePath = vscode.Uri.joinPath(workspaceFolders[0].uri, '.github', 'copilot-instructions.md')
    Promise.resolve(vscode.workspace.fs.readFile(filePath)).then(() => {
      const updatedContent = `# Copilot Instructions\n\n${promptText}`
      vscode.workspace.fs.writeFile(filePath, Buffer.from(updatedContent, 'utf8'))
    }).catch(() => {
      const initialContent = `# Copilot Instructions\n\n${promptText}`
      vscode.workspace.fs.writeFile(filePath, Buffer.from(initialContent, 'utf8'))
    })
  }
}

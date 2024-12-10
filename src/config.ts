import * as vscode from 'vscode'

export interface ConfigurationType {
  cursorRules: boolean
  enableAutoDetect: boolean
}

export const Configs = {
  get cursorRules(): boolean {
    return vscode.workspace.getConfiguration('copilot-instruction-generator').get('cursorRules') ?? false
  },
  get enableAutoDetect(): boolean {
    return vscode.workspace.getConfiguration('copilot-instruction-generator').get('enableAutoDetect') ?? true
  },
}

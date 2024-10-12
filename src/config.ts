import * as vscode from 'vscode'
import * as Meta from './generated/meta'

export const Configs = {
  get cursorRules() {
    return vscode.workspace.getConfiguration(Meta.displayName).get<boolean>('cursorRules', false)
  },
}

import type * as vscode from 'vscode'
import type { Rule } from '.'

const CUSTOM_RULES_KEY = 'cigCustomRules'

export async function getCustomRules(context: vscode.ExtensionContext): Promise<Rule[]> {
  return context.globalState.get<Rule[]>(CUSTOM_RULES_KEY, [])
}

export async function saveCustomRule(context: vscode.ExtensionContext, rule: Rule): Promise<void> {
  const rules = await getCustomRules(context)
  rules.push(rule)
  await context.globalState.update(CUSTOM_RULES_KEY, rules)
}

export async function deleteCustomRule(context: vscode.ExtensionContext, slug: string): Promise<void> {
  const rules = await getCustomRules(context)
  const filteredRules = rules.filter(r => r.slug !== slug)
  await context.globalState.update(CUSTOM_RULES_KEY, filteredRules)
}

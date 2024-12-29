import { cleanCodeRules } from '../rules/clean-code'
import { pythonRules } from '../rules/python'

export * from './meta'
export type { Author, Rule, RuleBlock } from './types'

export const builtinRules = [
  ...cleanCodeRules,
  ...pythonRules,
]

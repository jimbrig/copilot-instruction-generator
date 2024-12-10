import * as vscode from 'vscode'

interface LocalizedMessages {
  searchPlaceholder: string
  noAIConfigFound: string
  searchAndCreate: string
  ignoreProject: string
  cancel: string
  ruleAddedSuccess: (title: string) => string
  clearStateConfirm: string
  clearStateSuccess: string
  yes: string
  no: string
  configEnableAutoDetect: string
}

const zhCN: LocalizedMessages = {
  searchPlaceholder: 'Search rules...',
  noAIConfigFound: 'No AI config file detected. Would you like to create one?',
  searchAndCreate: 'Search and Create',
  ignoreProject: 'Ignore Project',
  cancel: 'Cancel',
  ruleAddedSuccess: (title: string) => `Rule "${title}" added successfully`,
  clearStateConfirm: 'Are you sure you want to clear all saved extension state? This will reset all ignored projects.',
  clearStateSuccess: 'Extension state has been cleared',
  yes: 'Yes',
  no: 'No',
  configEnableAutoDetect: 'Automatically detect and prompt to create AI config files',
}

const enUS: LocalizedMessages = { ...zhCN }

const messages: Record<string, LocalizedMessages> = {
  'zh-cn': zhCN,
  'en': enUS,
}

export function getLocaleMessages(): LocalizedMessages {
  const locale = vscode.env.language.toLowerCase()
  return messages[locale] || messages.en
}

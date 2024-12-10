import * as vscode from 'vscode'

interface LocalizedMessages {
  searchPlaceholder: string
  noAIConfigFound: string
  searchAndCreate: string
  ignoreProject: string
  cancel: string
  ruleAddedSuccess: string
}

const zhCN: LocalizedMessages = {
  searchPlaceholder: '输入关键词搜索规则...',
  noAIConfigFound: '未检测到 AI 配置文件，是否创建？',
  searchAndCreate: '搜索并创建',
  ignoreProject: '忽略此项目',
  cancel: '取消',
  ruleAddedSuccess: (title: string) => `规则 "${title}" 已成功添加`,
}

const enUS: LocalizedMessages = {
  searchPlaceholder: 'Search rules...',
  noAIConfigFound: 'No AI config file detected. Would you like to create one?',
  searchAndCreate: 'Search and Create',
  ignoreProject: 'Ignore Project',
  cancel: 'Cancel',
  ruleAddedSuccess: (title: string) => `Rule "${title}" added successfully`,
}

const messages: Record<string, LocalizedMessages> = {
  'zh-cn': zhCN,
  'en': enUS,
}

export function getLocaleMessages(): LocalizedMessages {
  const locale = vscode.env.language.toLowerCase()
  return messages[locale] || messages.en
}

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
  searchPlaceholder: '输入关键词搜索规则...',
  noAIConfigFound: '未检测到 AI 配置文件，是否创建？',
  searchAndCreate: '搜索并创建',
  ignoreProject: '忽略此项目',
  cancel: '取消',
  ruleAddedSuccess: (title: string) => `规则 "${title}" 已成功添加`,
  clearStateConfirm: '确定要清除所有已保存的插件状态吗？这将重置所有已忽略的项目。',
  clearStateSuccess: '插件状态已清除',
  yes: '是',
  no: '否',
  configEnableAutoDetect: '自动检测并提示创建 AI 配置文件',
}

const enUS: LocalizedMessages = {
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

const messages: Record<string, LocalizedMessages> = {
  'zh-cn': zhCN,
  'en': enUS,
}

export function getLocaleMessages(): LocalizedMessages {
  const locale = vscode.env.language.toLowerCase()
  return messages[locale] || messages.en
}

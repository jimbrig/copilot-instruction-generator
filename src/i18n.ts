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
  confirmOverwrite: string
  overwrite: string
}

const zhCN: LocalizedMessages = {
  searchPlaceholder: '搜索规则...',
  noAIConfigFound: '未检测到 AI 配置文件。是否要创建一个？',
  searchAndCreate: '搜索并创建',
  ignoreProject: '忽略项目',
  cancel: '取消',
  ruleAddedSuccess: (title: string) => `规则 "${title}" 添加成功`,
  clearStateConfirm: '确定要清除所有已保存的扩展状态吗？这将重置所有被忽略的项目。',
  clearStateSuccess: '扩展状态已清除',
  yes: '是',
  no: '否',
  configEnableAutoDetect: '自动检测并提示创建 AI 配置文件',
  confirmOverwrite: '这将覆盖现有的 AI 配置文件。是否继续？',
  overwrite: '覆盖',
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
  confirmOverwrite: 'This will overwrite the existing AI config file. Do you want to continue?',
  overwrite: 'Overwrite',
}

const messages: Record<string, LocalizedMessages> = {
  'zh-cn': zhCN,
  'en': enUS,
}

export function getLocaleMessages(): LocalizedMessages {
  const locale = vscode.env.language.toLowerCase()
  return messages[locale] || messages.en
}

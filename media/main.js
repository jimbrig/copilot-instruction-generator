// @ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  // @ts-check

  const vscode = acquireVsCodeApi()

  document.getElementById('sectionSelect')?.addEventListener('change', (event) => {
    if (event.target instanceof HTMLSelectElement) {
      vscode.postMessage({ command: 'changeSection', section: event.target.value })
    }
  })

  document.getElementById('ruleSelect')?.addEventListener('change', (event) => {
    if (event.target instanceof HTMLSelectElement) {
      vscode.postMessage({ command: 'changeRule', rule: event.target.value })
    }
  })

  // 移除搜索相关的代码
})()

// Remove or comment out this function as it's not needed
// function acquireVsCodeApi() {
//   throw new Error('Function not implemented.')
// }

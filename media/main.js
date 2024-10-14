// @ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  const vscode = acquireVsCodeApi()
  const sectionSelect = document.getElementById('sectionSelect')
  if (sectionSelect) {
    sectionSelect.addEventListener('change', (event) => {
      if (event.target instanceof HTMLSelectElement) {
        vscode.postMessage({ command: 'changeSection', section: event.target.value })
      }
    })
  }

  const ruleSelect = document.getElementById('ruleSelect')
  if (ruleSelect) {
    ruleSelect.addEventListener('change', (event) => {
      if (event.target instanceof HTMLSelectElement) {
        vscode.postMessage({ command: 'changeRule', rule: event.target.value })
      }
    })
  }
})()

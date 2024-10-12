// @ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  // @ts-ignore
  // eslint-disable-next-line no-undef
  const vscode = acquireVsCodeApi()

  document.querySelector('#searchButton')
    ?.addEventListener('click', () => {
      const input = document.querySelector('#searchInput')
      if (input instanceof HTMLInputElement) {
        onSearch(input.value)
      }
    })

  function onSearch(query) {
    vscode.postMessage({ type: 'query', value: query })
  }
}())

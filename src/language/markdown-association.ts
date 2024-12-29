import * as vscode from 'vscode'

// Class for handling file associations
export class MarkdownAssociation {
  private static readonly MARKDOWN_LANGUAGE_ID = 'markdown'
  private static readonly FILE_PATTERNS = [
    '**/.cursorrules',
    '**/.github/copilot-instructions.md',
  ]

  // Ensure files are recognized as Markdown
  public static register(): vscode.Disposable {
    // Register file associations
    const disposable = vscode.workspace.onDidOpenTextDocument((document) => {
      if (this.shouldAssociateWithMarkdown(document)) {
        vscode.languages.setTextDocumentLanguage(document, this.MARKDOWN_LANGUAGE_ID)
      }
    })

    // Handle already opened files
    vscode.workspace.textDocuments.forEach((document) => {
      if (this.shouldAssociateWithMarkdown(document)) {
        vscode.languages.setTextDocumentLanguage(document, this.MARKDOWN_LANGUAGE_ID)
      }
    })

    return disposable
  }

  private static shouldAssociateWithMarkdown(document: vscode.TextDocument): boolean {
    return this.FILE_PATTERNS.some(pattern =>
      vscode.languages.match({ pattern }, document) > 0 && document.languageId !== this.MARKDOWN_LANGUAGE_ID,
    )
  }
}

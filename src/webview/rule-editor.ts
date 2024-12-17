import type * as vscode from 'vscode'
import type { Rule } from '../data'

export function getRuleEditorContent(webview: vscode.Webview, rule?: Rule) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { padding: 15px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input, textarea { width: 100%; padding: 8px; }
        textarea { min-height: 200px; }
        button { 
          padding: 8px 15px;
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          cursor: pointer;
        }
        button:hover {
          background: var(--vscode-button-hoverBackground);
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .feedback {
          margin-top: 10px;
          padding: 8px;
          display: none;
          color: var(--vscode-notificationsSuccessIcon-foreground);
        }
      </style>
    </head>
    <body>
      <div class="form-group">
        <label>Title</label>
        <input type="text" id="title" value="${rule?.title || ''}" />
      </div>
      <div class="form-group">
        <label>Content</label>
        <textarea id="content">${rule?.content || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Tags (comma separated)</label>
        <input type="text" id="tags" value="${rule?.tags.join(', ') || ''}" />
      </div>
      <button onclick="saveRule()" id="saveButton">Save Rule</button>
      <div id="feedback" class="feedback">Rule saved successfully!</div>
      <script>
        const vscode = acquireVsCodeApi();
        
        function saveRule() {
          const title = document.getElementById('title').value;
          const content = document.getElementById('content').value;
          const tags = document.getElementById('tags').value;
          
          if (!title || !content) {
            alert('Title and content are required');
            return;
          }
          
          const saveButton = document.getElementById('saveButton');
          saveButton.disabled = true;
          saveButton.textContent = 'Saving...';
          
          vscode.postMessage({
            command: 'saveRule',
            rule: {
              title,
              content,
              tags: tags.split(',').map(t => t.trim()).filter(Boolean),
              slug: title.toLowerCase().replace(/\\s+/g, '-'),
              author: {
                name: 'Custom',
                url: '',
                avatar: ''
              }
            }
          });
          
          const feedback = document.getElementById('feedback');
          feedback.style.display = 'block';
          
          setTimeout(() => {
            saveButton.disabled = false;
            saveButton.textContent = 'Save Rule';
            feedback.style.display = 'none';
          }, 2000);
        }
      </script>
    </body>
    </html>
  `
}

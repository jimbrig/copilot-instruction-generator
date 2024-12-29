import type { Webview } from 'vscode'
import type { RuleBlock } from '../data/builtin-rules/types'

/**
 * Generate a random nonce for Content Security Policy
 * @returns A 32-character random string
 */
function getNonce(): string {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  return text
}

/**
 * Generate HTML content for the rule editor
 * @param webview The webview to generate content for
 * @param rule The rule to edit
 * @returns The HTML content for the rule editor
 */
export function getRuleEditorContent(webview: Webview, rule: RuleBlock): string {
  const nonce = getNonce()
  const tagsJson = JSON.stringify(rule.tags)

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
    <title>编辑规则</title>
    <style>
        body {
            padding: 20px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
        }
        input, textarea, select {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
        }
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        .error {
            color: var(--vscode-errorForeground);
            font-size: 12px;
            margin-top: 4px;
            display: none;
        }
        input:invalid + .error,
        textarea:invalid + .error {
            display: block;
        }
        button {
            padding: 8px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .tag-container {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
        }
        .tag {
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            display: flex;
            align-items: center;
        }
        .tag-remove {
            margin-left: 4px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <form id="ruleForm">
        <div class="form-group">
            <label for="title">标题:</label>
            <input type="text" id="title" name="title" value="${rule.title}" required
                   minlength="3" maxlength="100" pattern="[A-Za-z0-9\\s\\-_]+"
                   title="标题必须在3到100个字符之间，只能包含字母、数字、空格、连字符和下划线">
            <div class="error">请输入有效的标题</div>
        </div>
        <div class="form-group">
            <label for="content">内容:</label>
            <textarea id="content" name="content" rows="8" required
                      minlength="10" maxlength="1000">${rule.content}</textarea>
            <div class="error">内容必须至少包含10个字符</div>
        </div>
        <div class="form-group">
            <label for="tags">标签:</label>
            <input type="text" id="tags" name="tags" placeholder="输入标签并按回车添加"
                   pattern="[A-Za-z0-9\\s]+" title="标签只能包含字母、数字和空格">
            <div id="tagContainer" class="tag-container"></div>
        </div>
        <div class="form-group">
            <label for="importance">重要性:</label>
            <select id="importance" name="importance" required>
                <option value="must" ${rule.importance === 'must' ? 'selected' : ''}>必须 (Must)</option>
                <option value="should" ${rule.importance === 'should' ? 'selected' : ''}>应该 (Should)</option>
                <option value="may" ${rule.importance === 'may' ? 'selected' : ''}>可以 (May)</option>
            </select>
        </div>
        <div class="form-group">
            <label for="source">来源 URL (可选):</label>
            <input type="url" id="source" name="source" value="${rule.source || ''}"
                   pattern="https?://.*" title="请输入以 http:// 或 https:// 开头的有效URL">
            <div class="error">请输入有效的URL</div>
        </div>
        <button type="submit">保存</button>
    </form>
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        const form = document.getElementById('ruleForm');
        const tagInput = document.getElementById('tags');
        const tagContainer = document.getElementById('tagContainer');
        const tags = new Set(${tagsJson});

        // 初始化标签显示
        function renderTags() {
            tagContainer.innerHTML = Array.from(tags).map(tag =>
                \`<span class="tag">
                    \${tag}
                    <span class="tag-remove" data-tag="\${tag}">×</span>
                </span>\`
            ).join('');
        }
        renderTags();

        // 标签管理
        tagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const tag = tagInput.value.trim();
                if (tag && !tags.has(tag)) {
                    tags.add(tag);
                    renderTags();
                    tagInput.value = '';
                }
            }
        });

        // 删除标签
        tagContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-remove')) {
                const tag = e.target.dataset.tag;
                tags.delete(tag);
                renderTags();
            }
        });

        // 表单验证和提交
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const title = document.getElementById('title').value.trim();
            const content = document.getElementById('content').value.trim();
            const importance = document.getElementById('importance').value;
            const source = document.getElementById('source').value.trim();

            // 验证
            if (!title || title.length < 3 || title.length > 100) {
                vscode.postMessage({
                    command: 'error',
                    message: '标题必须在3到100个字符之间'
                });
                return;
            }

            if (!content || content.length < 10) {
                vscode.postMessage({
                    command: 'error',
                    message: '内容必须至少包含10个字符'
                });
                return;
            }

            if (!importance) {
                vscode.postMessage({
                    command: 'error',
                    message: '请选择规则重要性'
                });
                return;
            }

            if (source && !source.match(/^https?:\\/\\/.+/)) {
                vscode.postMessage({
                    command: 'error',
                    message: '请输入有效的URL'
                });
                return;
            }

            // 发送数据
            vscode.postMessage({
                command: 'saveRule',
                rule: {
                    title,
                    content,
                    tags: Array.from(tags),
                    importance,
                    ...(source ? { source } : {})
                }
            });
        });

        // 实时验证
        document.querySelectorAll('input, textarea').forEach(element => {
            element.addEventListener('input', () => {
                if (element.checkValidity()) {
                    element.classList.remove('invalid');
                } else {
                    element.classList.add('invalid');
                }
            });
        });
    </script>
</body>
</html>`
}

# copilot-instruction-generator

auto generate instruction for cursor / copilot.

## features

- detect current project and generate instruction
- support multiple AI assistants (Copilot, Cursor)
- search by keywords and add predefined instructions

### Todo

- [x] support search and add predefined instructions
- [] auto update rules
- [x] support custom rules

### how to use

1. search rules

## Configurations

<!-- configs -->

| Key                         | Description                                               | Type      | Default |
| --------------------------- | --------------------------------------------------------- | --------- | ------- |
| `ai-rules.cursorRules`      | Generate for Cursor Editor instead of GitHub Copilot      | `boolean` | `false` |
| `ai-rules.enableAutoDetect` | Automatically detect and prompt to create AI config files | `boolean` | `true`  |

<!-- configs -->

## Commands

<!-- commands -->

| Command                      | Title                                 |
| ---------------------------- | ------------------------------------- |
| `ai-rules.selectAIPrompt`    | AI Rules: Browse AI Rules by Category |
| `ai-rules.searchAIPrompt`    | AI Rules: Search AI Rules             |
| `ai-rules.clearGlobalState`  | AI Rules: Clear Extension State       |
| `ai-rules.openRuleFile`      | AI Rules: Open AI Rules File          |
| `ai-rules.manageCustomRules` | AI Rules: Manage Custom Rules         |
| `ai-rules.searchRules`       | AI Rules: Search AI Rules             |
| `ai-rules.createRule`        | AI Rules: Create New Rule             |

<!-- commands -->

## Development

1. clone the repo and run `pnpm install` to install the dependencies.
2. install vscode recommended extensions.
3. run `pnpm dev` to start the extension.

## Sponsors

## License

[MIT](./LICENSE.md) License © 2022 [Bjorn Li](https://github.com/lxxorz)

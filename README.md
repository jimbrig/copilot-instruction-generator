# copilot-instruction-generator

auto generate instruction for cursor / copilot.

## features

- detect current project and generate instruction
- support multiple AI assistants (Copilot, Cursor)
- search by keywords and add predefined instructions

### Todo

- [x] support search and add predefined instructions
- [] auto update rules
- [] support custom rules

![demo](./media/demo.png)

## Configurations

<!-- configs -->

| Key                                              | Description                                               | Type      | Default |
| ------------------------------------------------ | --------------------------------------------------------- | --------- | ------- |
| `copilot-instruction-generator.cursorRules`      | Generate for Cursor Editor instead of GitHub Copilot      | `boolean` | `false` |
| `copilot-instruction-generator.enableAutoDetect` | Automatically detect and prompt to create AI config files | `boolean` | `true`  |

<!-- configs -->

## Commands

<!-- commands -->

| Command                | Title                           |
| ---------------------- | ------------------------------- |
| `cig.selectAIPrompt`   | CIG: Generate Instruction       |
| `cig.searchAIPrompt`   | CIG: Search and Add Instruction |
| `cig.clearGlobalState` | CIG: Clear Extension State      |

<!-- commands -->

## Development

1. clone the repo and run `pnpm install` to install the dependencies.
2. install vscode recommended extensions.
3. run `pnpm dev` to start the extension.

## Sponsors

## License

[MIT](./LICENSE.md) License © 2022 [Bjorn Li](https://github.com/lxxorz)

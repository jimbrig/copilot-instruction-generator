# copilot-instruction-generator

auto generate instruction for cursor / copilot.

check current project and generate instruction.

![demo](./media/demo.png)

## Configurations

<!-- configs -->

| Key                                              | Description                | Type      | Default |
| ------------------------------------------------ | -------------------------- | --------- | ------- |
| `copilot-instruction-generator.cursorRules`      | generate for cursor editor | `boolean` | `false` |
| `copilot-instruction-generator.enableAutoDetect` | 自动检测并提示创建 AI 配置文件          | `boolean` | `true`  |

<!-- configs -->

## Commands

<!-- commands -->

| Command                | Title                           |
| ---------------------- | ------------------------------- |
| `cig.selectAIPrompt`   | Generate Instruction            |
| `cig.searchAIPrompt`   | Search and Add Instruction      |
| `cig.clearGlobalState` | CIG: CIG: Clear Extension State |

<!-- commands -->

## Development

1. clone the repo and run `pnpm install` to install the dependencies.
2. install vscode recommended extensions.
3. run `pnpm dev` to start the extension.

## Sponsors

## License

[MIT](./LICENSE.md) License © 2022 [Bjorn Li](https://github.com/lxxorz)

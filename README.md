# copilot-instruction-generator

auto generate instruction for cursor / copilot.

## Rule Block Definition

```typescript
interface RuleBlock {
  title: string // Rule title
  slug: string // URL-friendly unique identifier
  content: string // Concise rule content, key points separated by commas
  tags: string[] // Tags for categorization and search
  importance: 'must' | 'should' | 'may' // RFC 2119 style importance level
  source?: string // Original source link (optional)
  author: {
    name: string // Author name
    url: string // Author homepage
    avatar: string // Author avatar URL
  }
}
```

Rule block design principles:
1. Concise content: Each rule should express core concepts concisely
2. Traceable source: Link to complete documentation through source field
3. Importance levels: Use RFC 2119 style must/should/may to indicate priority
4. Searchability: Use tags for multi-dimensional categorization

## features

- detect current project and generate instruction
- support multiple AI assistants (Copilot, Cursor)
- search by keywords and add predefined instructions

### Todo

- [x] support search and add predefined instructions
- [ ] auto update rules
- [x] support custom rules
- [x] add fundamental programming principles (e.g., KISS, DRY, SOLID, Zen of Python)

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

| Command                     | Title                           |
| --------------------------- | ------------------------------- |
| `ai-rules.searchRules`      | AI Rules: Search AI Rules       |
| `ai-rules.clearGlobalState` | AI Rules: Clear Extension State |
| `ai-rules.createRule`       | AI Rules: Create New Rule       |
| `ai-rules.editRule`         | AI Rules: Edit Rule             |
| `ai-rules.deleteRule`       | AI Rules: Delete Rule           |
| `ai-rules.applyRule`        | AI Rules: Apply Rule            |

<!-- commands -->

## Development

1. clone the repo and run `pnpm install` to install the dependencies.
2. install vscode recommended extensions.
3. run `pnpm dev` to start the extension.

## Sponsors

## License

[MIT](./LICENSE.md) License © 2022 [Bjorn Li](https://github.com/lxxorz)

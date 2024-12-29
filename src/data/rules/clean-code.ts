import type { RuleBlock } from '../builtin-rules/types'

export const cleanCodeRules: RuleBlock[] = [
  {
    title: 'SOLID Principles',
    slug: 'solid-principles',
    content: 'Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion',
    tags: ['clean-code', 'principles', 'solid'],
    importance: 'must',
    source: 'https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html',
    author: {
      name: 'Robert C. Martin',
      url: 'http://cleancoder.com/products',
      avatar: '',
    },
  },
  {
    title: 'Function Design',
    slug: 'function-design',
    content: 'Functions should be small, do one thing, have no side effects, use descriptive names, stay at one level of abstraction',
    tags: ['clean-code', 'function', 'design'],
    importance: 'must',
    source: 'https://github.com/ryanmcdermott/clean-code-javascript#functions',
    author: {
      name: 'Robert C. Martin',
      url: 'http://cleancoder.com/products',
      avatar: '',
    },
  },
  {
    title: 'Naming Conventions',
    slug: 'naming-conventions',
    content: 'Use meaningful and pronounceable names, avoid prefixes, use nouns for classes and verbs for methods, be consistent',
    tags: ['clean-code', 'naming', 'conventions'],
    importance: 'should',
    source: 'https://github.com/ryanmcdermott/clean-code-javascript#variables',
    author: {
      name: 'Robert C. Martin',
      url: 'http://cleancoder.com/products',
      avatar: '',
    },
  },
]

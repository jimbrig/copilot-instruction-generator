import type { RuleBlock } from '../builtin-rules/types'

export const pythonRules: RuleBlock[] = [
  {
    title: 'Zen of Python',
    slug: 'zen-of-python',
    content: 'Beautiful is better than ugly, Explicit is better than implicit, Simple is better than complex, Flat is better than nested, Readability counts',
    tags: ['python', 'principles', 'zen'],
    importance: 'must',
    source: 'https://peps.python.org/pep-0020/',
    author: {
      name: 'Tim Peters',
      url: 'https://peps.python.org/pep-0020/',
      avatar: '',
    },
  },
  {
    title: 'Python Style Guide',
    slug: 'python-style-guide',
    content: 'Use 4 spaces for indentation, 79 characters line limit, separate functions and classes with blank lines, organize imports properly, follow PEP 8 naming conventions',
    tags: ['python', 'style', 'pep8'],
    importance: 'should',
    source: 'https://peps.python.org/pep-0008/',
    author: {
      name: 'Guido van Rossum',
      url: 'https://peps.python.org/pep-0008/',
      avatar: '',
    },
  },
  {
    title: 'Python Best Practices',
    slug: 'python-best-practices',
    content: 'Use virtual environments, type hints, docstrings, context managers, prefer exceptions over error codes, follow EAFP principle',
    tags: ['python', 'best-practices', 'modern'],
    importance: 'should',
    source: 'https://docs.python-guide.org/',
    author: {
      name: 'Kenneth Reitz',
      url: 'https://docs.python-guide.org/',
      avatar: '',
    },
  },
]

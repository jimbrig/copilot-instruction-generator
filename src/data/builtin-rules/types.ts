export interface Author {
  name: string
  url: string
  avatar: string
}

export interface Rule {
  title: string
  slug: string
  content: string
  tags: string[]
  author: Author
}

export interface RuleBlock extends Rule {
  importance: 'must' | 'should' | 'may'
  source?: string
}

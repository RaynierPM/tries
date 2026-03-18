export class TrieNode {
    children: Record<string, TrieNode> = {}
    isEnd: boolean = false
}

export class Tries {
    root: TrieNode = new TrieNode()

    max_autocomplete_words: number

    constructor(max_autocomplete_words: number = 10) {
        this.max_autocomplete_words = max_autocomplete_words
    }

    search(word: string): boolean {
        let node = this.root
        for (const letter of word) {
            const current = node.children[letter]
            if (!current) {
                return false
            }
            node = current
        }
        return node.isEnd
    }

    private getNode(word: string): TrieNode | null {
        if (!word.length) return null
        let node = this.root
        for (const letter of word) {
            const current = node.children[letter]
            if (current) {
                node = current
            } else return null
        }
        return node
    }

    insert(word: string) {
        let node = this.root
        for (const letter of word) {
            if (!node.children[letter]) {
                node.children[letter] = new TrieNode()
            }
            node = node.children[letter]
        }
        node.isEnd = true
    }

    autocomplete(word: string, words: number = this.max_autocomplete_words): string[] {
        const default_words_max = this.max_autocomplete_words
        const results: string[] = []
        const node = this.getNode(word)
        if (node) {
            this.max_autocomplete_words = words
            this.dfs(node, word, results)
        }
        this.max_autocomplete_words = default_words_max
        return results
    }

    private dfs(current: TrieNode, prefix: string, words: string[]) {
        if (words.length >= this.max_autocomplete_words) return
        
        if (current.isEnd) {
            words.push(prefix)
        }

        for (const [letter, child] of Object.entries(current.children)) {
            this.dfs(child, prefix+letter, words)
        }
    }
}
import { useRef, useState } from 'react'
import './App.css'
import { Tries } from './core'
import { useDebounceCallback } from './hooks/useDebounce'

function App() {
  const trie = useRef<Tries>(new Tries())
  const [value, setValue] = useState<string>("")
  const [graph, setGraph] = useState<string>("")
  const [autocompleted, setAutocompleted] = useState<string[]>([])
  const [alreadyAdded, setAlreadyAdded] = useState<boolean>(false)
  const [loadedWords, setLoadedWords] = useState<number>(0)
  const [showDropdown, setShowDropdown] = useState<boolean>(false)

  function addWord(word: string) {
    trie.current.insert(word.toLowerCase())
    setGraph(JSON.stringify(trie.current.root, null, 2))
  }

  function autocomplete(word: string) {
    const results = trie.current.autocomplete(word, 10)
    setAutocompleted(results)
  }

  function isAdded(word: string) {
    setAlreadyAdded(trie.current.search(word))
  }

  function handleLoadDictionary(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/json") return
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        try {
          const json = JSON.parse(text)
          let addedWords = 0
          if (Array.isArray(json)) {
            for (const word of json) {
              if (typeof word === "string") {
                trie.current.insert(word.toLowerCase())
                addedWords++
              }
            }
          }
          setLoadedWords(addedWords)
          console.log(`Total words added: ${addedWords}`)
        } catch {
          console.log("[Error] Error parsing to json")
        }
      }
      reader.readAsText(file)
    }
  }

  useDebounceCallback(() => {
    isAdded(value)
    autocomplete(value)
  }, 250, value)

  return (
    <div className="trie-app">
      <div className="scanlines" />

      <header className="trie-header">
        <div className="trie-logo">
          <span className="trie-logo-bracket">[</span>
          <span className="trie-logo-text">TRIE</span>
          <span className="trie-logo-bracket">]</span>
        </div>
        <p className="trie-subtitle">// prefix tree explorer</p>
        <div className="trie-header-line" />
      </header>

      <main className="trie-main">
        <div className="trie-input-section">
          <p className="section-label">// search or insert word</p>
          <div className="terminal-prompt">
            <span className="prompt-symbol">❯</span>
            <div className="input-wrapper">
              <input
                className="trie-input"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder="type a word..."
                spellCheck={false}
                autoComplete="off"
              />
              {alreadyAdded && value && (
                <span className="already-added-badge">EXISTS</span>
              )}
            </div>
            <button
              className="trie-insert-btn"
              disabled={alreadyAdded || !value.length}
              onClick={() => {
                addWord(value)
                setValue("")
              }}
            >
              INSERT
            </button>
          </div>

          {showDropdown && autocompleted.length > 0 && (
            <div className="autocomplete-dropdown">
              <div className="dropdown-header">
                <span className="dropdown-label">COMPLETIONS</span>
                <span className="dropdown-count">{autocompleted.length}</span>
              </div>
              {autocompleted.map((word, i) => (
                <div
                  key={word}
                  className="autocomplete-item"
                  style={{ animationDelay: `${i * 25}ms` }}
                  onMouseDown={() => setValue(word)}
                >
                  <span className="item-prefix">{value}</span>
                  <span className="item-suffix">{word.slice(value.length)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="trie-actions">
          <label className="file-upload-label">
            <span className="file-icon">⊕</span>
            LOAD DICTIONARY
            <input
              type="file"
              name="dictionary"
              accept=".json"
              onChange={handleLoadDictionary}
              className="file-input-hidden"
            />
          </label>
          {loadedWords > 0 && (
            <span className="loaded-badge">{loadedWords.toLocaleString()} words loaded</span>
          )}
        </div>

        {graph && (
          <div className="graph-section">
            <div className="graph-header">
              <span className="graph-title">TREE STRUCTURE</span>
              <div className="graph-dots">
                <span /><span /><span />
              </div>
            </div>
            <pre className="graph-output">{graph}</pre>
          </div>
        )}
      </main>
    </div>
  )
}

export default App

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

  function addWord(word: string) {
    trie.current.insert(word)
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
      console.log({file})
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
                trie.current.insert(word);
                addedWords++;
              }
            }
          }
          console.log(`Total words added: ${addedWords}`)
        }catch {
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
    <div
      className='mx-3 py-4 flex-col flex gap-2'
    >
      <div className='flex gap-2'>
        <div
          className='relative'
        >
          <input 
            className='border-2 rounded-md p-2'
            type="text"
            value={value} 
            onChange={(e) => setValue(e.target.value)}
          />
          {autocompleted.length > 0 && <div
            className='absolute top-full left-0 w-full min-h-[200px] bg-slate-200 flex flex-col gap-2'
          >
            {autocompleted.map(word => {
              return (
                <div className='hover:cursor-pointer hover:bg-slate-300 hover:opacity-90' onClick={() => setValue(word)}>{word}</div>
              )
            })}
          </div>}
        </div>
        <button
          className='border-2 rounded-md p-2 disabled:opacity-50 disabled:cursor-not-allowed'
          disabled={alreadyAdded || !value.length}
          onClick={() => {
            addWord(value)
            setValue("")
          }}
        >
          {alreadyAdded ? "Already added" : "Insert"}
        </button>
        <input type="file" name="dictionary" id="dictionary" onChange={handleLoadDictionary} />
      </div>
      <div
        className='mt-5'
      >
        <pre>{graph}</pre>
      </div>
    </div>

  )
}

export default App

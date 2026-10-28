import { createContext, useContext } from 'react'

// `filter` is 'all' or a house key; `showHouse(key)` filters the archive and jumps to the index.
export const ArchiveContext = createContext({ filter: 'all', setFilter: () => {}, showHouse: () => {} })
export const useArchive = () => useContext(ArchiveContext)

import { createContext, useContext } from 'react'

// `open(id, triggerEl)` — launches the Garment Spec Dossier for a capsule item.
export const DossierContext = createContext({ open: () => {} })
export const useDossier = () => useContext(DossierContext)

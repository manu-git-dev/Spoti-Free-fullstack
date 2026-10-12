"use client";

import { createContext,useContext, useState } from "react";

const PanierContext = createContext(null);

export default function PanierProvider ({children}){
    const [panier,setPanier] = useState([]);

   

    return (
        <PanierContext.Provider value={({ panier, setPanier})}>
            {children}
        </PanierContext.Provider>
    )
}

export function usePanier(){
    const contextePanier = useContext(PanierContext);
    
    if (contextePanier === null) {
        throw new Error ("UsePanier doit être utilisé dans PanierProvider.");
    }

    return contextePanier;
}
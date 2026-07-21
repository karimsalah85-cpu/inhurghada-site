"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";


type SearchContextType = {
  search: string;
  setSearch: (value:string)=>void;
};


const SearchContext =
  createContext<SearchContextType | null>(null);



export function SearchProvider({
  children,
}:{
  children:ReactNode;
}) {


  const [search,setSearch] =
    useState("");



  return (

    <SearchContext.Provider
      value={{
        search,
        setSearch,
      }}
    >

      {children}

    </SearchContext.Provider>

  );

}



export function useSearch(){

  const context =
    useContext(SearchContext);


  if(!context){

    throw new Error(
      "useSearch must be inside SearchProvider"
    );

  }


  return context;

}
import ListesCard from "../composants/ListesCard";
import { useState } from "react";

export default function Home({ musiques, onSelectMusique, onClickIndex, user, messageDeconnexion }) {
  return (
    <section className="h-full overflow-hidden">
      {" "}
      {messageDeconnexion ? (
        <div
          role="alert"
          className="alert alert-success"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{messageDeconnexion}</span>
        </div>
      ) : null}
      <div>
        <p className="flex m-4 text-2xl">{user === null ? "Bonjour" : `Bonjour ${user.pseudo}`}</p>
      </div>
      <section className="grid grid-cols-5 gap-4 overflow-y-auto h-[calc(100%-4rem)]">
        <ListesCard musiques={musiques} onSelectMusique={onSelectMusique} />
      </section>
    </section>
  );
}

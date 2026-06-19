export default function Login() {
  return (
    <section className="h-full flex flex-col justify-center items-center">
      <h1 className="text-4xl ml-10 my-4">PAGE CONNEXION</h1>
      <form action="" className="flex flex-col gap-4 ">
        <fieldset className="fieldset w-full">
          <legend className="fieldset-legend text-2xl">Adresse mail</legend>
          <input type="text" className="input w-xl" placeholder="email" />
        </fieldset>
        <fieldset className="fieldset w-full">
          <legend className="fieldset-legend text-2xl">Mot de passe</legend>
          <input
            type="text"
            className="input w-xl"
            placeholder="mot de passe"
          />
        </fieldset>
        <button className="btn btn-primary  h-24">CONNEXION</button>
      </form>
    </section>
  );
}

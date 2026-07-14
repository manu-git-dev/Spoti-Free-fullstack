import { useState } from "react";
import { Send, Loader2, Mail, Code2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch, messageErreur } from "@/lib/api";
import { Input } from "@/components/ui/input";
import EnTetePage from "../composants/EnTetePage";
export default function Contact() {
  const [isSending, setIsSending] = useState(false);
  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    setIsSending(true);

    const contact = {
      nom: formData.get("nom"),
      email: formData.get("email"),
      sujet: formData.get("sujet"),
      message: formData.get("message"),
    };

    try {
      const { reponse, donnees } = await apiFetch("/api/contact/", {
        method: "POST",
        body: contact,
      });
      if (!reponse.ok) {
        const message = messageErreur(reponse, donnees);
        if (message) toast.error(message);
        return;
      }
      toast.success(donnees.message);
      event.target.reset();
    } catch (erreur) {
      toast.error("Impossible de contacter le serveur.");
      console.error(erreur.message);
    } finally {
      setIsSending(false);
    }
  }
  return (
    <section className="flex flex-col lg:grid lg:grid-cols-2 h-full overflow-y-auto p-4 md:p-8">
      <section className="flex flex-col lg:col-start-1 lg:pr-8">
        <EnTetePage icone={Mail} titre="Contact" />
        <h2 className="font-serif text-xl md:text-2xl mb-2">Une question ?</h2>
        <p className="text-muted-foreground md:text-lg mb-6">
          Ecris-moi, je te réponds rapidement. Que ce soit un bug, une idée de
          fonctionnalité ou juste un petit mot, je lis tout.
        </p>

        <div className="flex flex-col gap-2">
          <a
            href="mailto:manuel.mattana.dev@gmail.com"
            className="flex items-center gap-3 rounded-xl border border-border bg-background/50 px-4 py-3 transition-colors hover:border-accent hover:bg-background/80"
          >
            <Mail className="w-5 h-5 text-primary shrink-0" />
            <span className="truncate">manuel.mattana.dev@gmail.com</span>
          </a>
          <a
            href="https://www.github.com/manu-git-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border bg-background/50 px-4 py-3 transition-colors hover:border-accent hover:bg-background/80"
          >
            <Code2 className="w-5 h-5 text-primary shrink-0" />
            <span>Mon Github</span>
          </a>
          <a
            href="https://www.linkedin.com/in/manuel-mattana/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border bg-background/50 px-4 py-3 transition-colors hover:border-accent hover:bg-background/80"
          >
            <Briefcase className="w-5 h-5 text-primary shrink-0" />
            <span>Mon Linkedin</span>
          </a>
        </div>
      </section>
      <section className="mt-6 lg:mt-0 rounded-2xl border border-border bg-background/50 p-6 md:p-8 h-fit w-full lg:self-center">
        <form action="" className="flex flex-col" onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row gap-4 my-4 w-full">
            <fieldset className="flex flex-col gap-1.5 w-full md:w-1/2">
              <legend className="text-xl mb-1">Nom</legend>
              <Input type="text" placeholder="Ton nom" name="nom" required />
            </fieldset>
            <fieldset className="flex flex-col gap-1.5 w-full md:w-1/2">
              <legend className="text-xl mb-1">Mail</legend>
              <Input
                type="email"
                placeholder="ton@email.fr"
                name="email"
                required
              />
            </fieldset>
          </div>
          <fieldset className="flex flex-col gap-1.5 my-4">
            <legend className="text-xl mb-1">Sujet</legend>
            <Input
              type="text"
              placeholder="De quoi veux-tu parler ?"
              name="sujet"
              required
            />
          </fieldset>
          <fieldset className="flex flex-col gap-1.5 my-4">
            <legend className="text-xl mb-1">Message</legend>
            <textarea
              name="message"
              className="w-full h-48 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              placeholder="Ton message..."
              required
            ></textarea>
          </fieldset>
          <Button className="my-4 w-fit" disabled={isSending}>
            Envoyer le message
            {isSending ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </form>
      </section>
    </section>
  );
}

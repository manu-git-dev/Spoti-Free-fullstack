import { Toaster as Sonner } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

// Le projet applique le theme en dur (`<html class="dark">`), pas via next-themes :
// on passe donc `theme="dark"` plutot que de lire un ThemeProvider inexistant.
const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="dark"
      // Placement : au-dessus du MediaPlayer, centre.
      // - en haut a droite, le toast recouvrait les boutons "Connexion"/"Se deconnecter" de la Home ;
      // - en bas sans decalage, il recouvrait le MediaPlayer (desktop) et la BottomNav (mobile).
      // Les offsets le remontent juste au-dessus de ces barres.
      position="bottom-center"
      offset={{ bottom: "104px" }}
      mobileOffset={{ bottom: "150px" }}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius)",
        "--success-bg": "var(--popover)",
        "--success-text": "var(--success)",
        "--success-border": "var(--success)",
        "--error-bg": "var(--popover)",
        "--error-text": "var(--destructive)",
        "--error-border": "var(--destructive)",
      }}
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

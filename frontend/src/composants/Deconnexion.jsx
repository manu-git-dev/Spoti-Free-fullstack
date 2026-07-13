import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function Deconnexion({ setUser, setToken }) {
  const navigate = useNavigate();

  function handleDeconnexion() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    toast.success("Déconnexion réussie");
    navigate("/");
  }

  return (
    <Button
      variant="ghost"
      className="rounded-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      onClick={handleDeconnexion}
    >
      <LogOut className="w-4 h-4" />
      Se déconnecter
    </Button>
  );
}

import { Navigate } from "react-router-dom";

// Garde d'acces unique pour les routes qui exigent une session — et, en option, un role precis.
//
// Deux refus DISTINCTS, deux destinations differentes :
//   - pas connecte        -> /connexion (va t'identifier ; on garde `fromProtected` pour que la
//                            page de connexion sache d'ou vient l'utilisateur).
//   - connecte, mauvais role -> / (tu es identifie, mais cette page n'est pas pour toi ; l'envoyer
//                            vers /connexion n'aurait aucun sens, il est deja connecte).
//
// Le controle de role vivait AVANT, recopie a l'identique dans chacune des 4 pages admin. Une
// regle d'autorisation dupliquee finit toujours par diverger : elle est desormais ICI, en un seul
// endroit. (La protection qui compte reste `adminMiddleware` cote serveur — ceci n'est que le
// confort d'affichage, mais du confort qui ne se contredit plus d'une page a l'autre.)
export default function ProtectedRoute({ user, role, children }) {
  if (!user) {
    return <Navigate to="/connexion" state={{ fromProtected: true }} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

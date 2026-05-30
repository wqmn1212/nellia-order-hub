import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { canAccess } from "@/lib/roleConfig";
import { toast } from "sonner";

export default function RoleGuard({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const hasAccess = user ? canAccess(user.role, location.pathname) : false;

  useEffect(() => {
    if (user && !hasAccess) {
      toast.error("접근 권한이 없습니다");
      navigate("/", { replace: true });
    }
  }, [user, hasAccess, navigate, location.pathname]);

  if (!user || !hasAccess) return null;
  return children;
}
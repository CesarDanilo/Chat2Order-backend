// API pública do módulo de autenticação. Outros módulos importam só daqui.
export { default as authRoutes } from "./presentation/auth.routes";
export {
  authMiddleware,
  guardRoleChange,
  requireAdmin,
  requireSelfOrAdmin,
} from "./presentation/authMiddleware";

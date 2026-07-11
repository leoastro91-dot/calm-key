import { useQuery } from "@tanstack/react-query";
import { workspaceRepository } from "../services/workspaceRepository";
import { profileRepository } from "../services/profileRepository";
import { useAuth } from "./useAuth";

/**
 * Resuelve perfil + workspace del usuario autenticado con reintentos cortos:
 * cubre el caso borde en que el trigger on_profile_created aún no terminó
 * (Sección 17 — "Estamos configurando tu cuenta…").
 */
export function useWorkspace() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["identity", "welcome", user?.id],
    enabled: Boolean(user),
    retry: 4,
    retryDelay: (attempt) => Math.min(500 * (attempt + 1), 2000),
    queryFn: async () => {
      const userId = user!.id;
      let profile = await profileRepository.getById(userId);
      if (!profile) {
        // Reintento del INSERT (caso borde: falló tras signUp).
        await profileRepository.create({ id: userId });
        profile = await profileRepository.getById(userId);
      }
      if (!profile) throw new Error("PROFILE_NOT_READY");
      const workspace = await workspaceRepository.getByOwnerId(userId);
      if (!workspace) throw new Error("WORKSPACE_NOT_READY");
      return { profile, workspace };
    },
  });

  return {
    profile: query.data?.profile ?? null,
    workspace: query.data?.workspace ?? null,
    isLoading: query.isPending,
    isError: query.isError,
    retry: () => query.refetch(),
  };
}

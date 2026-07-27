import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllEntities } from "../repository/entity.repository";
import { Dashboard } from "../../domain/types/Dashboard";

const DASHBOARD_QUERY_KEY = ["dashboard"] as const;

export const useDashboard = () => {
  const queryClient = useQueryClient();

  const {
    data: dashboard = null,
    isLoading: loading,
    isPending,
  } = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: async () => {
      const response = await getAllEntities({ routeUrl: "/dashboard" });
      return response.data as Dashboard;
    },
    staleTime: 0, // Always fetch fresh dashboard data on mount
    gcTime: 5 * 60 * 1000,
  });

  const fetchDashboard = async () => {
    await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
  };

  return { dashboard, loading, isPending, fetchDashboard };
};

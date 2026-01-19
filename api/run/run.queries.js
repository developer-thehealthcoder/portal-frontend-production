import { getRunDetail } from "./run.api";
import { useQuery } from "@tanstack/react-query";

export const useGetRunDetail = (project_id) => {
  return useQuery({
    queryKey: ["run", project_id],
    queryFn: () => getRunDetail(project_id).then((res) => res.data),
    enabled: !!project_id,
    retry: 2, // Retry twice on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
};

import axiosInstance from "@/lib/foundation-kit/axiosInstance";

export const getRunDetail = (project_id) =>
  axiosInstance.post(
    `/rules/project-results?project_id=${project_id}`,
    {
      project_id,
    },
    {
      timeout: 180000, // 3 minutes timeout for large result sets
    }
  );

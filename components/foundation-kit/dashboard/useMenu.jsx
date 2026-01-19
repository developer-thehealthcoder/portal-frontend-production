import axiosInstance from "@/lib/foundation-kit/axiosInstance";
import { useQuery } from "@tanstack/react-query";

function useMenu() {
  return useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/dashboard/menu/");
      return data.menus;
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    cacheTime: 30 * 60 * 1000, // keep in memory 30 minutes
  });
}
export default useMenu;

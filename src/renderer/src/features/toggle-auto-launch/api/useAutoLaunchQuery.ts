import { useQuery } from "@tanstack/react-query";
import { autoLaunchQueryKey } from "../model/autoLaunchQueryKey";
import { getAutoLaunchStatus } from "./getAutoLaunchStatus";

export const useAutoLaunchQuery = () =>
  useQuery({
    queryKey: autoLaunchQueryKey,
    queryFn: getAutoLaunchStatus,
  });

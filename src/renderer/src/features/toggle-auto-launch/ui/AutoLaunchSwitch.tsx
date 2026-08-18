import { Switch } from "@mantine/core";
import type { FC } from "react";
import { useAutoLaunchQuery } from "../api/useAutoLaunchQuery";
import { useSetAutoLaunchMutation } from "../api/useSetAutoLaunchMutation";

export const AutoLaunchSwitch: FC = () => {
  const { data, isPending } = useAutoLaunchQuery();
  const { mutate, isPending: isSaving } = useSetAutoLaunchMutation();

  const enabled = data?.ok === true && data.enabled;

  return (
    <Switch
      label="Launch at system startup"
      aria-label="Launch at system startup"
      description="Opens minimized to the tray"
      checked={enabled}
      disabled={isPending || isSaving}
      onChange={(event) => mutate(event.currentTarget.checked)}
    />
  );
};

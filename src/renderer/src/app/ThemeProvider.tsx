import {
  createTheme,
  type MantineColorsTuple,
  MantineProvider,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { ScheduleEvent } from "@mantine/schedule";
import type { FC, PropsWithChildren } from "react";
import "./globalStyles.css";

const myColor: MantineColorsTuple = [
  "#ecf4ff",
  "#dce4f5",
  "#b9c7e2",
  "#94a8d0",
  "#748dc0",
  "#5f7cb7",
  "#5474b4",
  "#44639f",
  "#3a5890",
  "#2c4b80",
];

// Layout-level design tokens only — colors that carry domain meaning (due
// date, priority, kanban status) live as plain constants next to the logic
// that computes them (entities/task/lib/*), not here, so entity components
// stay renderable in tests that use a bare `<MantineProvider>` without this
// theme wired in.
declare module "@mantine/core" {
  interface MantineThemeOther {
    surface: string;
    appBg: string;
    sidebarBg: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    radius: {
      card: number;
      control: number;
      pill: number;
      kanbanColumn: number;
    };
  }
}

const theme = createTheme({
  colors: {
    myColor,
  },
  primaryColor: "myColor",
  scale: 1,
  defaultRadius: "md",
  other: {
    surface: "#ffffff",
    appBg: "#f7f8fa",
    sidebarBg: "#fbfbfd",
    border: "#ecedf2",
    textPrimary: "#1a1d23",
    textSecondary: "#5b6472",
    textTertiary: "#98a0ac",
    radius: { card: 11, control: 9, pill: 7, kanbanColumn: 14 },
  },
  components: {
    DatePickerInput: DatePickerInput.extend({
      defaultProps: { highlightToday: true },
    }),
    ScheduleEvent: ScheduleEvent.extend({ defaultProps: { radius: 7 } }),
  },
});

export const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  return <MantineProvider theme={theme}>{children}</MantineProvider>;
};

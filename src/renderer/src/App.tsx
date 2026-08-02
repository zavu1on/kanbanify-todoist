import "@mantine/core/styles.css";

import {
  Button,
  createTheme,
  type MantineColorsTuple,
  MantineProvider,
} from "@mantine/core";

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

const theme = createTheme({
  colors: {
    myColor,
  },
  primaryColor: "myColor",
});

export function App() {
  return (
    <MantineProvider theme={theme}>
      <Button>Hello World</Button>
    </MantineProvider>
  );
}

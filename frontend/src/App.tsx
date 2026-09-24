import { AppRouter } from "./app/router/AppRouter";
import { GlobalThemeToggle } from "./components/theme/GlobalThemeToggle";
import { ThemeProvider } from "./theme/ThemeContext";

import "./styles/theme.css";

function App() {
  return (
    <ThemeProvider>
      <AppRouter />
      <GlobalThemeToggle />
    </ThemeProvider>
  );
}

export default App;

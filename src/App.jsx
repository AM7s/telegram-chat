import { useState } from "react";
import { LoginForm } from "./components/LoginForm";
import { ChatWindow } from "./components/chatWindow";

export default function App() {
  const [credentials, setCredentials] = useState(null);

  return (
    <div className="app">
      {!credentials ? (
        <LoginForm onLogin={setCredentials} />
      ): (
        <ChatWindow credentials={credentials} onLogout={() => setCredentials(null)} />
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Auth } from "@supabase/auth-ui-react";
import Home from "./components/Home";
import {
  // Import predefined theme
  ThemeSupa,
} from "@supabase/auth-ui-shared";

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />;
  } else {
    // TODO add List here
    return <Home user={session.user} />;
  }
}

export default App;

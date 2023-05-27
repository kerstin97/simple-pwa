import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Auth } from "@supabase/auth-ui-react";
import Home from "./components/Home";
import { ThemeSupa } from "@supabase/auth-ui-shared";

function App() {
  const [session, setSession] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [serviceWorker, setServiceworker] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notificationButtonText, setNotificationButtonText] =
    useState("Subscribe");
  const [subsribtionText, setSubscribtionText] = useState(null);
  const [applicationServerPublicKey, setApplicationServerPublicKey] =
    useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    if ("serviceWorker" in navigator) {
      try {
        navigator.serviceWorker.register("/sw.js").then((registration) => {
          console.log(
            "ServiceWorker registration was successful: ",

            registration
          );
          setServiceworker(registration);
          initializeUI(registration);
        });
      } catch (e) {
        console.log("ServiceWorker registration failed: ", e.message);
      }
    }

    window.addEventListener("beforeinstallprompt", function (e) {
      console.log("beforeinstallprompt Event fired");
      e.preventDefault();

      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);

      return false;
    });

    return () => subscription.unsubscribe();
  }, []);

  const installPrompt = () => {
    console.log("defer fuction", deferredPrompt);
    if (deferredPrompt !== undefined) {
      // The user has had a positive interaction with our app and Chrome
      // has tried to prompt previously, so let's show the prompt.
      deferredPrompt.prompt();

      // Follow what the user has done with the prompt.
      deferredPrompt.userChoice.then(function (choiceResult) {
        console.log(choiceResult.outcome);

        if (choiceResult.outcome === "dismissed") {
          console.log("User cancelled home screen install");
        } else {
          console.log("User added to home screen");
        }

        // We no longer need the prompt.  Clear it up.
        setDeferredPrompt(null);
      });
    }
  };

  function initializeUI(serviceWorkerObject) {
    serviceWorkerObject.pushManager
      .getSubscription()
      .then(function (subscription) {
        setIsSubscribed(!(subscription === null));

        updateSubscriptionOnServer(subscription);

        if (isSubscribed) {
          console.log("User IS subscribed.");
          updateBtn(true);
        } else {
          console.log("User is NOT subscribed.");
          subscribeUser(serviceWorkerObject);
          updateBtn(false);
        }
      });
  }

  function updateBtn(subscribed) {
    if (Notification.permission === "denied") {
      setNotificationButtonText("Push Blocked");
      updateSubscriptionOnServer(null);
      return;
    }

    if (subscribed) {
      setNotificationButtonText("Unsubscribe");
    } else {
      setNotificationButtonText("Subscribe");
    }
  }

  const activatePush = () => {
    console.log(isSubscribed, "issubscribed");
    if (isSubscribed) {
      unsubscribeUser(serviceWorker);
    } else {
      subscribeUser(serviceWorker);
    }
  };

  function urlB64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  function updateSubscriptionOnServer(subscription) {
    if (subscription) {
      setSubscribtionText(JSON.stringify(subscription));
      console.log("visible push");
    } else {
      setSubscribtionText(null);
      console.log("invisible push");
    }
  }

  function subscribeUser(serviceWorkerObject) {
    const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
    serviceWorkerObject.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      })
      .then(function (subscription) {
        console.log("User is subscribed.", serviceWorker);

        updateSubscriptionOnServer(subscription);

        setIsSubscribed(true);

        updateBtn(true);
      })
      .catch(function (error) {
        console.error("Failed to subscribe the user: ", error);
        if (applicationServerPublicKey?.length > 0) {
          alert("Subscribtion failed, maybe wrong public key?");
        }
        updateBtn(false);
      });
  }

  function unsubscribeUser(serviceWorkerObject) {
    serviceWorkerObject.pushManager
      .getSubscription()
      .then(function (subscription) {
        if (subscription) {
          return subscription.unsubscribe();
        }
      })
      .catch(function (error) {
        console.log("Error unsubscribing", error);
      })
      .then(function (subscription) {
        updateSubscriptionOnServer(null);

        console.log("User is unsubscribed.", subscription);

        setIsSubscribed(false);

        updateBtn(false);
      });
  }

  if (!session) {
    return (
      <div className={"m-auto max-w-sm p-2 mt-5"}>
        <h1 className="text-2xl sm:text-4xl font-bold text-center font-sans">
          Login or Sign Up
        </h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
        />
      </div>
    );
  } else {
    return (
      <Home
        user={session.user}
        installPrompt={installPrompt}
        notificactionButtonText={notificationButtonText}
        subsribtionText={subsribtionText}
        onActivatePush={activatePush}
        setApplicationServerPublicKey={setApplicationServerPublicKey}
        applicationServerPublicKey={applicationServerPublicKey}
      />
    );
  }
}

export default App;

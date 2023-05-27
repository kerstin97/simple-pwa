import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import TodoItem from "./TodoItem";
import { FaShareAlt } from "react-icons/fa";

const Home = ({
  user,
  installPrompt,
  notificactionButtonText,
  subsribtionText,
  onActivatePush,
  setApplicationServerPublicKey,
  applicationServerPublicKey,
}) => {
  const [todos, setTodos] = useState([]);
  const newTaskTextRef = useRef();
  const [errorText, setError] = useState("");

  useEffect(() => {
    fetchTodos().catch(console.error);
  }, []);

  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  const fetchTodos = async () => {
    let { data: todos, error } = await supabase
      .from("todos")
      .select("*")
      .order("id", { ascending: false });
    if (error) console.log("error", error);
    else setTodos(todos);
  };

  const deleteTodo = async (id) => {
    try {
      await supabase.from("todos").delete().eq("id", id);
      const todo = todos.find((todo) => todo.id === id)?.task;
      setTodos(todos.filter((x) => x.id !== id));

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.controller.postMessage({
          todo: todo,
          status: "deleted",
        });
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  const addTodo = async () => {
    let taskText = newTaskTextRef.current.value;
    let task = taskText.trim();
    if (task.length <= 3) {
      setError("Task length should be more than 3!");
    } else {
      let { data: todo, error } = await supabase
        .from("todos")
        .insert({ task: task, user_id: user.id })
        .select();
      if (error) setError(error.message);
      else {
        setTodos([todo[0], ...todos]);
        setError(null);
        newTaskTextRef.current.value = "";
      }
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.controller.postMessage({
        todo: task,
        status: "new",
      });
    }
  };

  const handleLogout = async () => {
    supabase.auth.signOut().catch(console.error);
  };

  const handleShare = async () => {
    const shareData = {
      title: "TodoList PWA",
      text: "Add Todos on your own!",
      url: "https://simple-pwa-ochre.vercel.app/ ",
    };

    try {
      await navigator.share(shareData);
    } catch (err) {
      console.log(`Error: ${err}`);
    }
  };

  return (
    <div className={"w-screen fixed flex flex-col min-h-screen bg-gray-50"}>
      <header
        className={"flex justify-between items-center px-4 h-16 bg-gray-900"}
      >
        <span className={"text-2xl sm:text-4xl text-white border-b font-sans"}>
          Todo List.
        </span>
        <button
          onClick={handleLogout}
          className={
            "flex  justify-center ml-auto	  py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out"
          }
        >
          Logout
        </button>
        <button
          onClick={installPrompt}
          className={
            "flex justify-center ml-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out"
          }
        >
          Install
        </button>
        <button
          onClick={toggleFullScreen}
          className={
            "flex justify-center ml-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out"
          }
        >
          Toggle Fullscreen
        </button>

        <FaShareAlt
          className="ml-2 cursor-pointer"
          color={"#2563eb"}
          size={"20"}
          onClick={() => handleShare()}
        />
      </header>
      <div
        className={"flex flex-col flex-grow p-4"}
        style={{ height: "calc(100vh - 11.5rem)" }}
      >
        <div className={"flex mb-4 mt-0 h-10"}>
          <input
            onChange={(e) => setApplicationServerPublicKey(e.target.value)}
            type="text"
            onKeyUp={(e) =>
              e.key === "Enter" && setApplicationServerPublicKey(e.target.value)
            }
            className={"bg-gray-200 border px-2 border-gray-300 w-full mr-4"}
            placeholder="Enter public key from https://web-push-codelab.glitch.me/ here to test push"
          />
          <button
            onClick={() => onActivatePush()}
            disabled={
              notificactionButtonText === "Push Blocked" ||
              applicationServerPublicKey === "" ||
              !applicationServerPublicKey
            }
            className={
              "disabled:opacity-50 flex justify-center  py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out"
            }
          >
            {notificactionButtonText}
          </button>
        </div>
        {subsribtionText && (
          <div className={"bg-orange-200 p-4 mb-4 break-words"}>
            <b>Copy this to https://web-push-codelab.glitch.me/ for testing:</b>
            {subsribtionText}
          </div>
        )}
        <div
          className={`p-2 border flex-grow grid gap-2 ${
            todos.length ? "auto-rows-min" : ""
          } grid-cols-1 h-2/3 overflow-y-scroll first:mt-8`}
        >
          {todos.length ? (
            todos.map((todo) => (
              <TodoItem
                key={todo?.id}
                todo={todo}
                onDelete={() => deleteTodo(todo?.id)}
              />
            ))
          ) : (
            <span className={"h-full flex justify-center items-center"}>
              You do have any tasks yet!
            </span>
          )}
        </div>
        {!!errorText && (
          <div
            className={
              "border max-w-sm self-center px-4 py-2 mt-4 text-center text-sm bg-red-100 border-red-300 text-red-400"
            }
          >
            {errorText}
          </div>
        )}
      </div>
      <div className={"flex m-4 mt-0 h-10"}>
        <input
          ref={newTaskTextRef}
          type="text"
          onKeyUp={(e) => e.key === "Enter" && addTodo()}
          className={"bg-gray-200 border px-2 border-gray-300 w-full mr-4"}
        />
        <button
          onClick={addTodo}
          className={
            "flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out"
          }
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default Home;

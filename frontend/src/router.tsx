// src/router.tsx
import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import TodoPage from "./modules/todo/TodoPage";
import VotePage from "./modules/vote/VotePage";
import HomePage from "./modules/home/HomePage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { 
        index: true, 
        element: <HomePage />
      },
      { 
        path: "todo", 
        element: <TodoPage /> 
      },
      { 
        path: "vote", 
        element: <VotePage /> 
      },
    ],
  },
]);

export default router;
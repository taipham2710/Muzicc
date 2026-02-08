import { createBrowserRouter } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import AuthLayout from "../layouts/AuthLayout";
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Home from "../pages/Home";
import MyMusic from "../pages/MyMusic";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "/home", element: <Home /> },
      { path: "/my-music", element: <MyMusic /> },
    ],
  },
]);

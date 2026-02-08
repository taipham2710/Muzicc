import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div>
      <header>
        <h1>Muzicc</h1>
        <div>User</div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

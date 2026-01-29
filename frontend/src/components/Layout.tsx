// src/components/Layout.tsx
import { Outlet, Link } from "react-router-dom";

const Layout = () => {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
        </ul>
      </nav>
      <hr />
      {/* An <Outlet> renders the child route's element */}
      <Outlet /> 
    </div>
  );
};

export default Layout;

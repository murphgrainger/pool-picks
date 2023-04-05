import React from "react";
import Header from "./Header";

interface Props {
  children: React.ReactNode
}
const Layout: React.FC<Props> = ({ children }) => {
  return (
<div className="bg-black flex flex-col">
  <Header />
  <div className="component-root">{children}</div>
  <footer className="p-10 bg-green-500 mt-10">
  </footer>
</div>

  );
};

export default Layout;

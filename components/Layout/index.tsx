import React from "react";
import Header from "./Header";

interface Props {
  children: React.ReactNode
}
const Layout: React.FC<Props> = ({ children }) => {
  return (
    <div className="bg-black min-h-screen">
      <Header />
      {children}
    </div>
  );
};

export default Layout;

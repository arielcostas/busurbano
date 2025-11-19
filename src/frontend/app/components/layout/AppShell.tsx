import React, { useState } from "react";
import { Outlet } from "react-router";
import { PageTitleProvider, usePageTitleContext } from "~/contexts/PageTitleContext";
import NavBar from "../NavBar";
import { ThemeColorManager } from "../ThemeColorManager";
import "./AppShell.css";
import { Drawer } from "./Drawer";
import { Header } from "./Header";

const AppShellContent: React.FC = () => {
  const { title } = usePageTitleContext();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="app-shell">
      <ThemeColorManager />
      <Header
        className="app-shell__header"
        title={title}
        onMenuClick={() => setIsDrawerOpen(true)}
      />
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <div className="app-shell__body">
        <aside className="app-shell__sidebar">
          <NavBar />
        </aside>
        <main className="app-shell__main">
          <Outlet />
        </main>
      </div>
      <footer className="app-shell__bottom-nav">
        <NavBar />
      </footer>
    </div>
  );
};

export const AppShell: React.FC = () => {
  return (
    <PageTitleProvider>
      <AppShellContent />
    </PageTitleProvider>
  );
};

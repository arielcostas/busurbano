import React, { createContext, useContext, useEffect, useState } from "react";

interface PageTitleContextProps {
  title: string;
  setTitle: (title: string) => void;
}

const PageTitleContext = createContext<PageTitleContextProps | undefined>(
  undefined
);

export const PageTitleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [title, setTitle] = useState("Busurbano");

  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
};

export const usePageTitleContext = () => {
  const context = useContext(PageTitleContext);
  if (!context) {
    throw new Error("usePageTitleContext must be used within a PageTitleProvider");
  }
  return context;
};

export const usePageTitle = (title: string) => {
  const { setTitle } = usePageTitleContext();

  useEffect(() => {
    setTitle(title);
    document.title = `${title} - Busurbano`;

    return () => {
      // Optional: Reset title on unmount?
      // Usually not needed as the next page will set its own title.
      // But if we navigate to a page without usePageTitle, it might be stale.
      // Let's leave it for now.
    };
  }, [title, setTitle]);
};

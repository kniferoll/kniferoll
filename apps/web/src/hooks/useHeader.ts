import { useContext, useEffect } from "react";
import { HeaderContext, type HeaderConfig } from "../context/HeaderContext";

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error("useHeader must be used within a HeaderProvider");
  }
  return context;
}

export function useHeaderConfig(
  config: HeaderConfig,
  deps: React.DependencyList = []
) {
  const { setHeader } = useHeader();

  useEffect(() => {
    setHeader(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setHeader, ...deps]);
}

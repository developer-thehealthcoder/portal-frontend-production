"use client";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useState } from "react";

const KebabMenu = dynamic(() => import("@/components/common/table/KebabMenu"), {
  ssr: false,
});

ModuleRegistry.registerModules([AllCommunityModule]);

// Create new GridExample component
export default function UsersPage() {
  const { theme, resolvedTheme } = useTheme();

  // next-themes uses `theme` (user selection) and `resolvedTheme` (fallback)
  const current = theme === "system" ? resolvedTheme : theme;

  // map your theme names to the AG Grid CSS classes:
  const themeClass =
    current === "dark" ? "ag-theme-alpine-dark" : "ag-theme-alpine";

  // Row Data: The data to be displayed.
  const [rowData, setRowData] = useState([
    { make: "Tesla", model: "Model Y", price: 64950, electric: true },
    { make: "Ford", model: "F-Series", price: 33850, electric: false },
    { make: "Toyota", model: "Corolla", price: 29600, electric: false },
    { make: "Mercedes", model: "EQA", price: 48890, electric: true },
    { make: "Fiat", model: "500", price: 15774, electric: false },
    { make: "Nissan", model: "Juke", price: 20675, electric: false },
  ]);

  // Column Definitions: Defines & controls grid columns.
  const [colDefs, setColDefs] = useState([
    { field: "make" },
    { field: "model" },
    { field: "price" },
    { field: "electric" },
    {
      headerName: "",
      field: "actions",
      cellRenderer: KebabMenu,
      width: 60,
      suppressMenu: true,
      suppressSorting: true,
    },
  ]);

  const defaultColDef = {
    flex: 1,
  };

  // Container: Defines the grid's theme & dimensions.
  return (
    <div className={`w-full h-full p-4 ${themeClass}`}>
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
      />
    </div>
  );
}

// Render GridExample
// const root = createRoot(document.getElementById("root"));
// root.render(
//   <StrictMode>
//     <GridExample />
//   </StrictMode>
// );

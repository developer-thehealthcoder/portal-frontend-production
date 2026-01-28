"use client";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/dateTimeFormat";
import {
  AllCommunityModule,
  ModuleRegistry,
  colorSchemeDarkBlue,
  themeBalham,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { ArchiveIcon, EyeIcon, PlusIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

ModuleRegistry.registerModules([AllCommunityModule]);

// Create theme objects using the new v33 Theming API
const themeLight = themeBalham;
const themeDarkBlue = themeBalham.withPart(colorSchemeDarkBlue);

// Create new GridExample component
export default function VerificationAndAuthorization() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Wait for component to mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get the current theme, handling system preference
  const currentTheme = mounted
    ? theme === "system"
      ? resolvedTheme
      : theme
    : "light";

  // Row Data: The data to be displayed.
  const [rowData, setRowData] = useState([]);

  // Column Definitions: Defines & controls grid columns.
  const [colDefs, setColDefs] = useState([
    {
      field: "archive",
      headerName: "Archive",
      maxWidth: 100,
      filter: false,
      cellRenderer: (params) => {
        return (
          <div className="flex justify-start items-center w-full h-full cursor-pointer">
            <ArchiveIcon className="w-5 h-5" fill="#a4a4a4" stroke="white" />
          </div>
        );
      },
    },
    {
      field: "view",
      headerName: "View",
      maxWidth: 100,
      filter: false,
      cellRenderer: (params) => {
        return (
          <div className="flex justify-start items-center w-full h-full cursor-pointer">
            <EyeIcon className="w-6 h-6" fill="#2c84d4" stroke="white" />
          </div>
        );
      },
    },
    {
      field: "project_id",
      headerName: "Project ID",
      sortable: true,
      filter: true,
    },
    {
      field: "project_name",
      headerName: "Project Name",
      sortable: true,
      filter: true,
    },
    {
      field: "executed_date",
      headerName: "Executed Date",
      sortable: true,
      filter: true,
      valueFormatter: (params) => {
        return formatDate(params.value);
      },
    },
  ]);

  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true,
  };

  // AG Grid theme configuration using the new v33 Theming API
  const gridOptions = {
    rowData: rowData,
    columnDefs: colDefs,
    defaultColDef: defaultColDef,
    pagination: true,
    paginationPageSize: 10,
    paginationPageSizeSelector: [10, 20, 50, 100],
    domLayout: "autoHeight",
    suppressRowHoverHighlight: false,
    rowSelection: "single",
    animateRows: true,
    // Use the proper theme objects
    theme: currentTheme === "dark" ? themeDarkBlue : themeLight,
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="w-full h-full p-4 flex items-center justify-center">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-32 rounded"></div>
      </div>
    );
  }

  // Container: Defines the grid's theme & dimensions.
  return (
    <div className="w-full h-full p-4 space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">
          Verification and Authorization
        </h1>
        <Button
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.push("/new-insurance")}
        >
          <PlusIcon className="w-4 h-4" />
          New Verification and Authorization
        </Button>
      </div>
      <AgGridReact
        {...gridOptions}
        key={currentTheme} // Force re-render when theme changes
      />
    </div>
  );
}

"use client";
import axiosInstance from "@/lib/foundation-kit/axiosInstance";
import {
  AllCommunityModule,
  ModuleRegistry,
  colorSchemeDarkBlue,
  themeBalham,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

ModuleRegistry.registerModules([AllCommunityModule]);

// Create theme objects using the new v33 Theming API
const themeLight = themeBalham;
const themeDarkBlue = themeBalham.withPart(colorSchemeDarkBlue);

// Create new GridExample component
export default function SelectRules({ onSelectionChange, selectedRows }) {
  // Row Data: The data to be displayed.
  const [rowData, setRowData] = useState([]);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const gridApi = useRef(null);

  // Wait for component to mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const { data } = await axiosInstance.get(`/rules/list`, {
          timeout: 60000, // 1 minute timeout
        });
        setRowData(data?.rules || []);
      } catch (error) {
        console.error("Error fetching rules:", error);
        // Error handling is done by axios interceptor
      }
    };
    fetchRules();
  }, []);

  // Get the current theme, handling system preference
  const currentTheme = mounted
    ? theme === "system"
      ? resolvedTheme
      : theme
    : "light";

  const onGridReady = (params) => {
    gridApi.current = params.api;

    // Restore selection only when the grid is ready
    if (selectedRows) {
      params.api.forEachNode((node) => {
        if (
          selectedRows.some(
            (row) => row.automation_id === node.data.automation_id
          )
        ) {
          node.setSelected(true);
        }
      });
    }
  };

  // Column Definitions: Defines & controls grid columns.
  const [colDefs, setColDefs] = useState([
    {
      field: "rule_number",
      headerName: "Rule Number",
      sortable: true,
      filter: true,
    },
    {
      field: "name",
      headerName: "Rule Name",
      sortable: true,
      filter: true,
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
    rowSelection: {
      mode: "multiRow",
    },
    onSelectionChanged: (event) => {
      onSelectionChange(
        event.api.getSelectedRows(),
        event.api.getDisplayedRowCount()
      );
    },
    onGridReady: onGridReady,
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
    <div className="w-full h-full space-y-4">
      <div className="text-sm text-muted-foreground">
        Here are the available automations.
      </div>
      <AgGridReact
        ref={gridApi}
        {...gridOptions}
        key={currentTheme} // Force re-render when theme changes
      />
    </div>
  );
}

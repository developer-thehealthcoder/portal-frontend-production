"use client";
import {
  AllCommunityModule,
  ModuleRegistry,
  colorSchemeDarkBlue,
  themeBalham,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useAtomValue } from "jotai";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { newInsuranceRangeAtom } from "..";
import { format } from "date-fns";
import axiosInstance from "@/lib/foundation-kit/axiosInstance";

ModuleRegistry.registerModules([AllCommunityModule]);

// Create theme objects using the new v33 Theming API
const themeLight = themeBalham;
const themeDarkBlue = themeBalham.withPart(colorSchemeDarkBlue);

// Create new GridExample component
export default function SelectAppointments({
  onSelectionChange,
  selectedRows,
}) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [rowData, setRowData] = useState([]);
  const gridApi = useRef(null);
  const selectedRange = useAtomValue(newInsuranceRangeAtom);

  // Wait for component to mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const startDate = format(selectedRange.date_range.from, "MM/dd/yyyy");
        const endDate = format(selectedRange.date_range.to, "MM/dd/yyyy");
        const { data } = await axiosInstance.get(
          `/patients/list?start_date=${startDate}&end_date=${endDate}`,
          {
            timeout: 180000, // 3 minutes for large date ranges
          }
        );
        setRowData(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchPatients();
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
            (row) => row.appointmentid === node.data.appointmentid
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
      field: "appointmentid",
      headerName: "Appointment ID",
      sortable: true,
      filter: true,
    },
    {
      field: "appointmentdate",
      headerName: "Appointment Date",
      sortable: true,
      filter: true,
    },
    {
      field: "patientid",
      headerName: "Patient ID",
      sortable: true,
      filter: true,
    },
    {
      field: "firstname",
      headerName: "First Name",
      sortable: true,
      filter: true,
    },
    {
      field: "lastname",
      headerName: "Last Name",
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
        Here are the available appointments.
      </div>
      <AgGridReact
        ref={gridApi}
        {...gridOptions}
        key={currentTheme} // Force re-render when theme changes
      />
    </div>
  );
}

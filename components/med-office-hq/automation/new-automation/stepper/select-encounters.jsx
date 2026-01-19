"use client";
import axiosInstance from "@/lib/foundation-kit/axiosInstance";
import {
  AllCommunityModule,
  ModuleRegistry,
  colorSchemeDarkBlue,
  themeBalham,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { format } from "date-fns";
import { formatDate } from "@/utils/dateTimeFormat";
import { useAtomValue } from "jotai";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { newAutomationRangeAtom } from "..";
import Spinner from "@/components/common/loader/Spinner";

ModuleRegistry.registerModules([AllCommunityModule]);

// Create theme objects using the new v33 Theming API
const themeLight = themeBalham;
const themeDarkBlue = themeBalham.withPart(colorSchemeDarkBlue);

// Create new GridExample component
export default function SelectEncounters({ onSelectionChange, selectedRows }) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [rowData, setRowData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState("Loading patients...");
  const selectedRange = useAtomValue(newAutomationRangeAtom);
  const gridApi = useRef(null);

  // Wait for component to mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchPatients = async () => {
      if (!selectedRange?.date_range) return;
      
      try {
        setIsLoading(true);
        setError(null);
        setLoadingMessage("Fetching patients from Athena... This may take a few minutes for large date ranges.");
        
        const startDate = format(selectedRange.date_range.from, "MM/dd/yyyy");
        const endDate = format(selectedRange.date_range.to, "MM/dd/yyyy");
        
        // Calculate days difference to show appropriate message
        const daysDiff = Math.ceil(
          (selectedRange.date_range.to - selectedRange.date_range.from) /
            (1000 * 60 * 60 * 24)
        );
        
        if (daysDiff > 60) {
          setLoadingMessage(
            `Processing ${daysDiff} days of data. The backend is automatically batching requests. This may take 2-3 minutes...`
          );
        }
        
        const { data } = await axiosInstance.get(
          `/patients/list?start_date=${startDate}&end_date=${endDate}`,
          {
            timeout: 180000, // 3 minutes for large date ranges
          }
        );
        
        setRowData(data || []);
        setLoadingMessage("Loading patients...");
      } catch (error) {
        console.error("Error fetching patients:", error);
        if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
          setError(
            "Request timed out. The date range might be too large. Please try with a smaller range (e.g., 1-2 months) or wait a bit longer as the backend is processing."
          );
        } else {
          setError(
            error.response?.data?.detail ||
              "Failed to fetch patients. Please try again."
          );
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    if (selectedRange?.date_range) {
      fetchPatients();
    }
  }, [selectedRange]);

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
    {
      field: "dob",
      headerName: "DOB",
      sortable: true,
      filter: true,
      valueFormatter: (params) => formatDate(params.value),
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
        Here are the patients available for the selected range.
      </div>
      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-full gap-4">
          <Spinner />
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {loadingMessage}
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center h-full gap-4 p-4">
          <div className="text-destructive text-center max-w-md">
            <p className="font-semibold mb-2">Error Loading Patients</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      ) : (
        <AgGridReact
          ref={gridApi}
          {...gridOptions}
          key={currentTheme} // Force re-render when theme changes
        />
      )}
    </div>
  );
}

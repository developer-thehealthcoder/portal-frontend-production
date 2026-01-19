"use client";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/lib/foundation-kit/axiosInstance";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Spinner from "@/components/common/loader/Spinner";

ModuleRegistry.registerModules([AllCommunityModule]);

// Create theme objects using the new v33 Theming API
const themeLight = themeBalham;
const themeDarkBlue = themeBalham.withPart(colorSchemeDarkBlue);

// Create new GridExample component
export default function AutomationRun() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [rowData, setRowData] = useState([]);
  const [archiveDialog, setArchiveDialog] = useState({ open: false, run: null });
  const [archiving, setArchiving] = useState(false);
  const router = useRouter();

  // Wait for component to mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

    const fetchRuns = async () => {
    try {
      const { data } = await axiosInstance.get("/rules/runs", {
        timeout: 60000, // 1 minute timeout
      });
      setRowData(data || []);
    } catch (error) {
      console.error("Error fetching runs:", error);
      // Error handling is done by axios interceptor
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleArchive = async (run) => {
    setArchiving(true);
    try {
      // Archive the project (soft delete - mark as deleted)
      const { data } = await axiosInstance.post(`/rules/runs/${run.id}/archive`);
      
      // Backend returns: { success: true, message: "...", project_id: "...", project_name: "..." }
      const successMessage = data?.message || `Project "${run.project_name}" archived successfully`;
      toast.success(successMessage);
      
      // Remove the archived run from the list (backend should filter archived items)
      setRowData((prev) => prev.filter((r) => r.id !== run.id));
      
      // Close dialog
      setArchiveDialog({ open: false, run: null });
    } catch (error) {
      console.error("Error archiving run:", error);
      // Handle 404 (project not found) and other errors
      if (error.response?.status === 404) {
        toast.error(
          error.response?.data?.detail || `Project with ID '${run.id}' not found`
        );
      } else {
        toast.error(
          error.response?.data?.detail || "Failed to archive project. Please try again."
        );
      }
    } finally {
      setArchiving(false);
    }
  };

  // Get the current theme, handling system preference
  const currentTheme = mounted
    ? theme === "system"
      ? resolvedTheme
      : theme
    : "light";

  // Column Definitions: Defines & controls grid columns.
  const [colDefs, setColDefs] = useState([
    {
      field: "archive",
      headerName: "Archive",
      maxWidth: 100,
      filter: false,
      cellRenderer: (params) => {
        const run = params.data;
        return (
          <div 
            className="flex justify-start items-center w-full h-full cursor-pointer hover:opacity-70 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setArchiveDialog({ open: true, run });
            }}
          >
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
          <Link
            href={`/run/${params.data.id}`}
            target="_blank"
            className="flex justify-start items-center w-full h-full cursor-pointer"
          >
            <EyeIcon className="w-6 h-6" fill="#2c84d4" stroke="white" />
          </Link>
        );
      },
    },
    {
      field: "id",
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
      field: "created_at",
      headerName: "Executed Date",
      sortable: true,
      filter: true,
      sort: "desc", // Default sort: newest first
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
    paginationPageSize: 100, // Default to 100 rows per page
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
        <h1 className="text-2xl font-semibold">Run</h1>
        <Button
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.push("/new-automation")}
        >
          <PlusIcon className="w-4 h-4" />
          New Automation
        </Button>
      </div>
      <AgGridReact
        {...gridOptions}
        key={currentTheme} // Force re-render when theme changes
      />

      {/* Archive Confirmation Dialog */}
      <AlertDialog
        open={archiveDialog.open}
        onOpenChange={(open) =>
          setArchiveDialog({ open, run: open ? archiveDialog.run : null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive the project "{archiveDialog.run?.project_name}"?
              <br />
              <span className="text-xs text-muted-foreground mt-2 block">
                Project ID: {archiveDialog.run?.id}
              </span>
              <span className="text-xs text-muted-foreground mt-2 block">
                The project will be marked as deleted and hidden from the list.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleArchive(archiveDialog.run)}
              disabled={archiving}
              className="bg-gray-600 hover:bg-gray-700"
            >
              {archiving ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Archiving...
                </>
              ) : (
                "Archive"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/utils/dateTimeFormat";
import {
  AllCommunityModule,
  ModuleRegistry,
  colorSchemeDarkBlue,
  themeBalham,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { ChevronDownIcon, ChevronRightIcon, MoreHorizontal, RotateCcw, Play } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useGetRunDetail } from "@/api/run/run.queries";
import IconHeader from "../new-automation/stepper/custom-header";
import { DetailRenderer } from "../new-automation/stepper/results-detail-renderer";
import Spinner from "@/components/common/loader/Spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
import axiosInstance from "@/lib/foundation-kit/axiosInstance";
import { toast } from "sonner";

ModuleRegistry.registerModules([AllCommunityModule]);

const themeLight = themeBalham;
const themeDarkBlue = themeBalham.withPart(colorSchemeDarkBlue);

export default function RunDetail({ id }) {
  const [progress, setProgress] = useState(20);
  const [rollbackStates, setRollbackStates] = useState({}); // Track which rows have been rolled back
  const [rollbackLoading, setRollbackLoading] = useState({}); // Track loading state per row
  const [confirmDialog, setConfirmDialog] = useState({ open: false, row: null });
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: runDetail, isLoading, refetch } = useGetRunDetail(id);

  console.log("runDetail", runDetail);

  useEffect(() => {
    if (runDetail?.results.length > 0) {
      // Group results by appointment_id to handle duplicates
      // If the same patient appears multiple times, merge their details
      const groupedResults = new Map();
      
      runDetail.results.forEach((result) => {
        const appointmentId = result.appointment_id || result.appointmentid;
        
        if (!appointmentId) {
          // Skip results without appointment_id
          return;
        }
        
        if (groupedResults.has(appointmentId)) {
          // Patient already exists - merge details and aggregate status counts
          const existing = groupedResults.get(appointmentId);
          
          // Merge details, avoiding duplicates (same rule_number)
          const existingRuleNumbers = new Set(
            (existing.details || []).map((d) => d.rule_number)
          );
          
          const newDetails = (result.details || []).filter(
            (detail) => !existingRuleNumbers.has(detail.rule_number)
          );
          
          existing.details = [...(existing.details || []), ...newDetails];
          
          // Aggregate status counts
          existing.status_1_changes_made = 
            (existing.status_1_changes_made || 0) + (result.status_1_changes_made || 0);
          existing.status_2_condition_met_no_changes = 
            (existing.status_2_condition_met_no_changes || 0) + (result.status_2_condition_met_no_changes || 0);
          existing.status_3_condition_not_met = 
            (existing.status_3_condition_not_met || 0) + (result.status_3_condition_not_met || 0);
          existing.status_4_errors = 
            (existing.status_4_errors || 0) + (result.status_4_errors || 0);
        } else {
          // New patient - add to map
          // Ensure both appointment_id and appointmentid are set for consistency
          groupedResults.set(appointmentId, {
            ...result,
            appointment_id: appointmentId, // Ensure appointment_id is set
            appointmentid: appointmentId, // Also set appointmentid for compatibility
            // Ensure details is an array and deduplicate rules within it
            details: (result.details || []).reduce((acc, detail) => {
              // Check if this rule_number already exists in details
              const exists = acc.some((d) => d.rule_number === detail.rule_number);
              if (!exists) {
                acc.push(detail);
              }
              return acc;
            }, []),
          });
        }
      });
      
      // Convert map back to array
      const processedResults = Array.from(groupedResults.values());
      setRowData(processedResults);
      setProgress(100);
    } else {
      setProgress(progress + 1);
    }
  }, [runDetail?.results]);

  const [rowData, setRowData] = useState([]);

  useEffect(() => setMounted(true), []);

  const currentTheme =
    mounted && theme === "system" ? resolvedTheme : theme || "light";

  const toggleExpand = (row) => {
    const newData = [];

    for (let i = 0; i < rowData.length; i++) {
      const current = rowData[i];

      if (current.appointment_id === row.appointment_id) {
        current.isExpanded = !current.isExpanded;
        newData.push(current);
        if (current.isExpanded) {
          newData.push({
            isDetail: true,
            parentId: current.appointment_id,
            detail: current.details,
          });
        } else if (
          i + 1 < rowData.length &&
          rowData[i + 1].isDetail &&
          rowData[i + 1].parentId === current.appointment_id
        ) {
          i++; // skip detail row
        }
      } else {
        newData.push(current);
      }
    }

    setRowData(newData);
  };

  const formatDateForAPI = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleRollback = async (row) => {
    // Use consistent appointment ID key for tracking
    const appointmentId = row.appointment_id || row.appointmentid;
    setRollbackLoading((prev) => ({ ...prev, [appointmentId]: true }));
    
    try {
      // Get all rules that made changes (status_1_changes_made)
      const rulesToRollback = row.details?.filter(
        (detail) => detail.status === "changes_made" || detail.status === 1
      ) || [];

      // If no rules found, try to get all rules from details
      const rules = rulesToRollback.length > 0 
        ? rulesToRollback 
        : row.details || [];

      // Prepare patient data with properly formatted date
      const patientData = {
        appointmentid: String(row.appointmentid || row.appointment_id || ""),
        appointmentdate: formatDateForAPI(row.appointment_date),
        patientid: String(row.patientid || row.patient_id || ""),
        firstname: row.first_name || "",
        lastname: row.last_name || "",
        dob: formatDateForAPI(row.dob),
      };

      // Rollback each rule for THIS SPECIFIC PATIENT ONLY
      // Each rollback API call includes only this one patient in the patients array
      const rollbackPromises = rules.map((rule) => {
        let ruleNumber = rule.rule_number;
        // Ensure rule number is in format "ruleXX"
        if (typeof ruleNumber === "number") {
          ruleNumber = `rule${ruleNumber}`;
        } else if (typeof ruleNumber === "string" && !ruleNumber.toLowerCase().startsWith("rule")) {
          ruleNumber = `rule${ruleNumber}`;
        }
        // IMPORTANT: patients array contains ONLY this specific patient
        // This ensures rollback only affects this patient, not all patients
        return axiosInstance.post(
          `/rules/${ruleNumber}/rollback`,
          {
            add_modifiers: true, // API docs specify true for rollback
            is_rollback: true,
            patients: [patientData], // Only this specific patient
          },
          {
            timeout: 180000, // 3 minutes timeout
          }
        );
      });

      if (rollbackPromises.length === 0) {
        toast.error("No rules found to rollback");
        return;
      }

      await Promise.all(rollbackPromises);

      // Mark as rolled back and update local row state (status = 4, reason = "rollback")
      // Use consistent appointment ID key
      const appointmentId = row.appointment_id || row.appointmentid;
      setRollbackStates((prev) => ({
        ...prev,
        [appointmentId]: true, // Use consistent key
      }));
      setRowData((prev) =>
        prev.map((r) => {
          // Check both appointment_id and appointmentid for matching
          const rAppointmentId = r.appointment_id || r.appointmentid;
          if (rAppointmentId !== appointmentId) return r;
          return {
            ...r,
            status: 4,
            status_1_changes_made: 0,
            details: (r.details || []).map((d) => ({
              ...d,
              status: 4,
              reason: "rollback",
            })),
          };
        })
      );

      toast.success("Rollback completed successfully");
      
      // Refetch data to update the table
      refetch();
    } catch (error) {
      console.error("Rollback error:", error);
      toast.error(
        error.response?.data?.detail || "Failed to rollback changes"
      );
    } finally {
      const appointmentId = row.appointment_id || row.appointmentid;
      setRollbackLoading((prev) => ({
        ...prev,
        [appointmentId]: false,
      }));
      setConfirmDialog({ open: false, row: null });
    }
  };

  const handleApplyRule = async (row) => {
    // Use consistent appointment ID key for tracking
    const appointmentId = row.appointment_id || row.appointmentid;
    setRollbackLoading((prev) => ({ ...prev, [appointmentId]: true }));
    
    try {
      // Get all rules that were previously applied (from details)
      const rules = row.details?.map((detail) => detail.rule_number) || [];
      
      if (rules.length === 0) {
        toast.error("No rules found to apply");
        return;
      }

      // Prepare patient data with properly formatted date
      const patientData = {
        appointmentid: String(row.appointmentid || row.appointment_id || ""),
        appointmentdate: formatDateForAPI(row.appointment_date),
        patientid: String(row.patientid || row.patient_id || ""),
        firstname: row.first_name || "",
        lastname: row.last_name || "",
        dob: formatDateForAPI(row.dob),
      };

      // Apply rules using the unified endpoint (same as new automation)
      // This will re-apply the rules for this specific patient only
      const { data } = await axiosInstance.post(
        "/rules/run",
        {
          project_name: runDetail?.project_name || "Re-apply Rules",
          add_modifiers: true,
          is_rollback: false,
          patients: [patientData], // Only this specific patient
          rules: rules, // All rules that were previously applied
        },
        {
          timeout: 180000, // 3 minutes timeout
        }
      );

      if (data?.execution_id) {
        // If backend supports non-blocking, we could poll for progress
        // For now, wait for results or show success
        toast.success("Rules applied successfully. Refreshing data...");
        
        // Mark as no longer rolled back (rules have been re-applied)
        const appointmentId = row.appointment_id || row.appointmentid;
        setRollbackStates((prev) => {
          const newState = { ...prev };
          delete newState[appointmentId]; // Use consistent key
          return newState;
        });
        
        // Refetch data to update the table with new results
        refetch();
      } else {
        toast.success("Rules applied successfully");
        refetch();
      }
    } catch (error) {
      console.error("Apply rule error:", error);
      toast.error(
        error.response?.data?.detail || "Failed to apply rules"
      );
    } finally {
      const appointmentId = row.appointment_id || row.appointmentid;
      setRollbackLoading((prev) => ({
        ...prev,
        [appointmentId]: false,
      }));
    }
  };

  const columnDefs = [
    {
      headerName: "",
      field: "expand",
      maxWidth: 50,
      cellRenderer: (params) => {
        if (params.data.isDetail) return "";
        return (
          <button
            // onClick={() => toggleExpand(params.data)}
            className="cursor-pointer"
          >
            {params.data.isExpanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
        );
      },
    },
    {
      field: "status_4_errors",
      headerComponent: IconHeader,
      sortable: true,
      maxWidth: 50,
    },
    {
      field: "status_3_condition_not_met",
      headerComponent: IconHeader,
      sortable: true,
      maxWidth: 50,
    },
    {
      field: "status_2_condition_met_no_changes",
      headerComponent: IconHeader,
      sortable: true,
      maxWidth: 50,
    },
    {
      field: "status_1_changes_made",
      headerComponent: IconHeader,
      sortable: true,
      maxWidth: 50,
    },
    {
      headerName: "Appointment ID",
      field: "appointmentid",
      maxWidth: 150,
      filter: true,
    },
    {
      headerName: "Appointment Date",
      field: "appointment_date",
      cellRenderer: (params) => formatDate(params.data.appointment_date),
      maxWidth: 150,
      filter: true,
    },
    {
      headerName: "Patient ID",
      field: "patientid",
      maxWidth: 120,
      filter: true,
    },
    {
      headerName: "First Name",
      field: "first_name",
      maxWidth: 120,
      filter: true,
    },
    {
      headerName: "Last Name",
      field: "last_name",
      maxWidth: 120,
      filter: true,
    },
    {
      headerName: "Actions",
      field: "actions",
      maxWidth: 100,
      filter: false,
      sortable: false,
      cellRenderer: (params) => {
        if (params.data.isDetail) return "";
        
        const row = params.data;
        // Check if row has changes made (status_1_changes_made can be number, boolean, or string)
        const hasChanges = 
          (typeof row.status_1_changes_made === "number" && row.status_1_changes_made > 0) ||
          (typeof row.status_1_changes_made === "boolean" && row.status_1_changes_made === true) ||
          (typeof row.status_1_changes_made === "string" && row.status_1_changes_made !== "0" && row.status_1_changes_made !== "");
        
        // Use consistent appointment ID key for rollback state check
        const appointmentId = row.appointment_id || row.appointmentid;
        const isRolledBack = rollbackStates[appointmentId];
        const isLoading = rollbackLoading[appointmentId];

        // Only show actions if:
        // 1. Row has been rolled back (show Apply Rule button)
        // 2. Row has changes AND hasn't been rolled back (show Rollback button)
        if (!isRolledBack && !hasChanges) return "";

        return (
          <div className="flex items-center justify-center h-full">
            {isRolledBack ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApplyRule(row);
                }}
                className="h-8 w-8 p-0"
                disabled={isLoading}
              >
                <Play className="h-4 w-4" />
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                    disabled={isLoading}
                  >
                    <span className="sr-only">Open menu</span>
                    {isLoading ? (
                      <Spinner />
                    ) : (
                      <MoreHorizontal className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDialog({ open: true, row });
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Rollback
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      },
    },
  ];

  const getRowStyle = (params) => {
    if (params.data?.isDetail) {
      return { backgroundColor: "#f9f9f9" };
    }
    return {};
  };
  if (isLoading) {
    return (
      <div className="w-full h-full p-4 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Run Detail</h1>
        <span className="text-lg text-gray-500">
          for {runDetail?.project_name}
        </span>
      </div>
      <div className="flex justify-center items-center h-full gap-4">
        <div className="w-full h-full">
          <AgGridReact
            key={currentTheme}
            theme={currentTheme === "dark" ? themeDarkBlue : themeLight}
            rowData={rowData}
            columnDefs={columnDefs}
            pagination
            paginationPageSize={10}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            getRowStyle={getRowStyle}
            domLayout="autoHeight"
            onRowClicked={(params) => {
              toggleExpand(params.data);
            }}
            isFullWidthRow={(params) => params.rowNode?.data?.isDetail}
            fullWidthCellRenderer={(params) => (
              <DetailRenderer
                data={params.data}
                node={params.node}
                api={params.api}
              />
            )}
          />
        </div>
      </div>

      {/* Rollback Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog({ open, row: open ? confirmDialog.row : null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Rollback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to rollback the changes made to this
              appointment? This action will undo all rule modifications for
              appointment ID: {confirmDialog.row?.appointmentid ||
                confirmDialog.row?.appointment_id}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleRollback(confirmDialog.row)}
            >
              Rollback
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

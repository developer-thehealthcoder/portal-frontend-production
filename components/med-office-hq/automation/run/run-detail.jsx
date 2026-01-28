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
import { ChevronDownIcon, ChevronRightIcon, MoreHorizontal, RotateCcw, Play, CircleAlert, CircleCheck, CircleHelp, CircleX, ChevronDown } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  const [projectRollbackDialog, setProjectRollbackDialog] = useState({ open: false });
  const [isProjectRollbackLoading, setIsProjectRollbackLoading] = useState(false);
  const [isStatusLegendOpen, setIsStatusLegendOpen] = useState(false);
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
          
          // Preserve rollback_status and rollbacked_at (use rollbacked if any result is rolled back)
          if (result.rollback_status === 'rollbacked' || existing.rollback_status === 'rollbacked') {
            existing.rollback_status = 'rollbacked';
            // Use the most recent rollbacked_at if available
            if (result.rollbacked_at && (!existing.rollbacked_at || new Date(result.rollbacked_at) > new Date(existing.rollbacked_at))) {
              existing.rollbacked_at = result.rollbacked_at;
            }
          } else if (result.rollback_status && !existing.rollback_status) {
            existing.rollback_status = result.rollback_status;
            existing.rollbacked_at = result.rollbacked_at;
          }
        } else {
          // New patient - add to map
          // Ensure both appointment_id and appointmentid are set for consistency
          groupedResults.set(appointmentId, {
            ...result,
            appointment_id: appointmentId, // Ensure appointment_id is set
            appointmentid: appointmentId, // Also set appointmentid for compatibility
            // Preserve rollback_status and rollbacked_at from database
            rollback_status: result.rollback_status || null,
            rollbacked_at: result.rollbacked_at || null,
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

  // Determine add_modifiers value based on rule number
  const getAddModifiersForRule = (ruleNumber) => {
    // Rule 21: add_modifiers: false
    // Rule 22: add_modifiers: true
    // Default to true for other rules
    if (ruleNumber === 21 || ruleNumber === "21" || ruleNumber === "rule21") {
      return false;
    }
    return true;
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
        // Include project_id as query parameter for reliable rollback tracking
        const projectId = runDetail?.project_id || id;
        const addModifiers = getAddModifiersForRule(rule.rule_number);
        return axiosInstance.post(
          `/rules/${ruleNumber}/rollback?project_id=${projectId}`,
          {
            add_modifiers: addModifiers, // Rule 21: false, Rule 22: true
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

      toast.success("Rollback completed successfully");
      
      // Refetch data to update the table with rollback_status from database
      // This ensures we get the latest rollback_status and rollbacked_at from the backend
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

  const handleProjectRollback = async () => {
    setIsProjectRollbackLoading(true);
    
    try {
      // Get all patients from the project (exclude detail rows)
      const allPatients = rowData.filter((row) => !row.isDetail);
      
      if (allPatients.length === 0) {
        toast.error("No patients found to rollback");
        return;
      }

      // Group patients by rule
      // Structure: { ruleNumber: { add_modifiers: boolean, patients: [...] } }
      const patientsByRule = {};
      
      allPatients.forEach((patient) => {
        const appointmentId = patient.appointment_id || patient.appointmentid;
        
        // Skip if already rolled back
        if (patient.rollback_status === 'rollbacked') {
          return;
        }
        
        // Get all rules that affected this patient
        const rules = patient.details || [];
        
        rules.forEach((ruleDetail) => {
          const ruleNumber = ruleDetail.rule_number;
          
          // Initialize rule group if not exists
          if (!patientsByRule[ruleNumber]) {
            patientsByRule[ruleNumber] = {
              add_modifiers: getAddModifiersForRule(ruleNumber),
              patients: [],
            };
          }
          
          // Check if this patient is already added for this rule
          const existingPatient = patientsByRule[ruleNumber].patients.find(
            (p) => p.appointmentid === String(appointmentId)
          );
          
          if (!existingPatient) {
            // Add patient to this rule's list
            patientsByRule[ruleNumber].patients.push({
              appointmentid: String(patient.appointmentid || patient.appointment_id || ""),
              appointmentdate: formatDateForAPI(patient.appointment_date),
              patientid: String(patient.patientid || patient.patient_id || ""),
              firstname: patient.first_name || "",
              lastname: patient.last_name || "",
              dob: formatDateForAPI(patient.dob),
            });
          }
        });
      });

      // Create rollback promises for each rule
      const rollbackPromises = Object.entries(patientsByRule).map(([ruleNumber, ruleData]) => {
        let formattedRuleNumber = ruleNumber;
        // Ensure rule number is in format "ruleXX"
        if (typeof ruleNumber === "number") {
          formattedRuleNumber = `rule${ruleNumber}`;
        } else if (typeof ruleNumber === "string" && !ruleNumber.toLowerCase().startsWith("rule")) {
          formattedRuleNumber = `rule${ruleNumber}`;
        }
        
        const projectId = runDetail?.project_id || id;
        
        return axiosInstance.post(
          `/rules/${formattedRuleNumber}/rollback?project_id=${projectId}`,
          {
            add_modifiers: ruleData.add_modifiers,
            is_rollback: true,
            patients: ruleData.patients,
          },
          {
            timeout: 300000, // 5 minutes timeout for large projects
          }
        );
      });

      if (rollbackPromises.length === 0) {
        toast.error("No rules found to rollback");
        return;
      }

      await Promise.all(rollbackPromises);

      toast.success(`Project rollback completed successfully for ${allPatients.length} patients`);
      
      // Refetch data to update the table with rollback_status from database
      refetch();
      
      setProjectRollbackDialog({ open: false });
    } catch (error) {
      console.error("Project rollback error:", error);
      toast.error(
        error.response?.data?.detail || "Failed to rollback project changes"
      );
    } finally {
      setIsProjectRollbackLoading(false);
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
      const projectId = runDetail?.project_id || id;
      const { data } = await axiosInstance.post(
        "/rules/run",
        {
          project_name: runDetail?.project_name || "Re-apply Rules",
          project_id: projectId, // Include project_id for tracking
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
        
        // Refetch data to update the table with new results
        // This will update rollback_status from the database
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

  // Helper function to get status details for a column
  const getStatusDetails = (row, statusField) => {
    const details = row.details || [];
    let matchingDetails = [];
    let statusName = "";
    let statusIcon = null;

    switch (statusField) {
      case "status_1_changes_made":
        matchingDetails = details.filter(
          (d) => d.status === "changes_made" || d.status === 1 || d.status === "Condition Met Made Changes"
        );
        statusName = "Condition Met Made Changes";
        statusIcon = <CircleCheck className="w-4 h-4 text-green-500" />;
        break;
      case "status_2_condition_met_no_changes":
        matchingDetails = details.filter(
          (d) => d.status === "condition_met_no_changes" || d.status === 2 || d.status === "Condition Met No Change"
        );
        statusName = "Condition Met No Change";
        statusIcon = <CircleHelp className="w-4 h-4 text-blue-500" />;
        break;
      case "status_3_condition_not_met":
        matchingDetails = details.filter(
          (d) => d.status === "condition_not_met" || d.status === 3 || d.status === "Condition Not Met"
        );
        statusName = "Condition Not Met";
        statusIcon = <CircleAlert className="w-4 h-4 text-gray-500" />;
        break;
      case "status_4_errors":
        matchingDetails = details.filter(
          (d) => d.status === "error" || d.status === 4 || d.status === "Errors"
        );
        statusName = "Errors";
        statusIcon = <CircleX className="w-4 h-4 text-red-500" />;
        break;
    }

    return { matchingDetails, statusName, statusIcon };
  };

  // Cell renderer for status columns
  const statusCellRenderer = (statusField) => (params) => {
    if (params.data.isDetail) return "";
    
    const row = params.data;
    const count = row[statusField] || 0;
    
    // If count is 0, show nothing
    if (count === 0 || (typeof count === "string" && count === "0")) {
      return "";
    }

    const { matchingDetails, statusName, statusIcon } = getStatusDetails(row, statusField);
    
    // Get unique notification messages from reason field
    const notifications = matchingDetails
      .map((d) => d.reason)
      .filter((reason) => reason && reason.trim() !== "")
      .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

    return (
      <div className="flex flex-col gap-1 p-1 text-xs">
        <div className="flex items-center gap-1.5">
          {statusIcon}
          <span className="font-medium">{statusName}</span>
          <span className="text-muted-foreground">({count})</span>
        </div>
        {notifications.length > 0 && (
          <div className="flex flex-col gap-0.5 ml-5 text-muted-foreground">
            {notifications.map((notification, idx) => (
              <div key={idx} className="text-xs">
                {notification}
              </div>
            ))}
          </div>
        )}
      </div>
    );
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
      maxWidth: 200,
      cellRenderer: statusCellRenderer("status_4_errors"),
      autoHeight: true,
      wrapText: true,
    },
    {
      field: "status_3_condition_not_met",
      headerComponent: IconHeader,
      sortable: true,
      maxWidth: 200,
      cellRenderer: statusCellRenderer("status_3_condition_not_met"),
      autoHeight: true,
      wrapText: true,
    },
    {
      field: "status_2_condition_met_no_changes",
      headerComponent: IconHeader,
      sortable: true,
      maxWidth: 200,
      cellRenderer: statusCellRenderer("status_2_condition_met_no_changes"),
      autoHeight: true,
      wrapText: true,
    },
    {
      field: "status_1_changes_made",
      headerComponent: IconHeader,
      sortable: true,
      maxWidth: 200,
      cellRenderer: statusCellRenderer("status_1_changes_made"),
      autoHeight: true,
      wrapText: true,
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
        
        // Check rollback_status from database (primary source of truth)
        // Also check local state as fallback for immediate UI updates
        const appointmentId = row.appointment_id || row.appointmentid;
        const isRolledBack = row.rollback_status === 'rollbacked' || rollbackStates[appointmentId];
        const isLoading = rollbackLoading[appointmentId];

        // Only show actions if:
        // 1. Row has been rolled back (show Apply Rule button)
        // 2. Row has changes AND hasn't been rolled back (show Rollback button)
        if (!isRolledBack && !hasChanges) return "";

        return (
          <div className="flex items-center justify-center gap-2 h-full">
            {isRolledBack && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs px-2 py-1 max-w-[120px] truncate">
                    ✓ Rollbacked
                    {row.rollbacked_at && (
                      <span className="ml-1.5 opacity-70">
                        {new Date(row.rollbacked_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Rollbacked on {row.rollbacked_at ? new Date(row.rollbacked_at).toLocaleString() : 'N/A'}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
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
                title="Re-apply rules"
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

  // Check if any patients in the project can be rolled back
  const hasRollbackablePatients = rowData.some(
    (row) => !row.isDetail && 
    row.rollback_status !== 'rollbacked' &&
    ((typeof row.status_1_changes_made === "number" && row.status_1_changes_made > 0) ||
     (typeof row.status_1_changes_made === "boolean" && row.status_1_changes_made === true) ||
     (typeof row.status_1_changes_made === "string" && row.status_1_changes_made !== "0" && row.status_1_changes_made !== ""))
  );

  const statusDefinitions = [
    {
      icon: <CircleCheck className="w-5 h-5 text-green-500" />,
      status: "Condition Met Made Changes",
      notification: "Rules were applied and changes were made",
      field: "status_1_changes_made",
    },
    {
      icon: <CircleHelp className="w-5 h-5 text-blue-500" />,
      status: "Condition Met No Change",
      notification: "Condition was met but no changes were needed",
      field: "status_2_condition_met_no_changes",
    },
    {
      icon: <CircleAlert className="w-5 h-5 text-gray-500" />,
      status: "Condition Not Met",
      notification: "The rule condition was not met",
      field: "status_3_condition_not_met",
    },
    {
      icon: <CircleX className="w-5 h-5 text-red-500" />,
      status: "Errors",
      notification: "An error occurred while processing",
      field: "status_4_errors",
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Run Detail</h1>
          <span className="text-lg text-gray-500">
            for {runDetail?.project_name}
          </span>
        </div>
        {hasRollbackablePatients && (
          <Button
            variant="outline"
            onClick={() => setProjectRollbackDialog({ open: true })}
            disabled={isProjectRollbackLoading}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {isProjectRollbackLoading ? "Rolling back..." : "Rollback Project"}
          </Button>
        )}
      </div>

      {/* Status Legend - Expandable */}
      <Collapsible open={isStatusLegendOpen} onOpenChange={setIsStatusLegendOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="font-medium">Status Definitions</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isStatusLegendOpen ? "transform rotate-180" : ""
              }`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="space-y-2">
              {statusDefinitions.map((def, index) => (
                <div
                  key={def.field}
                  className="flex items-start gap-3 py-2 border-b last:border-b-0"
                >
                  <div className="flex-shrink-0 mt-0.5">{def.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{def.status}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {def.notification}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      {/* Full-screen loader overlay for rollback operations */}
      {(isProjectRollbackLoading || Object.values(rollbackLoading).some(loading => loading)) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 flex flex-col items-center gap-4 min-w-[200px]">
            <Spinner />
            <p className="text-sm font-medium">
              {isProjectRollbackLoading ? "Rolling back project..." : "Rolling back..."}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Please wait while changes are being reverted
            </p>
          </div>
        </div>
      )}

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

      {/* Project Rollback Confirmation Dialog */}
      <AlertDialog
        open={projectRollbackDialog.open}
        onOpenChange={(open) =>
          setProjectRollbackDialog({ open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Project Rollback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to rollback changes for the entire project?
              This action will undo all rule modifications for all patients in
              project "{runDetail?.project_name}". This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProjectRollbackLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProjectRollback}
              disabled={isProjectRollbackLoading}
            >
              {isProjectRollbackLoading ? "Rolling back..." : "Rollback Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

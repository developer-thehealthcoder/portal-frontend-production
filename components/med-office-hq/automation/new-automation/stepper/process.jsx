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
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import IconHeader, { CustomInnerHeader } from "./custom-header";
import { DetailRenderer } from "./results-detail-renderer";
import axiosInstance from "@/lib/foundation-kit/axiosInstance";

ModuleRegistry.registerModules([AllCommunityModule]);

const themeLight = themeBalham;
const themeDarkBlue = themeBalham.withPart(colorSchemeDarkBlue);

export default function Process({ results, isProcessing, error, patientCount, selectedRules, executionId, onAllRulesCompleted }) {
  const [ruleProgresses, setRuleProgresses] = useState({});
  const [ruleDetails, setRuleDetails] = useState({}); // Store detailed progress info
  const [overallProgress, setOverallProgress] = useState(null); // Store overall progress
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const progressIntervalRef = useRef(null);
  
  const ruleCount = selectedRules?.length || 0;

  // Poll for real-time progress from backend API
  useEffect(() => {
    console.log("Progress polling effect:", { isProcessing, executionId, ruleCount });
    
    if (isProcessing && executionId && ruleCount > 0) {
      console.log("Starting progress polling for execution_id:", executionId);
      
      // Initialize progress for each rule
      const initialProgresses = {};
      const initialDetails = {};
      selectedRules.forEach((rule) => {
        initialProgresses[rule.rule_number] = 0;
        initialDetails[rule.rule_number] = {
          percentage: 0,
          patients_processed: 0,
          total_patients: patientCount,
          status: "pending",
        };
      });
      setRuleProgresses(initialProgresses);
      setRuleDetails(initialDetails);
      setOverallProgress(null);
      
      // Fetch progress immediately
      const fetchProgress = async () => {
        try {
          console.log("Fetching progress for execution_id:", executionId);
          const { data } = await axiosInstance.get(`/rules/progress/${executionId}`);
          console.log("Progress API response:", data);
          
          if (data) {
            const newProgresses = {};
            const newDetails = {};
            let allCompleted = true;
            
            // Update overall progress
            if (data.overall) {
              setOverallProgress(data.overall);
            }
            
            // Update progress for each rule from API response
            // API returns rule_21, rule_22, etc. as keys
            selectedRules.forEach((rule) => {
              const ruleKey = `rule_${rule.rule_number}`;
              const ruleData = data[ruleKey];
              
              if (ruleData) {
                const status = ruleData.status || "pending";
                newProgresses[rule.rule_number] = ruleData.percentage || 0;
                newDetails[rule.rule_number] = {
                  percentage: ruleData.percentage || 0,
                  patients_processed: ruleData.patients_processed || 0,
                  total_patients: ruleData.total_patients || patientCount,
                  status: status,
                };
                
                // Check if this rule is completed
                if (status !== "completed" && status !== "error") {
                  allCompleted = false;
                }
              } else {
                // Rule not in response yet, keep default
                newProgresses[rule.rule_number] = 0;
                newDetails[rule.rule_number] = {
                  percentage: 0,
                  patients_processed: 0,
                  total_patients: patientCount,
                  status: "pending",
                };
                allCompleted = false;
              }
            });
            
            setRuleProgresses(newProgresses);
            setRuleDetails(newDetails);
            
            // If all rules are completed, fetch final results and notify parent
            if (allCompleted && (data.status === "completed" || data.status === "error")) {
              console.log("All rules completed! Fetching final results...");
              
              // Stop polling first
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }
              
              // Fetch final results from the new results endpoint
              const fetchFinalResults = async () => {
                try {
                  console.log("Fetching final results for execution_id:", executionId);
                  const { data: resultsData } = await axiosInstance.get(`/rules/results/${executionId}`);
                  
                  if (resultsData?.results) {
                    console.log("Got final results:", resultsData.results.length, "items");
                    // Notify parent with results
                    if (onAllRulesCompleted) {
                      onAllRulesCompleted({ ...data, results: resultsData.results });
                    }
                  } else {
                    console.warn("No results in response, notifying parent anyway");
                    // Notify parent even without results (might be error case)
                    if (onAllRulesCompleted) {
                      onAllRulesCompleted(data);
                    }
                  }
                } catch (error) {
                  console.error("Error fetching final results:", error);
                  // If results endpoint fails, notify parent anyway with progress data
                  if (onAllRulesCompleted) {
                    onAllRulesCompleted(data);
                  }
                }
              };
              
              // Fetch results immediately
              fetchFinalResults();
            }
          }
        } catch (error) {
          console.error("Error fetching progress:", error);
          // Don't stop polling on error, continue trying
        }
      };
      
      // Fetch immediately
      fetchProgress();
      
      // Poll every 1.5 seconds for real-time updates (recommended: 1-2 seconds)
      progressIntervalRef.current = setInterval(fetchProgress, 1500);
    } else {
      // Clear interval when not processing
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (!isProcessing) {
        setRuleProgresses({});
        setRuleDetails({});
        setOverallProgress(null);
      }
    }

    // Cleanup on unmount
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isProcessing, executionId, ruleCount, selectedRules, patientCount]);

  useEffect(() => {
    // CRITICAL: The API call only resolves when ALL rules are complete
    // So if results arrive, it means ALL rules (21, 22, etc.) are done
    if (results && results.length > 0 && !isProcessing) {
      // All rules are complete - set all to 100%
      const completedProgresses = {};
      selectedRules.forEach((rule) => {
        completedProgresses[rule.rule_number] = 100;
      });
      setRuleProgresses(completedProgresses);
      setRowData(results);
      
      // Clear interval if still running
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  }, [results, isProcessing, selectedRules]);

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
  ];

  const getRowStyle = (params) => {
    if (params.data?.isDetail) {
      return { backgroundColor: "#f9f9f9" };
    }
    return {};
  };

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-275px)] gap-4 p-4">
        <div className="text-destructive text-center max-w-md">
          <p className="font-semibold mb-2">Error Processing Rules</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Show progress bars for each rule when processing
  // CRITICAL: Always show progress bars when isProcessing is true, regardless of results
  // This ensures progress bars stay visible until ALL rules are completed
  if (isProcessing) {
    if (ruleCount === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-[calc(100vh-275px)] gap-4">
          <p className="text-sm text-muted-foreground">Waiting to start processing...</p>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-275px)] gap-6 w-full max-w-2xl px-4">
        <div className="w-full space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            Processing {patientCount} encounters{patientCount !== 1 ? 's' : ''} with {ruleCount} rule{ruleCount !== 1 ? 's' : ''}...
          </p>
          {overallProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Overall Progress</span>
                <span className="text-muted-foreground">
                  {Math.round(overallProgress.percentage || 0)}%
                </span>
              </div>
              <Progress value={overallProgress.percentage || 0} className="w-full h-2" />
              {overallProgress.current_rule && (
                <p className="text-xs text-muted-foreground text-center">
                  Currently processing Rule {overallProgress.current_rule}
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="w-full space-y-4">
          {selectedRules.map((rule) => {
            const ruleProgress = ruleProgresses[rule.rule_number] || 0;
            const ruleDetail = ruleDetails[rule.rule_number] || {};
            const ruleNumber = rule.rule_number;
            const status = ruleDetail.status || "pending";
            const processedPatients = ruleDetail.patients_processed || 0;
            const totalPatients = ruleDetail.total_patients || patientCount;
            
            // Determine status display
            let statusText = "in progress";
            if (status === "completed") {
              statusText = "✓ Complete";
            } else if (status === "running") {
              statusText = "in progress";
            } else if (status === "pending") {
              statusText = "pending";
            } else if (status === "error") {
              statusText = "✗ Error";
            }
            
            return (
              <div key={ruleNumber} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    Rule {ruleNumber} {statusText}
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round(ruleProgress)}%
                  </span>
                </div>
                <Progress value={ruleProgress} className="w-full h-2" />
                {status === "running" && (
                  <div className="text-xs text-muted-foreground">
                    {processedPatients} / {totalPatients} encounters processed
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  // If we have results and processing is complete, show completion briefly
  // Navigation will happen from parent component
  if (results && results.length > 0 && !isProcessing) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-275px)] gap-6 w-full max-w-2xl px-4">
        <p className="text-sm font-medium text-green-600 dark:text-green-400">
          All rules completed successfully!
        </p>
        
        <div className="w-full space-y-4">
          {selectedRules.map((rule) => {
            const ruleNumber = rule.rule_number;
    return (
              <div key={ruleNumber} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    Rule {ruleNumber} ✓ Complete
                  </span>
                  <span className="text-muted-foreground">100%</span>
                </div>
                <Progress value={100} className="w-full h-2" />
              </div>
            );
          })}
        </div>
        
        <p className="text-sm text-muted-foreground text-center">
          Redirecting to runs page...
        </p>
      </div>
    );
  }

  return (
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
          headerComponentParams={{
            innerHeaderComponent: CustomInnerHeader,
          }}
        />
      </div>
    </div>
  );
}

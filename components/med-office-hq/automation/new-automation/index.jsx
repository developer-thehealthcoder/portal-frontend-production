"use client";
import { Stepper } from "./stepper";
import React, { useState, useEffect } from "react";
import SelectEncounters from "./stepper/select-encounters";
import Process from "./stepper/process";
import { SelectRange } from "./stepper/select-range";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { atom, useAtom } from "jotai";
import axiosInstance from "@/lib/foundation-kit/axiosInstance";
import SelectRules from "./stepper/select-rules";
import { useRouter } from "next/navigation";

const rangeFormSchema = z.object({
  project_name: z.string().min(1, {
    message: "Project name is required.",
  }),
  project_id: z.string().optional(), // Readable project ID (e.g., 10000001)
  date_range: z.object({
    from: z.date(),
    to: z.date(),
  }),
});

export const newAutomationRangeAtom = atom();

const NewAutomation = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRange, setSelectedRange] = useAtom(newAutomationRangeAtom);
  const [selectedEncounters, setSelectedEncounters] = useState([]);
  const [totalEncounterRows, setTotalEncounterRows] = useState(0);
  const [selectedRules, setSelectedRules] = useState([]);
  const [totalRuleRows, setTotalRuleRows] = useState(0);
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [executionId, setExecutionId] = useState(null);

  // Generate readable project ID (sequential, starting from 10000001)
  const generateProjectId = async () => {
    try {
      // Fetch existing runs to find the highest project ID
      const { data: runs } = await axiosInstance.get("/rules/runs", {
        timeout: 60000,
      });
      
      // Find the highest numeric project ID that starts with 1 and is 8 digits
      let maxId = 10000000; // Start from 10000000, so first ID will be 10000001
      
      if (runs && Array.isArray(runs)) {
        runs.forEach((run) => {
          const id = run.id;
          // Check if it's a numeric ID starting with 1 and is 8 digits
          if (typeof id === "number" && id >= 10000001 && id <= 19999999) {
            maxId = Math.max(maxId, id);
          } else if (typeof id === "string") {
            const numId = parseInt(id, 10);
            if (!isNaN(numId) && numId >= 10000001 && numId <= 19999999) {
              maxId = Math.max(maxId, numId);
            }
          }
        });
      }
      
      // Generate next ID
      const nextId = (maxId + 1).toString();
      return nextId;
    } catch (error) {
      console.error("Error fetching runs for ID generation:", error);
      // Fallback: use timestamp-based ID or localStorage
      const storedId = localStorage.getItem("lastProjectId");
      if (storedId) {
        const nextId = (parseInt(storedId, 10) + 1).toString();
        localStorage.setItem("lastProjectId", nextId);
        return nextId;
      }
      // Start from 10000001 if no stored ID
      localStorage.setItem("lastProjectId", "10000001");
      return "10000001";
    }
  };

  const rangeForm = useForm({
    resolver: zodResolver(rangeFormSchema),
    defaultValues: {
      project_name: "",
      project_id: "",
      date_range: {
        from: new Date(),
        to: new Date(),
      },
    },
  });

  // Generate project ID when form is initialized
  useEffect(() => {
    const initProjectId = async () => {
      const projectId = await generateProjectId();
      rangeForm.setValue("project_id", projectId);
      // Store in localStorage for fallback
      localStorage.setItem("lastProjectId", projectId);
    };
    initProjectId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Format date to MM/DD/YYYY for API
  const formatDateForAPI = (dateString) => {
    if (!dateString) return "";
    // If already in MM/DD/YYYY format, return as is
    if (typeof dateString === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return dateString;
    }
    // Otherwise, parse and format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Format patient data for API (ensure dates are in MM/DD/YYYY format)
  const formatPatientsForAPI = (patients) => {
    return patients.map((patient) => ({
      appointmentid: String(patient.appointmentid || patient.appointment_id || ""),
      appointmentdate: formatDateForAPI(patient.appointmentdate || patient.appointment_date),
      patientid: String(patient.patientid || patient.patient_id || ""),
      firstname: patient.firstname || patient.first_name || "",
      lastname: patient.lastname || patient.last_name || "",
      dob: formatDateForAPI(patient.dob || ""), // Optional field
    }));
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      rangeForm.handleSubmit((data) => {
        setSelectedRange(data);
        setCurrentStep(currentStep + 1);
      })();
    } else if (currentStep === 1) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 2) {
      // Advance to process step first
      setCurrentStep(currentStep + 1);
      console.log("selectedEncounters", selectedEncounters);
      console.log("selectedRules", selectedRules);
      console.log("selectedRange", selectedRange);
      
      // Reset results and start processing
      setResults([]);
      setExecutionId(null);
      setIsProcessing(true);
      setProcessingError(null);
      
      try {
        // Format patients data to ensure correct format for API
        const formattedPatients = formatPatientsForAPI(selectedEncounters);
        
        const { data } = await axiosInstance.post(
          "/rules/run",
          {
          project_name: selectedRange.project_name,
            project_id: selectedRange.project_id, // Send readable project ID if backend accepts it
          add_modifiers: true,
          is_rollback: false,
            patients: formattedPatients,
          rules: selectedRules.map((rule) => rule.rule_number),
          },
          {
            timeout: 180000, // 3 minutes for large patient lists
          }
        );

        console.log("API Response (non-blocking):", data);
        
        // Backend now returns immediately with execution_id and empty results
        // Results will be fetched later via /api/rules/results/{execution_id}
        if (data?.execution_id) {
          console.log("Got execution_id (non-blocking):", data.execution_id);
          setExecutionId(data.execution_id);
          // Keep isProcessing = true - polling will handle progress and completion
          // Results will be empty initially - polling will fetch them when complete
        } else {
          console.error("No execution_id in response - backend may not support non-blocking execution");
          setProcessingError("Failed to start execution. Please try again.");
          setIsProcessing(false);
          setCurrentStep(currentStep - 1);
        }
        
        // Note: Results will be fetched by polling when status === "completed"
      } catch (error) {
        console.error("Error running rules:", error);
        setProcessingError(
          error.code === "ECONNABORTED" || error.message?.includes("timeout")
            ? "Processing is taking longer than expected. The backend is handling a large number of patients. Please wait or try with fewer patients."
            : error.response?.data?.detail ||
                "Failed to process rules. Please try again."
        );
        // Don't advance to next step on error
        setCurrentStep(currentStep - 1);
        setIsProcessing(false);
      }
    } else if (currentStep === 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleEncounterSelection = (encounters, totalRows) => {
    setSelectedEncounters(encounters);
    setTotalEncounterRows(totalRows);
  };

  const handleRuleSelection = (rules, totalRows) => {
    setSelectedRules(rules);
    setTotalRuleRows(totalRows);
  };

  const handleFinish = async () => {
    console.log("selectedRange", selectedRange);
    console.log("selectedEncounters", selectedEncounters);
    console.log("selectedRules", selectedRules);
    // try {
    //   const response = await axiosInstance.post("/rules/run", {
    //     project_name: selectedRange.project_name,
    //     date_range: selectedRange.date_range,
    //     encounters: selectedEncounters,
    //     rules: selectedRules,
    //   });
    // } catch (error) {
    //   console.error(error);
    // }
  };

  const rangeValue = selectedRange
    ? `${format(selectedRange?.date_range?.from, "PPP")} - ${format(
        selectedRange?.date_range?.to,
        "PPP"
      )}`
    : "";

  const encounterValue = selectedEncounters?.length
    ? `${selectedEncounters?.length}/${totalEncounterRows} encounters`
    : "";

  const ruleValue = selectedRules?.length
    ? `${selectedRules?.length}/${totalRuleRows} rules`
    : "";

  const steps = [
    {
      title: "1",
      description: "Select Range",
      value: rangeValue,
      component: <SelectRange form={rangeForm} />,
    },
    {
      title: "2",
      description: "Select Encounters",
      value: encounterValue,
      component: (
        <SelectEncounters
          onSelectionChange={handleEncounterSelection}
          selectedRows={selectedEncounters}
        />
      ),
    },
    {
      title: "3",
      description: "Select Rules",
      value: ruleValue,
      component: (
        <SelectRules
          onSelectionChange={handleRuleSelection}
          selectedRows={selectedRules}
        />
      ),
    },
    {
      title: "4",
      description: "Process",
      value: "",
        component: (
        <Process
          results={results}
          isProcessing={isProcessing}
          error={processingError}
          patientCount={selectedEncounters?.length || 0}
          selectedRules={selectedRules}
          executionId={executionId}
          onAllRulesCompleted={(completionData) => {
            // This callback is called when polling detects all rules are completed
            // completionData includes progress info and final results
            console.log("All rules completed callback called", completionData);
            
            // Set results from the completion data (fetched from /api/rules/results/{execution_id})
            if (completionData?.results) {
              setResults(completionData.results);
            }
            
            // Set processing to false to show completion state
            setIsProcessing(false);
            
            // Wait a moment to show completion, then navigate and clear state
            setTimeout(() => {
              // Navigate FIRST, then clear state (to prevent re-fetching)
              router.push("/run");
              
              // Clear all selections AFTER navigation to prevent re-fetching
              // Use a small delay to ensure navigation happens first
              setTimeout(() => {
                setSelectedEncounters([]);
                setSelectedRules([]);
                setTotalEncounterRows(0);
                setTotalRuleRows(0);
                setResults([]);
                setExecutionId(null);
                // Clear selectedRange LAST to prevent SelectEncounters from re-fetching
                setSelectedRange(null);
              }, 100);
            }, 2000); // 2 second delay to show completion
          }}
        />
      ),
    },
  ];

  return (
    <div className="w-full h-full p-4 space-y-4">
      <h1 className="text-2xl font-semibold">New Automation</h1>
      <Stepper
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onNext={handleNext}
        onFinish={handleFinish}
        hideNextButton={
          // Hide NEXT button on Process step (step 3) when:
          // 1. Processing is complete (!isProcessing), OR
          // 2. Currently processing (isProcessing) - button is disabled anyway
          currentStep === 3
        }
      >
        <div className="mt-8 p-4 border rounded-md">
          <h2 className="text-lg font-semibold mb-2">
            {steps[currentStep].component}
          </h2>
        </div>
      </Stepper>
    </div>
  );
};

export default NewAutomation;

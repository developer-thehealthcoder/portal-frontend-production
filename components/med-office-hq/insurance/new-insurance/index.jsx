"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Stepper } from "./stepper";
import Process from "./stepper/process";
import SelectAppointments from "./stepper/select-appointments";
import { SelectRange } from "./stepper/select-range";
import { atom, useAtom } from "jotai";

const rangeFormSchema = z.object({
  project_name: z.string().min(1, {
    message: "Project name is required.",
  }),
  date_range: z.object({
    from: z.date(),
    to: z.date(),
  }),
});

export const newInsuranceRangeAtom = atom();

export default function NewInsurance() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRange, setSelectedRange] = useAtom(newInsuranceRangeAtom);
  const [selectedEncounters, setSelectedEncounters] = useState([]);
  const [totalEncounterRows, setTotalEncounterRows] = useState(0);
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [totalAppointmentRows, setTotalAppointmentRows] = useState(0);

  const rangeForm = useForm({
    resolver: zodResolver(rangeFormSchema),
    defaultValues: {
      project_name: "",
      date_range: {
        from: new Date(),
        to: new Date(),
      },
    },
  });

  const handleNext = () => {
    if (currentStep === 0) {
      rangeForm.handleSubmit((data) => {
        setSelectedRange(data);
        setCurrentStep(currentStep + 1);
      })();
    } else if (currentStep === 1) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 2) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleEncounterSelection = (encounters, totalRows) => {
    setSelectedEncounters(encounters);
    setTotalEncounterRows(totalRows);
  };

  const handleAppointmentSelection = (appointments, totalRows) => {
    setSelectedAppointments(appointments);
    setTotalAppointmentRows(totalRows);
  };

  const handleFinish = () => {
    console.log("Finish");
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

  const appointmentValue = selectedAppointments?.length
    ? `${selectedAppointments?.length}/${totalAppointmentRows} appointments`
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
      description: "Select Appointments",
      value: appointmentValue,
      component: (
        <SelectAppointments
          onSelectionChange={handleAppointmentSelection}
          selectedRows={selectedAppointments}
        />
      ),
    },
    {
      title: "3",
      description: "Process",
      value: "",
      component: <Process />,
    },
  ];

  return (
    <div className="w-full h-full p-4 space-y-4">
      <h1 className="text-2xl font-semibold">New Insurance</h1>
      <Stepper
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onNext={handleNext}
        onFinish={handleFinish}
      >
        <div className="mt-8 p-4 border rounded-md">
          <h2 className="text-lg font-semibold mb-2">
            {steps[currentStep].component}
          </h2>
        </div>
      </Stepper>
    </div>
  );
}

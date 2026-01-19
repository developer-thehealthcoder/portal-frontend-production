"use client";

import * as React from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

const Step = ({ title, description, isCompleted, isActive, value }) => {
  return (
    <div className="flex items-center">
      <div className="relative flex items-center justify-center">
        <div
          className={cn(
            "w-8 h-8 rounded-full border-2 flex items-center justify-center",
            isCompleted
              ? "border-primary bg-primary text-primary-foreground"
              : isActive
              ? "border-primary"
              : "border-muted"
          )}
        >
          {isCompleted ? (
            <Check className="w-4 h-4" />
          ) : (
            <span className="text-sm font-medium">{title}</span>
          )}
        </div>
      </div>
      <div className="ml-4">
        {/* <p
          className={cn(
            "text-sm font-medium",
            isActive || isCompleted
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          {title}
        </p> */}
        {description && (
          <div className="text-sm font-semibold text-muted-foreground">
            {description}
          </div>
        )}
        {value && <div className="text-sm text-muted-foreground">{value}</div>}
      </div>
    </div>
  );
};

export function Stepper({
  steps,
  currentStep,
  onStepChange,
  children,
  onNext,
  onFinish,
  hideNextButton = false, // Option to hide NEXT button (e.g., when processing is complete)
}) {
  const { state } = useSidebar();

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.title}>
            <Step
              title={step.title}
              description={step.description}
              value={step.value}
              isCompleted={index < currentStep}
              isActive={index === currentStep}
            />
            {index < steps.length - 1 && (
              <ChevronRight className="hidden md:block text-muted-foreground" />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="mb-16">{children}</div>
      <div
        className="flex justify-between items-center fixed bottom-0 left-0 right-0 bg-sidebar h-[60px] px-4"
        style={{
          left: state === "expanded" ? "256px" : "0",
        }}
      >
        <div className="flex gap-2">
          <Button
            className={"cursor-pointer"}
            variant="outline"
            onClick={() => onStepChange(currentStep - 1)}
            disabled={currentStep === 0}
          >
            <ChevronLeft />
            Previous
          </Button>
        </div>
        <div className="flex gap-2">
          {!hideNextButton && (
            <Button
              className={"cursor-pointer"}
              onClick={onNext}
              disabled={steps.length - 1 === currentStep}
            >
              {steps.length - 2 === currentStep ? "Process" : "Next"}
              <ChevronRight />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

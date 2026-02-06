"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface StepperContextType {
  currentStep: number;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  isFirstStep: boolean;
}

const StepperContext = createContext<StepperContextType | null>(null);

export function useStepper() {
  const context = useContext(StepperContext);
  if (!context) {
    throw new Error("useStepper deve ser usado dentro de um componente Stepper");
  }
  return context;
}

export function Stepper({ children, initialStep = 0, className }: { children: ReactNode; initialStep?: number; className?: string }) {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => Math.max(0, prev - 1));
  const goToStep = (step: number) => setCurrentStep(step);

  return (
    <StepperContext.Provider value={{ currentStep, nextStep, prevStep, goToStep, isFirstStep: currentStep === 0 }}>
      <div className={className}>{children}</div>
    </StepperContext.Provider>
  );
}

export function Step({ step, children }: { step: number; children: ReactNode }) {
  const { currentStep } = useStepper();
  if (currentStep !== step) return null;
  return <>{children}</>;
}
"use client";

import { PlusIcon } from "lucide-react";
import InstitutionTable from "./institution-table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { InstitutionDialog } from "./institution-dialog";

export function InstitutionsPage() {
  const [addInstitutionOpen, setAddInstitutionOpen] = useState(false);
  return (
    <>
      <div className="w-full p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">List of Institutions</h1>
          <Button onClick={() => setAddInstitutionOpen(true)}>
            <PlusIcon />
            Add Institution
          </Button>
        </div>
        <InstitutionTable />
      </div>
      <InstitutionDialog
        mode="add"
        open={addInstitutionOpen}
        setOpen={setAddInstitutionOpen}
      />
    </>
  );
}

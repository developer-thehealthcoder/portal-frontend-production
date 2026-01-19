"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import UserDialog from "./UserDialog";
import UserTable from "./user-table";

export function UsersPage() {
  const [addUserOpen, setAddUserOpen] = useState(false);

  return (
    <>
      <div className="w-full p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">List of Users</h1>
          <Button onClick={() => setAddUserOpen(true)}>
            <PlusIcon />
            Add User
          </Button>
        </div>
        <UserTable />
      </div>
      <UserDialog mode="add" open={addUserOpen} setOpen={setAddUserOpen} />
    </>
  );
}

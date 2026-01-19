"use client";

import UserGroupTable from "./user-group-table";

export function UserGroupsPage() {
  return (
    <>
      <div className="w-full p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">List of User Groups</h1>
          {/* <                                                                                                                                                   onClick={() => setAddUserOpen(true)}>
            <PlusIcon />
            Add User
          </> */}
        </div>
        <UserGroupTable />
      </div>
    </>
  );
}

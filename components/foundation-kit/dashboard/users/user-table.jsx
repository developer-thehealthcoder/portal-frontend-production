"use client";

import { useAtom, useSetAtom } from "jotai";
import { ArrowUpDown, Edit2Icon, Trash2, UserLock } from "lucide-react";
import { useEffect, useState } from "react";

import { ConfirmationDialog } from "@/components/foundation-kit/dialogs/AlertDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import UserDialog from "./UserDialog";

import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usersAtom } from "@/lib/foundation-kit/atoms";
import axiosInstance from "@/lib/foundation-kit/axiosInstance";
import { formatDateTime } from "@/utils/dateTimeFormat";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Spinner from "@/components/common/loader/Spinner";
import { AdminResetPassDialog } from "./AdminResetPassDialog";
import { useUserGroups } from "../user-groups/user-group-table";

function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/auth/users");
      return data;
    },
  });
}

export const columns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "first_name",
    header: "First Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("first_name")}</div>
    ),
  },
  {
    accessorKey: "last_name",
    header: "Last Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("last_name")}</div>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "last_login",
    header: "Last Login",
    cell: ({ row }) => (
      <div className="capitalize">
        {formatDateTime(row.getValue("last_login"))}
      </div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const [isDeleteOpen, setIsDeleteOpen] = useState(false);
      const [isEditOpen, setIsEditOpen] = useState(false);
      const [isAdminPassChange, setAdminPassChange] = useState(false);
      const { data: userGroups } = useUserGroups();
      const isSystemAdmin = userGroups?.find(
        (userGroup) => userGroup.tag === "SystemAdmin"
      );

      const queryClient = useQueryClient();

      const handleDeleteUser = async () => {
        try {
          await axiosInstance.delete(`/auth/users/${row.original.id}`);
          queryClient.invalidateQueries({
            queryKey: ["users"],
            refetchType: "active",
          });
          toast.success("User deleted successfully");
        } catch (error) {
          toast.error(`Error deleting user: ${error.response.data.detail}`);
        }
      };

      return (
        <>
          <div className="flex items-center gap-2">
            <button
              title="Edit User"
              onClick={() => {
                setIsEditOpen(true);
              }}
              className="cursor-pointer"
            >
              <Edit2Icon color="#4299e1" className="w-5 h-5" />
            </button>
            <button
              title="Delete User"
              onClick={() => {
                setIsDeleteOpen(true);
              }}
              className="cursor-pointer"
            >
              <Trash2 color="red" className="w-5 h-5" />
            </button>
            {isSystemAdmin && (
              <button
                title="Reset Password"
                onClick={() => {
                  setAdminPassChange(true);
                }}
                className="cursor-pointer"
              >
                <UserLock color="#4299e1" className="w-5 h-5" />
              </button>
            )}
          </div>
          <ConfirmationDialog
            title="Delete User"
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            description="Are you sure you want to delete this user?"
            onConfirm={handleDeleteUser}
          />
          <UserDialog
            mode="edit"
            open={isEditOpen}
            setOpen={setIsEditOpen}
            userData={row.original}
          />
          <AdminResetPassDialog
            open={isAdminPassChange}
            setOpen={setAdminPassChange}
            userData={row.original}
          />
        </>
      );
    },
  },
];

const UserTable = () => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const { data: users = [], isLoading } = useUsers();

  const table = useReactTable({
    data: users,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });
  return (
    <div>
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <Spinner />
        </div>
      ) : (
        <div>
          <div className="flex items-center py-4">
            <Input
              placeholder="Filter emails..."
              value={table.getColumn("email")?.getFilterValue() ?? ""}
              onChange={(event) =>
                table.getColumn("email")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;

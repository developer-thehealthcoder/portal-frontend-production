import { Button } from "@/components/ui/button";
import Combobox from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import axiosInstance from "@/lib/foundation-kit/axiosInstance";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  user_groups: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .optional()
    .default([]),
});

function useUsersGroups() {
  return useQuery({
    queryKey: ["user-groups"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/dashboard/user-groups/");
      return data;
    },
  });
}

export function InstitutionDialog({
  mode,
  open,
  setOpen,
  institutionData = null,
}) {
  const { data: userGroups } = useUsersGroups();
  const queryClient = useQueryClient();

  const selectedUserGroups = userGroups
    ?.filter((userGroup) => institutionData?.user_groups.includes(userGroup.id))
    .map((userGroup) => ({
      value: userGroup.id,
      label: userGroup.name,
    }));

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues:
      mode === "add"
        ? {
            name: "",
            description: "",
            user_groups: [],
          }
        : {
            name: institutionData?.name || "",
            description: institutionData?.description || "",
            user_groups: selectedUserGroups,
          },
  });

  useEffect(() => {
    form.reset(
      mode === "add"
        ? { name: "", description: "", user_groups: [] }
        : {
            name: institutionData?.name || "",
            description: institutionData?.description || "",
            user_groups: selectedUserGroups,
          }
    );
  }, [open]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      user_groups: values.user_groups.map((group) => group.value),
    };

    try {
      if (mode === "add") {
        await axiosInstance.post("/dashboard/institutions/", payload);
      } else {
        await axiosInstance.patch(
          `/dashboard/institutions/${institutionData.id}`,
          payload
        );
      }
      setOpen(false);
      form.reset();
      toast.success(
        mode === "add"
          ? "Institution created successfully"
          : "Institution updated successfully"
      );

      queryClient.invalidateQueries({
        queryKey: ["institutions"],
        refetchType: "active",
      });
    } catch (error) {
      toast.error(
        mode === "add"
          ? `Error creating institution: ${error?.response?.data?.detail}`
          : `Error updating institution: ${error?.response?.data?.detail}`
      );
    }
  };

  const options = userGroups?.map((userGroup) => ({
    value: userGroup.id,
    label: userGroup.name,
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {institutionData ? "Edit Institution" : "Create Institution"}
          </DialogTitle>
          <DialogDescription>
            Create a new institution to manage your users and groups.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 w-full"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Institution Name"
                      className="bg-white"
                      type="text"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Description"
                      className="bg-white"
                      type="text"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="user_groups"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Groups</FormLabel>
                  <FormControl>
                    <Combobox
                      options={options}
                      selected={field.value}
                      setSelected={field.onChange}
                      placeholder="User Groups"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className="bg-blue-500 hover:bg-blue-600 cursor-pointer"
              type="submit"
            >
              {institutionData ? "Update Institution" : "Create Institution"}
            </Button>
            {/* <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
            </DialogFooter> */}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { CalendarIcon } from "lucide-react";

export function SelectRange({ form }) {
  return (
    <Form {...form}>
      <form className="space-y-8 max-w-md mx-auto h-[calc(100vh-320px)] flex flex-col justify-center">
        <FormField
          control={form.control}
          name="project_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="Project Name" {...field} />
              </FormControl>
              <FormDescription>This is your project name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date_range"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date Range</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value.from, "PPP") +
                        " - " +
                        format(field.value.to, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex gap-4">
                    <div className="flex flex-col flex-wrap gap-2 p-2">
                      {[
                        { label: "Today", value: 0 },
                        { label: "Last 7 days", value: 7 },
                        { label: "Last 30 days", value: 30 },
                        { label: "Last 3 months", value: 90 },
                        { label: "Last 6 months", value: 180 },
                        { label: "Year to date", value: 365 },
                      ].map((preset) => (
                        <Button
                          key={preset.value}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            // const newDate = addDays(new Date(), preset.value);
                            const newDate = new Date();
                            field.onChange({
                              from: subDays(newDate, preset.value),
                              to: newDate,
                            });
                          }}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                    <div className="h-[350px]"> {/* Fixed height to prevent resizing when switching months */}
                      <Calendar
                        mode="range"
                        defaultMonth={field.value?.from}
                        selected={field.value}
                        onSelect={field.onChange}
                        numberOfMonths={2}
                        className="rounded-lg border shadow-sm"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <FormDescription>
                Your date range is used to filter the data.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

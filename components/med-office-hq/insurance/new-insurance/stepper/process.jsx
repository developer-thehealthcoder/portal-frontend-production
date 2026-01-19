"use client";

import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  colorSchemeDarkBlue,
  themeBalham,
} from "ag-grid-community";
import { useTheme } from "next-themes";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, FileWarning } from "lucide-react";
import { formatDate } from "@/utils/dateTimeFormat";
import { DetailRenderer } from "./results-detail-renderer";
import IconHeader, { CustomInnerHeader } from "./custom-header";

ModuleRegistry.registerModules([AllCommunityModule]);

const themeLight = themeBalham;
const themeDarkBlue = themeBalham.withPart(colorSchemeDarkBlue);

export default function Process() {
  const [progress, setProgress] = useState(13);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [rowData, setRowData] = useState([
    {
      appointment_id: "101",
      appointment_date: "2025-01-01",
      patient_id: "1001",
      first_name: "John",
      last_name: "Doe",
      dob: "1990-01-01",
      isExpanded: false,
      failure: 1,
      warning: 1,
      information: 1,
      success: 1,
      details: [
        {
          automation_id: "10001",
          status: "Condition Met No Change",
          notification: "26 already exists",
        },
        {
          automation_id: "10002",
          status: "Condition Met No Change",
          notification: "26 already exists",
        },
        {
          automation_id: "10003",
          status: "Condition Met No Change",
          notification: "26 already exists",
        },
        {
          automation_id: "10004",
          status: "Condition Met No Change",
          notification: "26 already exists",
        },
        {
          automation_id: "10005",
          status: "Condition Met No Change",
          notification: "26 already exists",
        },
        {
          automation_id: "10006",
          status: "Condition Met No Change",
          notification: "26 already exists",
        },
        {
          automation_id: "10007",
          status: "Condition Met No Change",
          notification: "26 already exists",
        },
        {
          automation_id: "10008",
          status: "Condition Met No Change",
          notification: "26 already exists",
        },
      ],
    },
    {
      appointment_id: "102",
      appointment_date: "2025-01-02",
      patient_id: "1002",
      first_name: "Jane",
      last_name: "Smith",
      dob: "1995-05-15",
      isExpanded: false,
      failure: 1,
      warning: 1,
      information: 1,
      success: 1,
      details: [
        {
          automation_id: "10003",
          status: "Condition Met No Change",
          notification: "26 already exists",
        },
        {
          automation_id: "10004",
          status: "Condition Met No Change",
          notification: "26 already exists",
        },
        {
          automation_id: "10005",
          status: "Condition Met No Change",
          notification: "26 already exists",
        },
      ],
    },
    {
      appointment_id: "103",
      appointment_date: "2025-01-03",
      patient_id: "1003",
      first_name: "Jim",
      last_name: "Beam",
      dob: "1990-01-01",
      isExpanded: false,
      failure: 1,
      warning: 1,
      information: 1,
      success: 1,
      details: [
        {
          automation_id: "10005",
          status: "Condition Met No Change",
          notification: "26 already exists",
        },
        {
          automation_id: "10006",
          status: "Condition Met No Change",
          notification: "26 already exists",
        },
        {
          automation_id: "10007",
          status: "Condition Met No Change",
          notification: "26 already exists",
        },
      ],
    },
    {
      appointment_id: "104",
      appointment_date: "2025-01-04",
      patient_id: "1004",
      first_name: "Jill",
      last_name: "Baker",
      dob: "1990-01-01",
      isExpanded: false,
      failure: 1,
      warning: 1,
      information: 1,
      success: 1,
      details: [
        {
          automation_id: "10007",
          status: "Condition Met No Change",
          notification: "26 already exists",
        },
        {
          automation_id: "10008",
          status: "Condition Met No Change",
          notification: "26 already exists",
        },
      ],
    },
  ]);

  useEffect(() => setMounted(true), []);

  const currentTheme =
    mounted && theme === "system" ? resolvedTheme : theme || "light";

  const toggleExpand = (row) => {
    const newData = [];

    for (let i = 0; i < rowData.length; i++) {
      const current = rowData[i];

      if (current.appointment_id === row.appointment_id) {
        current.isExpanded = !current.isExpanded;
        newData.push(current);
        if (current.isExpanded) {
          newData.push({
            isDetail: true,
            parentId: current.appointment_id,
            detail: current.details,
          });
        } else if (
          i + 1 < rowData.length &&
          rowData[i + 1].isDetail &&
          rowData[i + 1].parentId === current.appointment_id
        ) {
          i++; // skip detail row
        }
      } else {
        newData.push(current);
      }
    }

    setRowData(newData);
  };

  const columnDefs = [
    {
      headerName: "",
      field: "expand",
      maxWidth: 50,
      cellRenderer: (params) => {
        if (params.data.isDetail) return "";
        return (
          <button
            // onClick={() => toggleExpand(params.data)}
            className="cursor-pointer"
          >
            {params.data.isExpanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
        );
      },
    },
    {
      field: "failure",
      headerComponent: IconHeader,
      sortable: true,
      maxWidth: 50,
    },
    {
      field: "warning",
      headerComponent: IconHeader,
      sortable: true,
      maxWidth: 50,
    },
    {
      field: "information",
      headerComponent: IconHeader,
      sortable: true,
      maxWidth: 50,
    },
    {
      field: "success",
      headerComponent: IconHeader,
      sortable: true,
      maxWidth: 50,
    },
    {
      headerName: "Appointment ID",
      field: "appointment_id",
      maxWidth: 200,
      filter: true,
    },
    {
      headerName: "Appointment Date",
      field: "appointment_date",
      cellRenderer: (params) => formatDate(params.data.appointment_date),
      maxWidth: 180,
      filter: true,
    },
    {
      headerName: "Patient ID",
      field: "patient_id",
      maxWidth: 150,
      filter: true,
    },
    {
      headerName: "First Name",
      field: "first_name",
      maxWidth: 150,
      filter: true,
    },
    {
      headerName: "Last Name",
      field: "last_name",
      maxWidth: 150,
      filter: true,
    },
    {
      headerName: "DOB",
      field: "dob",
      cellRenderer: (params) => formatDate(params.data.dob),
      maxWidth: 150,
      filter: true,
    },
  ];

  const getRowStyle = (params) => {
    if (params.data?.isDetail) {
      return { backgroundColor: "#f9f9f9" };
    }
    return {};
  };

  useEffect(() => {
    const timer = setTimeout(() => setProgress(100), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (progress !== 100) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-275px)] gap-4">
        <Progress value={progress} className="w-[80%]" />
        <div className="text-sm text-muted-foreground">{progress}%</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-full gap-4">
      <div className="w-full h-full">
        <AgGridReact
          key={currentTheme}
          theme={currentTheme === "dark" ? themeDarkBlue : themeLight}
          rowData={rowData}
          columnDefs={columnDefs}
          pagination
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          getRowStyle={getRowStyle}
          domLayout="autoHeight"
          onRowClicked={(params) => {
            toggleExpand(params.data);
          }}
          isFullWidthRow={(params) => params.rowNode?.data?.isDetail}
          fullWidthCellRenderer={(params) => (
            <DetailRenderer
              data={params.data}
              node={params.node}
              api={params.api}
            />
          )}
          headerComponentParams={{
            innerHeaderComponent: CustomInnerHeader,
          }}
        />
      </div>
    </div>
  );
}

"use client";
import axiosInstance from "@/lib/foundation-kit/axiosInstance";
import { formatDate } from "@/utils/dateTimeFormat";
import {
  AllCommunityModule,
  ModuleRegistry,
  colorSchemeDarkBlue,
  themeBalham,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

ModuleRegistry.registerModules([AllCommunityModule]);

const themeLight = themeBalham;
const themeDarkBlue = themeBalham.withPart(colorSchemeDarkBlue);

export default function Rules() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [rowData, setRowData] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const { data } = await axiosInstance.get(`/rules/list`, {
          timeout: 60000, // 1 minute timeout
        });
        setRowData(data?.rules || []);
      } catch (error) {
        console.error("Error fetching rules:", error);
        // Error handling is done by axios interceptor
      }
    };
    fetchRules();
  }, []);

  const currentTheme = mounted
    ? theme === "system"
      ? resolvedTheme
      : theme
    : "light";

  const [colDefs, setColDefs] = useState([
    {
      field: "edit",
      headerName: "",
      maxWidth: 100,
      filter: false,
      cellRenderer: (params) => {
        return (
          <div
            title="View Rule"
            onClick={() => {
              // open in a new tab
              // router.push(`/rules/${params.data.rule_id}`);
              window.open(`/rules/${params.data.rule_number}`, "_blank");
            }}
            className="flex justify-start items-center w-full h-full cursor-pointer"
          >
            {/* <Edit2Icon color="#4299e1" className="w-5 h-5" /> */}
            View
          </div>
        );
      },
    },
    // {
    //   field: "activate",
    //   headerName: "",
    //   maxWidth: 100,
    //   filter: false,
    //   cellRenderer: (params) => {
    //     return (
    //       <div
    //         title="Activate"
    //         onClick={() => {
    //           console.log(params.data);
    //         }}
    //         className="flex justify-start items-center w-full h-full cursor-pointer"
    //       >
    //         Activate
    //       </div>
    //     );
    //   },
    // },
    {
      field: "rule_number",
      headerName: "Rule Number",
      sortable: true,
      filter: true,
    },
    {
      field: "name",
      headerName: "Rule Name",
      sortable: true,
      filter: true,
    },
    {
      field: "description",
      headerName: "Description",
      sortable: true,
      filter: true,
    },
    // {
    //   field: "created_at",
    //   headerName: "Created At",
    //   sortable: true,
    //   filter: true,
    //   valueFormatter: (params) => {
    //     return formatDate(params.value);
    //   },
    // },
    // {
    //   field: "updated_at",
    //   headerName: "Updated At",
    //   sortable: true,
    //   filter: true,
    //   valueFormatter: (params) => {
    //     return formatDate(params.value);
    //   },
    // },
  ]);

  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true,
  };

  const gridOptions = {
    rowData: rowData,
    columnDefs: colDefs,
    defaultColDef: defaultColDef,
    pagination: true,
    paginationPageSize: 10,
    paginationPageSizeSelector: [10, 20, 50, 100],
    domLayout: "autoHeight",
    suppressRowHoverHighlight: false,
    rowSelection: "single",
    animateRows: true,
    theme: currentTheme === "dark" ? themeDarkBlue : themeLight,
  };

  if (!mounted) {
    return (
      <div className="w-full h-full p-4 flex items-center justify-center">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-32 rounded"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Rules</h1>
      </div>
      <AgGridReact {...gridOptions} key={currentTheme} />
    </div>
  );
}

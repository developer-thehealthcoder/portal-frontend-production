import { useEffect, useRef } from "react";
import { AgGridReact } from "ag-grid-react";

export const DetailRenderer = ({ data, node, api }) => {
  const lastHeightRef = useRef(0);

  const rowHeight = 30; // Your configured row height
  const headerHeight = 30;
  const padding = 20;

  useEffect(() => {
    // Estimate height based on number of detail rows
    const rowCount = data.detail?.length ?? 0;
    const calculatedHeight = headerHeight + rowCount * rowHeight + padding;

    if (lastHeightRef.current !== calculatedHeight) {
      lastHeightRef.current = calculatedHeight;
      node.setRowHeight(calculatedHeight);
      api.onRowHeightChanged();
    }
  }, [data.detail, node, api]);

  const childColumnDefs = [
    { headerName: "Rule Number", field: "rule_number", flex: 1 },
    { headerName: "Status", field: "status", flex: 2 },
    { headerName: "Reason", field: "reason", flex: 2 },
  ];

  return (
    <div className="ag-theme-alpine w-full h-full p-2">
      <AgGridReact
        rowData={data.detail}
        columnDefs={childColumnDefs}
        headerHeight={headerHeight}
        rowHeight={rowHeight}
        domLayout="autoHeight" // ← Don't use autoHeight
        // suppressHorizontalScroll
      />
    </div>
  );
};

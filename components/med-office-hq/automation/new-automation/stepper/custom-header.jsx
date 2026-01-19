import { CircleAlert, CircleCheck, CircleHelp, CircleX } from "lucide-react";

export default function IconHeader(props) {
  const { column, showColumnMenu, progressSort, enableMenu, enableSorting } =
    props;

  switch (column.colId) {
    case "status_3_condition_not_met":
      return <CircleAlert className="w-4 h-4" />;
    case "status_1_changes_made":
      return <CircleCheck className="w-4 h-4 text-green-500" />;
    case "status_4_errors":
      return <CircleX className="w-4 h-4 text-red-500" />;
    case "status_2_condition_met_no_changes":
      return <CircleHelp className="w-4 h-4 text-blue-500" />;
  }
  return (
    <div
      className="custom-header ag-header-cell-label"
      style={{ display: "flex", alignItems: "center" }}
    >
      {column.colId}
      {enableSorting && (
        <span
          className="ag-header-icon ag-sort-icon"
          onClick={() => progressSort(false)}
        />
      )}
      {enableMenu && (
        <span
          className="ag-header-icon ag-header-cell-menu-button"
          onClick={(e) => showColumnMenu(e.currentTarget)}
        />
      )}
    </div>
  );
}

export function CustomInnerHeader(props) {
  const { displayName } = props;
  return (
    <div className="customInnerHeader">
      <span>{displayName}</span>
    </div>
  );
}

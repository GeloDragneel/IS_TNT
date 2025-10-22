import React, { useState } from "react"; // ← Make sure useEffect is imported
import SalesOrderList from "./sub/SalesOrderList.tsx";
import SalesOrderDetails from "./sub/SalesOrderDetails.tsx";

interface SalesOrderProps {
    tabId: string;
}

type ViewType = "list" | "details";

const SalesOrder: React.FC<SalesOrderProps> = ({ tabId }) => {
    const [currentView, setCurrentView] = useState<ViewType>("list");
    const [selectedSOId, setSelectedSOID] = useState<number | null>(null);
    const [selectedSO, setselectedSO] = useState<number[]>([]);
    const [saveType, setSaveType] = useState<string>("edit");
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const handleSelectedSOChange = (selected: number[]) => {
        setselectedSO(selected);
    };
    const handleExpandedRowsChange = (expanded: number[]) => {
        setExpandedRows(expanded);
    };
    const handleSOSelect = (salesOrderId: number, type: string = "edit") => {
        setSelectedSOID(salesOrderId);
        setSaveType(type);
        setCurrentView("details");
    };
    const handleBackToList = () => {
        setCurrentView("list");
        setSelectedSOID(null);
    };
    const handleSave = () => {};
    return (
        <div className="h-full">
            {currentView === "list" && (
                <SalesOrderList
                    tabId={tabId + "-so-list"}
                    onSalesOrderSelect={handleSOSelect}
                    onChangeView={setCurrentView}
                    selectedSO={selectedSO}
                    onSelectedSOChange={handleSelectedSOChange}
                    expandedRows={expandedRows}
                    onExpandedRowsChange={handleExpandedRowsChange}
                />
            )}
            {currentView === "details" && selectedSOId !== null && selectedSOId !== undefined && (
                <SalesOrderDetails
                    salesOrderId={selectedSOId}
                    tabId={tabId + "-so-info"}
                    saveType={saveType}
                    onBack={handleBackToList}
                    onSave={handleSave}
                    onChangeSalesOrderId={(newId) => setSelectedSOID(newId)}
                    onChangeSaveType={(type) => setSaveType(type)}
                />
            )}
        </div>
    );
};

export default SalesOrder;

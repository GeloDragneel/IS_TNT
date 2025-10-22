import React, { useState } from "react"; // ← Make sure useEffect is imported
import OperatingExpenseList from "./sub/OperatingExpenseList.tsx";
import OperatingExpenseDetails from "./sub/OperatingExpenseDetail.tsx";

interface OperatingExpenseProps {
    tabId: string;
}

type ViewType = "list" | "details";

const OperatingExpense: React.FC<OperatingExpenseProps> = ({ tabId }) => {
    const [currentView, setCurrentView] = useState<ViewType>("list");
    const [selectOperatingExpenseID, setSelectedOEID] = useState<number | null>(null);
    const [selectedOE, setselectedOE] = useState<number[]>([]);
    const [saveType, setSaveType] = useState<string>("edit");
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const handleSelectedOEChange = (selected: number[]) => {
        setselectedOE(selected);
    };
    const handleExpandedRowsChange = (expanded: number[]) => {
        setExpandedRows(expanded);
    };
    const handleOESelect = (paymentVoucherId: number, type: string = "edit") => {
        setSelectedOEID(paymentVoucherId);
        setSaveType(type);
        setCurrentView("details");
    };
    const handleBackToList = () => {
        setCurrentView("list");
        setSelectedOEID(null);
    };
    const handleSave = () => {};
    return (
        <div className="h-full">
            {currentView === "list" && (
                <OperatingExpenseList
                    tabId={tabId + "-oe-list"}
                    onOperatingExpenseSelect={handleOESelect}
                    onChangeView={setCurrentView}
                    selectedOE={selectedOE}
                    onSelectedOEChange={handleSelectedOEChange}
                    expandedRows={expandedRows}
                    onExpandedRowsChange={handleExpandedRowsChange}
                />
            )}
            {currentView === "details" && selectOperatingExpenseID !== null && selectOperatingExpenseID !== undefined && (
                <OperatingExpenseDetails
                    paymentVoucherId={selectOperatingExpenseID}
                    saveType={saveType}
                    onBack={handleBackToList}
                    onSave={handleSave}
                    onChangeOperatingExpenseId={(newId) => setSelectedOEID(newId)}
                    onChangeSaveType={(type) => setSaveType(type)}
                />
            )}
        </div>
    );
};

export default OperatingExpense;

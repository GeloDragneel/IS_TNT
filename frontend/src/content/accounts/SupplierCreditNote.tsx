import React, { useState } from "react"; // ← Make sure useEffect is imported
import SupplierCreditNoteList from "./sub/SupplierCreditNoteList.tsx";
import SupplierCreditNoteDetails from "./sub/SupplierCreditNoteDetail.tsx";

interface SupplierCreditNoteProps {
    tabId: string;
}

type ViewType = "list" | "details";

const SupplierCreditNote: React.FC<SupplierCreditNoteProps> = ({ tabId }) => {
    const [currentView, setCurrentView] = useState<ViewType>("list");
    const [selectSupplierCreditNoteID, setSelectedCRID] = useState<number | null>(null);
    const [selectedCR, setselectedCR] = useState<number[]>([]);
    const [saveType, setSaveType] = useState<string>("edit");
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const handleSelectedCRChange = (selected: number[]) => {
        setselectedCR(selected);
    };
    const handleExpandedRowsChange = (expanded: number[]) => {
        setExpandedRows(expanded);
    };
    const handleCRSelect = (creditNoteId: number, type: string = "edit") => {
        setSelectedCRID(creditNoteId);
        setSaveType(type);
        setCurrentView("details");
    };
    const handleBackToList = () => {
        setCurrentView("list");
        setSelectedCRID(null);
    };
    const handleSave = () => {};
    return (
        <div className="h-full">
            {currentView === "list" && (
                <SupplierCreditNoteList
                    tabId={tabId + "-cr-list"}
                    onSupplierCreditNoteSelect={handleCRSelect}
                    onChangeView={setCurrentView}
                    selectedCR={selectedCR}
                    onSelectedCRChange={handleSelectedCRChange}
                    expandedRows={expandedRows}
                    onExpandedRowsChange={handleExpandedRowsChange}
                />
            )}
            {currentView === "details" && selectSupplierCreditNoteID !== null && selectSupplierCreditNoteID !== undefined && (
                <SupplierCreditNoteDetails
                    creditNoteId={selectSupplierCreditNoteID}
                    tabId={tabId + "-cr-info"}
                    saveType={saveType}
                    onBack={handleBackToList}
                    onSave={handleSave}
                    onChangeSupplierCreditNoteId={(newId) => setSelectedCRID(newId)}
                    onChangeSaveType={(type) => setSaveType(type)}
                />
            )}
        </div>
    );
};

export default SupplierCreditNote;

import React, { useState } from "react"; // ← Make sure useEffect is imported
import CustomerCreditNoteList from "./sub/CustomerCreditNoteList.tsx";
import CustomerCreditNoteDetails from "./sub/CustomerCreditNoteDetail.tsx";

interface CustomerCreditNoteProps {
    tabId: string;
}

type ViewType = "list" | "details";

const CustomerCreditNote: React.FC<CustomerCreditNoteProps> = ({ tabId }) => {
    const [currentView, setCurrentView] = useState<ViewType>("list");
    const [selectCustomerCreditNoteID, setSelectedCRID] = useState<number | null>(null);
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
                <CustomerCreditNoteList
                    tabId={tabId + "-rv-list"}
                    onCustomerCreditNoteSelect={handleCRSelect}
                    onChangeView={setCurrentView}
                    selectedCR={selectedCR}
                    onSelectedCRChange={handleSelectedCRChange}
                    expandedRows={expandedRows}
                    onExpandedRowsChange={handleExpandedRowsChange}
                />
            )}
            {currentView === "details" && selectCustomerCreditNoteID !== null && selectCustomerCreditNoteID !== undefined && (
                <CustomerCreditNoteDetails
                    creditNoteId={selectCustomerCreditNoteID}
                    tabId={tabId + "-rv-info"}
                    saveType={saveType}
                    onBack={handleBackToList}
                    onSave={handleSave}
                    onChangeCustomerCreditNoteId={(newId) => setSelectedCRID(newId)}
                    onChangeSaveType={(type) => setSaveType(type)}
                />
            )}
        </div>
    );
};

export default CustomerCreditNote;

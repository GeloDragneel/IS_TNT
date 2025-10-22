import React, { useState } from "react"; // ← Make sure useEffect is imported
import CustomerInvoiceList from "./sub/InvoicesList.tsx";
import CustomerInvoiceDetails from "./sub/InvoicesDetail.tsx";

interface CustomerInvoiceProps {
    tabId: string;
}

type ViewType = "list" | "details";

const CustomerInvoice: React.FC<CustomerInvoiceProps> = ({ tabId }) => {
    const [currentView, setCurrentView] = useState<ViewType>("list");
    const [selectInvoiceID, setSelectedInvoicesID] = useState<number | null>(null);
    const [selectedInv, setselectedInv] = useState<number[]>([]);
    const [saveType, setSaveType] = useState<string>("edit");
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const handleSelectedInvChange = (selected: number[]) => {
        setselectedInv(selected);
    };
    const handleExpandedRowsChange = (expanded: number[]) => {
        setExpandedRows(expanded);
    };
    const handleInvSelect = (customerInvoiceId: number, type: string = "edit") => {
        setSelectedInvoicesID(customerInvoiceId);
        setSaveType(type);
        setCurrentView("details");
    };
    const handleBackToList = () => {
        setCurrentView("list");
        setSelectedInvoicesID(null);
    };
    const handleSave = () => {};
    return (
        <div className="h-full">
            {currentView === "list" && (
                <CustomerInvoiceList
                    tabId={tabId + "-so-list"}
                    onCustomerInvoiceSelect={handleInvSelect}
                    onChangeView={setCurrentView}
                    selectedInv={selectedInv}
                    onSelectedInvChange={handleSelectedInvChange}
                    expandedRows={expandedRows}
                    onExpandedRowsChange={handleExpandedRowsChange}
                />
            )}
            {currentView === "details" && selectInvoiceID !== null && selectInvoiceID !== undefined && (
                <CustomerInvoiceDetails
                    customerInvoiceId={selectInvoiceID}
                    tabId={tabId + "-so-info"}
                    saveType={saveType}
                    onBack={handleBackToList}
                    onSave={handleSave}
                    onChangeCustomerInvoiceId={(newId) => setSelectedInvoicesID(newId)}
                    onChangeSaveType={(type) => setSaveType(type)}
                />
            )}
        </div>
    );
};

export default CustomerInvoice;

import React, { useState } from "react"; // ← Make sure useEffect is imported
import SupplierInvoiceList from "./sub/SupplierInvoiceList.tsx";
import SupplierInvoiceDetails from "./sub/SupplierInvoiceDetail.tsx";
import PaidItemNotReceived from "./sub/PaidItemNotReceived.tsx";
import UnpaidItemReceived from "./sub/UnpaidItemReceived.tsx";

interface SupplierInvoiceProps {
    tabId: string;
}

type ViewType = "list" | "details" | "paidItemNotReceived" | "unpaidItemReceived";

const SupplierInvoice: React.FC<SupplierInvoiceProps> = ({ tabId }) => {
    const [currentView, setCurrentView] = useState<ViewType>("list");
    const [selectedPOId, setSelectedPOId] = useState<number | null>(null);
    const [selectedSupplierInvoice, setselectedSupplierInvoice] = useState<number[]>([]);
    const [saveType, setSaveType] = useState<string>("edit");
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const handleselectedSupplierInvoiceChange = (selected: number[]) => {
        setselectedSupplierInvoice(selected);
    };
    const handleExpandedRowsChange = (expanded: number[]) => {
        setExpandedRows(expanded);
    };
    const handlePOSelect = (supplierInvoiceId: number, type: string = "edit") => {
        setSelectedPOId(supplierInvoiceId);
        setSaveType(type);
        setCurrentView("details");
    };
    const handleBackToList = () => {
        setCurrentView("list");
        setSelectedPOId(null);
    };
    const handleSave = () => {};
    return (
        <div className="h-full">
            {currentView === "list" && (
                <SupplierInvoiceList
                    tabId={tabId + "-supplierInvoice-list"}
                    onSupplierInvoiceSelect={handlePOSelect}
                    onChangeView={setCurrentView}
                    selectedSupplierInvoice={selectedSupplierInvoice}
                    onSelectedSupplierInvoiceChange={handleselectedSupplierInvoiceChange}
                    expandedRows={expandedRows}
                    onExpandedRowsChange={handleExpandedRowsChange}
                />
            )}
            {currentView === "details" && selectedPOId !== null && selectedPOId !== undefined && (
                <SupplierInvoiceDetails
                    supplierInvoiceId={selectedPOId}
                    tabId={tabId + "-supplierInvoice-info"}
                    saveType={saveType}
                    onBack={handleBackToList}
                    onSave={handleSave}
                    onChangeSupplierInvoiceId={(newId) => setSelectedPOId(newId)}
                    onChangeSaveType={(type) => setSaveType(type)}
                />
            )}
            {currentView === "paidItemNotReceived" && <PaidItemNotReceived tabId={tabId + "-paidItemNotReceived"} onChangeView={setCurrentView} />}
            {currentView === "unpaidItemReceived" && <UnpaidItemReceived tabId={tabId + "-unpaidItemReceived"} onChangeView={setCurrentView} />}
        </div>
    );
};

export default SupplierInvoice;

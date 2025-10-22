import React, { useState } from "react";
import SupplierList from "./sub/SupplierList";
import SupplierDetails from "./sub/SupplierDetails.tsx";

interface SupplierProps {
    tabId: string;
}

type ViewType = "list" | "details";

const Supplier: React.FC<SupplierProps> = ({ tabId }) => {
    const [currentView, setCurrentView] = useState<ViewType>("list");
    const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
    const [selectedSuppliers, setselectedSuppliers] = useState<number[]>([]);
    const [saveType, setSaveType] = useState<string>("edit");
    const [copySettings, setCopySettings] = useState<any>(null);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const handleSelectedSuppliersChange = (selected: number[]) => {
        setselectedSuppliers(selected);
    };

    const handleExpandedRowsChange = (expanded: number[]) => {
        setExpandedRows(expanded);
    };

    const handleSupplierSelect = (supplierId: number, type: string = "edit") => {
        setSelectedSupplierId(supplierId);
        setSaveType(type);
        setCurrentView("details");
        setCopySettings(null); // Ensure copy settings are cleared for normal edit
    };

    const handleInitiateCopy = (sourceSupplierId: number, settings: any) => {
        setCopySettings(settings);
        setSelectedSupplierId(sourceSupplierId);
        setSaveType("copy");
        setCurrentView("details");
    };

    const handleBackToList = () => {
        setCurrentView("list");
        setSelectedSupplierId(null);
    };
    const handleSave = () => {};

    return (
        <div className="h-full">
            {currentView === "list" && (
                <SupplierList
                    tabId={tabId + "-supplier-list"}
                    onSupplierSelect={handleSupplierSelect}
                    onChangeView={setCurrentView}
                    onInitiateCopy={handleInitiateCopy}
                    selectedSuppliers={selectedSuppliers}
                    onSelectedSuppliersChange={handleSelectedSuppliersChange}
                    expandedRows={expandedRows}
                    onExpandedRowsChange={handleExpandedRowsChange}
                />
            )}
            {currentView === "details" && selectedSupplierId !== null && selectedSupplierId !== undefined && (
                <SupplierDetails
                    supplierId={selectedSupplierId}
                    saveType={saveType}
                    onBack={handleBackToList}
                    tabId={tabId + "-supplier-details"}
                    onSave={handleSave}
                    onChangeSupplierId={(newId) => setSelectedSupplierId(newId)}
                    onChangeSaveType={(type) => setSaveType(type)}
                    copySettings={copySettings}
                />
            )}
        </div>
    );
};

export default Supplier;

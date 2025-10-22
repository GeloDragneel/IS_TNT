import React, { useState } from "react";
import PreorderList from "./sub/PreorderList";
import PreorderDetails from "./sub/PreorderDetails";
import UnsoldOrder from "./sub/UnsoldOrder";
import Performance from "./sub/Performance";

interface PreorderProps {
    tabId: string;
}

type ViewType = "list" | "details" | "unsold" | "performance";

const Preorder: React.FC<PreorderProps> = ({ tabId }) => {
    const [currentView, setCurrentView] = useState<ViewType>("list");
    const [selectedPreorderId, setSelectedPreorderId] = useState<number | null>(null);
    const [selectedPreorder, setSelectedPreorders] = useState<number[]>([]);
    const [saveType, setSaveType] = useState<string>("edit");
    const [copySettings, setCopySettings] = useState<any>(null);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const handleSelectedPreorderChange = (selected: number[]) => {
        setSelectedPreorders(selected);
    };

    const handleExpandedRowsChange = (expanded: number[]) => {
        setExpandedRows(expanded);
    };

    const handlePreorderSelect = (preorderId: number, type: string = "edit") => {
        setSelectedPreorderId(preorderId);
        setSaveType(type);
        setCurrentView("details");
        setCopySettings(null); // Ensure copy settings are cleared for normal edit
    };

    const handleInitiateCopy = (sourcePreorderId: number, settings: any) => {
        setCopySettings(settings);
        setSelectedPreorderId(sourcePreorderId);
        setSaveType("copy");
        setCurrentView("details");
    };

    const handleBackToList = () => {
        setCurrentView("list");
        setSelectedPreorderId(null);
    };

    const handleSave = () => {
        console.log("Saved");
    };

    return (
        <div className="h-full">
            {currentView === "list" ? (
                <PreorderList
                    tabId={tabId + "-preorder-list"}
                    onPreordertSelect={handlePreorderSelect}
                    onChangeView={setCurrentView}
                    onInitiateCopy={handleInitiateCopy}
                    selectedPreorder={selectedPreorder}
                    onselectedPreorderChange={handleSelectedPreorderChange}
                    expandedRows={expandedRows}
                    onExpandedRowsChange={handleExpandedRowsChange}
                />
            ) : currentView === "unsold" ? (
                <UnsoldOrder
                    tabId={tabId + "-unsold-order-list"}
                    onPreordertSelect={handlePreorderSelect}
                    onChangeView={setCurrentView}
                    onInitiateCopy={handleInitiateCopy}
                    selectedPreorder={selectedPreorder}
                    onselectedPreorderChange={handleSelectedPreorderChange}
                    expandedRows={expandedRows}
                    onExpandedRowsChange={handleExpandedRowsChange}
                />
            ) : currentView === "performance" ? (
                <Performance
                    tabId={tabId + "-performance-list"}
                    onPreordertSelect={handlePreorderSelect}
                    onChangeView={setCurrentView}
                    onInitiateCopy={handleInitiateCopy}
                    selectedPreorder={selectedPreorder}
                    onselectedPreorderChange={handleSelectedPreorderChange}
                    expandedRows={expandedRows}
                    onExpandedRowsChange={handleExpandedRowsChange}
                />
            ) : (
                <PreorderDetails
                    preorderId={selectedPreorderId!}
                    saveType={saveType}
                    onBack={handleBackToList}
                    onSave={handleSave}
                    tabId={tabId + "-preorder-info"}
                    onChangePreorderId={(newId) => setSelectedPreorderId(newId)}
                    onChangeSaveType={(type) => setSaveType(type)}
                    copySettings={copySettings}
                />
            )}
        </div>
    );
};

export default Preorder;

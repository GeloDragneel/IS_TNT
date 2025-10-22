import React, { useState } from "react";
import MassMailerList from "./sub/MassMailerList";
import MassMailerDetails from "./sub/MassMailerDetails";
import Settings from "./sub/Settings";
import Tags from "./sub/Tags";
import Template from "./sub/Template";

interface PreorderProps {
    tabId: string;
}

type ViewType = "list" | "details" | "settings" | "tags" | "template";

const Preorder: React.FC<PreorderProps> = ({ tabId }) => {
    const [currentView, setCurrentView] = useState<ViewType>("list");
    const [selectedMassId, setSelectedMassId] = useState<number | null>(null);
    const [selectedPreorder, setSelectedPreorders] = useState<number[]>([]);
    const [saveType, setSaveType] = useState<string>("edit");
    const [fromView, setFromView] = useState<string>("");

    const handleSelectedMassId = (selected: number[]) => {
        setSelectedPreorders(selected);
    };
    const handleMassSelect = (preorderId: number, type: string = "edit") => {
        setSelectedMassId(preorderId);
        setSaveType(type);
        setCurrentView("details");
    };

    const handleBackToList = () => {
        setCurrentView("list");
        setSelectedMassId(null);
    };

    const handleSave = () => {
        console.log("Saved");
    };

    const handleChangeView = (view: ViewType, from: string) => {
        setCurrentView(view);
        setFromView(from);
    };

    return (
        <div className="h-full">
            {currentView === "list" ? (
                <MassMailerList
                    tabId={tabId + "-mass-mailer-list"}
                    onPreordertSelect={handleMassSelect}
                    onChangeView={handleChangeView}
                    selectedPreorder={selectedPreorder}
                    onSelectedMassMailerChange={handleSelectedMassId}
                />
            ) : currentView === "settings" ? (
                <Settings tabId={tabId + "-settings-list"} onChangeView={handleChangeView} onSelectedMassMailerChange={handleSelectedMassId} fromView={fromView} />
            ) : currentView === "tags" ? (
                <Tags tabId={tabId + "-tags-list"} onChangeView={handleChangeView} onSelectedMassMailerChange={handleSelectedMassId} fromView={fromView} />
            ) : currentView === "template" ? (
                <Template
                    tabId={tabId + "-template-list"}
                    onPreordertSelect={handleMassSelect}
                    onChangeView={handleChangeView}
                    selectedPreorder={selectedPreorder}
                    onSelectedMassMailerChange={handleSelectedMassId}
                    fromView={fromView}
                />
            ) : (
                <MassMailerDetails
                    preorderId={selectedMassId!}
                    saveType={saveType}
                    onBack={handleBackToList}
                    onChangeView={handleChangeView}
                    onSave={handleSave}
                    tabId={tabId + "-preorder-info"}
                    onChangePreorderId={(newId) => setSelectedMassId(newId)}
                    onChangeSaveType={(type) => setSaveType(type)}
                />
            )}
        </div>
    );
};

export default Preorder;

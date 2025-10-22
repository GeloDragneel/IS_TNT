import React, { useState } from "react"; // ← Make sure useEffect is imported
import ReceiveGoodsList from "./sub/ReceiveGoodsList.tsx";
import ReceiveGoodsDetails from "./sub/ReceiveGoodsDetails.tsx";

interface ReceiveGoodsProps {
    tabId: string;
}

type ViewType = "list" | "details";

const ReceiveGoods: React.FC<ReceiveGoodsProps> = ({ tabId }) => {
    const [currentView, setCurrentView] = useState<ViewType>("list");
    const [selectedGrnID, setSelectedGrnID] = useState<number | null>(null);
    const [selectedReceiveGoods, setselectedReceiveGoods] = useState<number[]>([]);
    const [saveType, setSaveType] = useState<string>("edit");
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const handleSelectedReceiveGoodsChange = (selected: number[]) => {
        setselectedReceiveGoods(selected);
    };
    const handleExpandedRowsChange = (expanded: number[]) => {
        setExpandedRows(expanded);
    };
    const handleGRNSelect = (receiveGoodsId: number, type: string = "edit") => {
        setSelectedGrnID(receiveGoodsId);
        setSaveType(type);
        setCurrentView("details");
    };
    const handleBackToList = () => {
        setCurrentView("list");
        setSelectedGrnID(null);
    };
    const handleSave = () => {};
    return (
        <div className="h-full">
            {currentView === "list" && (
                <ReceiveGoodsList
                    tabId={tabId + "-grn-list"}
                    onReceiveGoodsSelect={handleGRNSelect}
                    onChangeView={setCurrentView}
                    selectedReceiveGoods={selectedReceiveGoods}
                    onSelectedGRNChange={handleSelectedReceiveGoodsChange}
                    expandedRows={expandedRows}
                    onExpandedRowsChange={handleExpandedRowsChange}
                />
            )}
            {currentView === "details" && selectedGrnID !== null && selectedGrnID !== undefined && (
                <ReceiveGoodsDetails
                    receiveGoodsId={selectedGrnID}
                    tabId={tabId + "-grn-info"}
                    saveType={saveType}
                    onBack={handleBackToList}
                    onSave={handleSave}
                    onChangeReceiveGoodsId={(newId) => setSelectedGrnID(newId)}
                    onChangeSaveType={(type) => setSaveType(type)}
                />
            )}
        </div>
    );
};

export default ReceiveGoods;

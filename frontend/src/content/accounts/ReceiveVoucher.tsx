import React, { useState } from "react"; // ← Make sure useEffect is imported
import ReceiveVoucherList from "./sub/ReceiveVoucherList.tsx";
import ReceiveVoucherDetails from "./sub/ReceiveVoucherDetail.tsx";

interface ReceiveVoucherProps {
    tabId: string;
}

type ViewType = "list" | "details";

const ReceiveVoucher: React.FC<ReceiveVoucherProps> = ({ tabId }) => {
    const [currentView, setCurrentView] = useState<ViewType>("list");
    const [selectReceiveVoucherID, setSelectedRVID] = useState<number | null>(null);
    const [selectedRV, setselectedRV] = useState<number[]>([]);
    const [saveType, setSaveType] = useState<string>("edit");
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const handleSelectedRVChange = (selected: number[]) => {
        setselectedRV(selected);
    };
    const handleExpandedRowsChange = (expanded: number[]) => {
        setExpandedRows(expanded);
    };
    const handleRVSelect = (receiveVoucherId: number, type: string = "edit") => {
        setSelectedRVID(receiveVoucherId);
        setSaveType(type);
        setCurrentView("details");
    };
    const handleBackToList = () => {
        setCurrentView("list");
        setSelectedRVID(null);
    };
    const handleSave = () => {};
    return (
        <div className="h-full">
            {currentView === "list" && (
                <ReceiveVoucherList
                    tabId={tabId + "-rv-list"}
                    onReceiveVoucherSelect={handleRVSelect}
                    onChangeView={setCurrentView}
                    selectedRV={selectedRV}
                    onSelectedRVChange={handleSelectedRVChange}
                    expandedRows={expandedRows}
                    onExpandedRowsChange={handleExpandedRowsChange}
                />
            )}
            {currentView === "details" && selectReceiveVoucherID !== null && selectReceiveVoucherID !== undefined && (
                <ReceiveVoucherDetails
                    receiveVoucherId={selectReceiveVoucherID}
                    tabId={tabId + "-rv-info"}
                    saveType={saveType}
                    onBack={handleBackToList}
                    onSave={handleSave}
                    onChangeReceiveVoucherId={(newId) => setSelectedRVID(newId)}
                    onChangeSaveType={(type) => setSaveType(type)}
                />
            )}
        </div>
    );
};

export default ReceiveVoucher;

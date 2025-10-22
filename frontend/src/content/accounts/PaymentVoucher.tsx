import React, { useState } from "react"; // ← Make sure useEffect is imported
import PaymentVoucherList from "./sub/PaymentVoucherList.tsx";
import PaymentVoucherDetails from "./sub/PaymentVoucherDetail.tsx";

interface PaymentVoucherProps {
    tabId: string;
}

type ViewType = "list" | "details";

const PaymentVoucher: React.FC<PaymentVoucherProps> = ({ tabId }) => {
    const [currentView, setCurrentView] = useState<ViewType>("list");
    const [selectPaymentVoucherID, setSelectedPVID] = useState<number | null>(null);
    const [selectedPV, setselectedPV] = useState<number[]>([]);
    const [saveType, setSaveType] = useState<string>("edit");
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const handleSelectedPVChange = (selected: number[]) => {
        setselectedPV(selected);
    };
    const handleExpandedRowsChange = (expanded: number[]) => {
        setExpandedRows(expanded);
    };
    const handlePVSelect = (paymentVoucherId: number, type: string = "edit") => {
        setSelectedPVID(paymentVoucherId);
        setSaveType(type);
        setCurrentView("details");
    };
    const handleBackToList = () => {
        setCurrentView("list");
        setSelectedPVID(null);
    };
    const handleSave = () => {};
    return (
        <div className="h-full">
            {currentView === "list" && (
                <PaymentVoucherList
                    tabId={tabId + "-rv-list"}
                    onPaymentVoucherSelect={handlePVSelect}
                    onChangeView={setCurrentView}
                    selectedPV={selectedPV}
                    onSelectedPVChange={handleSelectedPVChange}
                    expandedRows={expandedRows}
                    onExpandedRowsChange={handleExpandedRowsChange}
                />
            )}
            {currentView === "details" && selectPaymentVoucherID !== null && selectPaymentVoucherID !== undefined && (
                <PaymentVoucherDetails
                    paymentVoucherId={selectPaymentVoucherID}
                    tabId={tabId + "-rv-info"}
                    saveType={saveType}
                    onBack={handleBackToList}
                    onSave={handleSave}
                    onChangePaymentVoucherId={(newId) => setSelectedPVID(newId)}
                    onChangeSaveType={(type) => setSaveType(type)}
                />
            )}
        </div>
    );
};

export default PaymentVoucher;

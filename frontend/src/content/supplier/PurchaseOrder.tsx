import React, { useState, useEffect } from 'react'; // ← Make sure useEffect is imported
import PurchaseOrderList from './sub/PurchaseOrderList';
import PurchaseOrderDetails from './sub/PurchaseOrderDetails.tsx';
import DepositPaidList from './sub/DepositPaidList.tsx';

interface PurchaseOrderProps {
  tabId: string;
}

type ViewType = 'list' | 'details' | 'depositPaid';

const PurchaseOrder: React.FC<PurchaseOrderProps> = ({ tabId }) => {
    const [currentView, setCurrentView] = useState<ViewType>('list');
    const [selectedPOId, setSelectedPOId] = useState<number | null>(null);
    const [selectedPurchaseOrder, setselectedPurchaseOrder] = useState<number[]>([]);
    const [saveType, setSaveType] = useState<string>('edit');
    const [copySettings, setCopySettings] = useState<any>(null);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const handleselectedPurchaseOrderChange = (selected: number[]) => {
        setselectedPurchaseOrder(selected);
    };

    const handleExpandedRowsChange = (expanded: number[]) => {
        setExpandedRows(expanded);
    };

    const handlePOSelect = (purchaseOrderId: number, type: string = 'edit') => {
        setSelectedPOId(purchaseOrderId);
        setSaveType(type);
        setCurrentView('details');
        setCopySettings(null); // Ensure copy settings are cleared for normal edit
    };

    const handleInitiateCopy = (sourceSupplierId: number, settings: any) => {
        setCopySettings(settings);
        setSelectedPOId(sourceSupplierId);
        setSaveType('copy');
        setCurrentView('details');
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setSelectedPOId(null);
    };
    const handleSave = () => {
        
    };
    return (
    <div className="h-full">
        {currentView === 'list' && (
        <PurchaseOrderList
            tabId={tabId + '-purchaseOrder-list'} 
            onPurchaseOrderSelect={handlePOSelect}
            onChangeView={setCurrentView}
            onInitiateCopy={handleInitiateCopy}
            selectedPurchaseOrder={selectedPurchaseOrder}
            onSelectedPurchaseOrderChange={handleselectedPurchaseOrderChange}
            expandedRows={expandedRows}
            onExpandedRowsChange={handleExpandedRowsChange}
        />
        )}
        {currentView === 'details' && (selectedPOId !== null && selectedPOId !== undefined ) && (
        <PurchaseOrderDetails 
            purchaseOrderId={selectedPOId}
            tabId={tabId + '-purchaseOrder-info'} 
            saveType={saveType}
            onBack={handleBackToList}
            onSave={handleSave}
            onChangePurchaseOrderId={(newId) => setSelectedPOId(newId)}
            onChangeSaveType={(type) => setSaveType(type)}
        />
        )}
        {currentView === 'depositPaid' && (
        <DepositPaidList 
            tabId={tabId + '-deposit-paid'} 
            onChangeView={setCurrentView}
            selectedPurchaseOrder={selectedPurchaseOrder}
            onSelectedPurchaseOrderChange={handleselectedPurchaseOrderChange}
            expandedRows={expandedRows}
            onExpandedRowsChange={handleExpandedRowsChange}
        />
        )}
    </div>
    );

};

export default PurchaseOrder;
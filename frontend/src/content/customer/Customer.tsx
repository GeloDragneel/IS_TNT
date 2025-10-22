import React, { useEffect, useState } from 'react';
import CustomerList from './sub/CustomerList';
import CustomerDetails from './sub/CustomerDetails.tsx';

interface CustomerProps {
  tabId: string;
}

type ViewType = 'list' | 'details' ;

const Customer: React.FC<CustomerProps> = ({ tabId }) => {
    const [currentView, setCurrentView] = useState<ViewType>('list');
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [selectedCustomers, setselectedCustomers] = useState<number[]>([]);
    const [saveType, setSaveType] = useState<string>('edit');
    const [copySettings, setCopySettings] = useState<any>(null);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const handleselectedCustomersChange = (selected: number[]) => {
        setselectedCustomers(selected);
    };

    const handleExpandedRowsChange = (expanded: number[]) => {
        setExpandedRows(expanded);
    };

    const handleCustomerSelect = (customerId: number, type: string = 'edit') => {
        setSelectedCustomerId(customerId);
        setSaveType(type);
        setCurrentView('details');
        setCopySettings(null); // Ensure copy settings are cleared for normal edit
    };

    const handleInitiateCopy = (sourceCustomerId: number, settings: any) => {
        setCopySettings(settings);
        setSelectedCustomerId(sourceCustomerId);
        setSaveType('copy');
        setCurrentView('details');
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setSelectedCustomerId(null);
    };
    const handleSave = () => {
        // This function will be called from ProductDetails after a successful save.
        // It clears the cache for the product list, forcing it to refetch.
        // const listTabId = tabId + '-product-list';
        // localStorage.removeItem(`${listTabId}-cached-products`);
        // localStorage.removeItem(`${listTabId}-cached-meta`);
    };

    return (
    <div className="h-full">
        {currentView === 'list' && (
        <CustomerList 
            tabId={tabId + '-customer-list'} 
            onCustomerSelect={handleCustomerSelect}
            onChangeView={setCurrentView}
            onInitiateCopy={handleInitiateCopy}
            selectedCustomers={selectedCustomers}
            onSelectedCustomersChange={handleselectedCustomersChange}
            expandedRows={expandedRows}
            onExpandedRowsChange={handleExpandedRowsChange}
        />
        )}
        {currentView === 'details' && (selectedCustomerId !== null && selectedCustomerId !== undefined ) && (
        <CustomerDetails 
            customerId={selectedCustomerId}
            saveType={saveType}
            onBack={handleBackToList}
            tabId={tabId + '-customer-details'}
            onSave={handleSave}
            onChangeCustomerId={(newId) => setSelectedCustomerId(newId)}
            onChangeSaveType={(type) => setSaveType(type)}
            copySettings={copySettings}
        />
        )}
    </div>
    );

};

export default Customer;
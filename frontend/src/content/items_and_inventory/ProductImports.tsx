import React, { useState } from "react";
import ProductImportList from "./sub/ProductImportList";
import ProductImportDetails from "./sub/ProductImportDetails";

interface ProductsProps {
    tabId: string;
}

type ViewType = "list" | "details" | "archive" | "tagging";

const Products: React.FC<ProductsProps> = ({ tabId }) => {
    const [currentView, setCurrentView] = useState<ViewType>("list");
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [saveType, setSaveType] = useState<string>("edit");
    const [copySettings, setCopySettings] = useState<any>(null);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const handleSelectedProductsChange = (selected: number[]) => {
        setSelectedProducts(selected);
    };

    const handleExpandedRowsChange = (expanded: number[]) => {
        setExpandedRows(expanded);
    };

    const handleProductSelect = (productId: number, type: string = "edit") => {
        setSelectedProductId(productId);
        setSaveType(type);
        setCurrentView("details");
        setCopySettings(null); // Ensure copy settings are cleared for normal edit
    };

    const handleInitiateCopy = (sourceProductId: number, settings: any) => {
        setCopySettings(settings);
        setSelectedProductId(sourceProductId);
        setSaveType("copy");
        setCurrentView("details");
    };

    const handleBackToList = () => {
        setCurrentView("list");
        setSelectedProductId(null);
    };

    const handleSave = () => {};

    return (
        <div className="h-full">
            {currentView === "list" ? (
                <ProductImportList
                    tabId={tabId + "-product-list"}
                    onProductSelect={handleProductSelect}
                    onChangeView={setCurrentView}
                    onInitiateCopy={handleInitiateCopy}
                    selectedProducts={selectedProducts}
                    onSelectedProductsChange={handleSelectedProductsChange}
                    expandedRows={expandedRows}
                    onExpandedRowsChange={handleExpandedRowsChange}
                />
            ) : (
                <ProductImportDetails
                    productId={selectedProductId!}
                    saveType={saveType}
                    onBack={handleBackToList}
                    onSave={handleSave}
                    tabId={tabId + "-product-info"}
                    onChangeProductId={(newId) => setSelectedProductId(newId)}
                    onChangeSaveType={(type) => setSaveType(type)}
                    copySettings={copySettings}
                />
            )}
        </div>
    );
};

export default Products;

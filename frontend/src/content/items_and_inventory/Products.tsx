import React, { useState } from "react";
import ProductList from "./sub/ProductList";
import ProductArchive from "./sub/ProductArchive";
import ProductDetails from "./sub/ProductDetails";
import ProductTagging from "./sub/ProductTagging";

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

    const handleSave = () => {
        // This function will be called from ProductDetails after a successful save.
        // It clears the cache for the product list, forcing it to refetch.
        // const listTabId = tabId + '-product-list';
        // localStorage.removeItem(`${listTabId}-cached-products`);
        // localStorage.removeItem(`${listTabId}-cached-meta`);
    };

    return (
        <div className="h-full">
            {currentView === "list" ? (
                <ProductList
                    tabId={tabId + "-product-list"}
                    onProductSelect={handleProductSelect}
                    onChangeView={setCurrentView}
                    onInitiateCopy={handleInitiateCopy}
                    selectedProducts={selectedProducts}
                    onSelectedProductsChange={handleSelectedProductsChange}
                    expandedRows={expandedRows}
                    onExpandedRowsChange={handleExpandedRowsChange}
                />
            ) : currentView === "archive" ? (
                <ProductArchive
                    tabId={tabId + "-product-archive"}
                    onProductSelect={handleProductSelect}
                    onChangeView={setCurrentView}
                    selectedProducts={selectedProducts}
                    onSelectedProductsChange={handleSelectedProductsChange}
                    expandedRows={expandedRows}
                    onExpandedRowsChange={handleExpandedRowsChange}
                />
            ) : currentView === "tagging" ? (
                <ProductTagging
                    tabId={tabId + "-product-tagging"}
                    onProductSelect={handleProductSelect}
                    onChangeView={setCurrentView}
                    selectedProducts={selectedProducts}
                    onSelectedProductsChange={handleSelectedProductsChange}
                    expandedRows={expandedRows}
                    onExpandedRowsChange={handleExpandedRowsChange}
                />
            ) : (
                <ProductDetails
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

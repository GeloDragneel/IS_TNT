import React, { useState, useEffect, useMemo } from "react";
import { productService, ApiProduct, DetailsRow } from "@/services/productService";
import { useLanguage } from "@/context/LanguageContext";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import PusherEcho from "@/utils/echo";
import { showConfirm } from "@/utils/alert";
import CopyToClipboard from "@/components/CopyToClipboard";
import { highlightMatch } from "@/utils/highlightMatch";
import { Minus, Plus, X } from "lucide-react";
import CustomCheckbox from "@/components/CustomCheckbox";
import { baseCurrency, formatDate, formatMoney } from "@/utils/globalFunction";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
// Handle the Smooth skeleton loading
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);

interface InventoryListProps {
    tabId: string;
}
// localStorage.clear();
const InventoryList: React.FC<InventoryListProps> = ({ tabId }) => {
    const { translations, lang } = useLanguage();
    const [transferList, setTransfer] = useState<ApiProduct[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [expanded_Inventory, setExpandedRows] = useState<number[]>([]);
    const [inventoryDetailMap, setTransferDetailMap] = useState<Record<number, DetailsRow[] | null>>({});
    const [selectedDetails, selectedInventory] = useState<number[]>([]);
    const [showFromInventory, setShowTransferInventory] = useState(false);
    const pageSizeOptionsInventory = useMemo(() => [10, 20, 50, -1], []);
    const [productQuantities, setProductQuantities] = useState<Record<number, number>>({});
    const [stockTakeId, setStockTakeID] = useState(1);
    const [totalPagesProducts, setTotalPages_Products] = useState(1);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [searchTermProduct, setSearchTermProduct] = useState(() => {
        return "";
    });
    const [currentPageProduct, setCurrentPageProduct] = useState(() => {
        return 1;
    });
    const [itemsPerPageProduct, setItemsPerPageProduct] = useState(() => {
        return 10;
    });
    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-og-transfer`;
        const cachedMeta = localStorage.getItem(metaKey);
        let page = 1;
        if (cachedMeta) {
            try {
                const meta = JSON.parse(cachedMeta);
                page = typeof meta.page === "number" ? meta.page : parseInt(meta.page) || 1;
            } catch (err) {
                console.warn("Invalid JSON in cached-meta:", err);
            }
        }
        return page;
    });
    const [itemsPerPage, setItemsPerPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-og-transfer`;
        const cachedMeta = localStorage.getItem(metaKey);
        let perPage = 15;
        if (cachedMeta) {
            try {
                const meta = JSON.parse(cachedMeta);
                perPage = typeof meta.perPage === "number" ? meta.perPage : parseInt(meta.perPage) || 10;
            } catch (err) {
                console.warn("Failed to parse cached-meta:", err);
            }
        }
        return perPage;
    });
    const [searchTerm, setSearchTerm] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-meta-og-transfer`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    useEffect(() => {
        const channel = PusherEcho.channel("inventory-channel");
        channel.listen(".inventory-event", () => {
            setTimeout(() => {
                fetchStockTake(currentPage, itemsPerPage, searchTerm);
            }, 500);
        });
        return () => {
            PusherEcho.leave("inventory-channel");
        };
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    // ON LOAD LIST
    useEffect(() => {
        fetchStockTake(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    useEffect(() => {
        const handleEsc = (event: any) => {
            if (event.key === "Escape") {
                if (setShowTransferInventory) {
                    setShowTransferInventory(false);
                }
            }
        };
        window.addEventListener("keydown", handleEsc);
        // Cleanup on unmount
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [setShowTransferInventory]);

    useEffect(() => {
        fetchInventory(currentPageProduct, itemsPerPageProduct, searchTermProduct, selectedProducts);
    }, [currentPageProduct, itemsPerPageProduct, searchTermProduct]);

    const fetchStockTake = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            // setLoading(true);
            const paginatedData = await productService.getStockTakeList(page, perPage, search);
            setTransfer(paginatedData.data);
            setTotalPages(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching list:", err);
        }
    };
    const fetchInventory = async (page = currentPageProduct, perPage = itemsPerPageProduct, search = "", sortId = selectedProducts) => {
        try {
            const paginatedData = await productService.getStockInventory(page, perPage, search, sortId);
            setProducts(paginatedData.data);
            setTotalPages_Products(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching products:", err);
        }
    };
    const handleToggleRow = async (tableId: number) => {
        const isExpanded = expanded_Inventory.includes(tableId);
        const cachedKey = tabId + "_cachedTransferDetails_" + tableId;
        const expandedKey = tabId + "_expandedKey";

        if (isExpanded) {
            // Collapse row
            const updated = expanded_Inventory.filter((id) => id !== tableId);
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
        } else {
            // Expand row
            const updated = [...expanded_Inventory, tableId];
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
            try {
                const data = transferList.find((po) => po.id === tableId);
                // Save to state
                if (!data?.details) {
                    setTransferDetailMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.details;
                setTransferDetailMap((prev) => ({ ...prev, [tableId]: details }));
                localStorage.setItem(cachedKey, JSON.stringify(details));
            } catch (error) {
                console.error(`Failed to load details for product ${tableId}`, error);
                setTransferDetailMap((prev) => ({ ...prev, [tableId]: null }));
            }
        }
    };
    const handleSelectAllocation = (product_id: number, checked: boolean) => {
        if (checked) {
            selectedInventory((prev) => [...prev, product_id]);
        } else {
            selectedInventory((prev) => prev.filter((pid) => pid !== product_id));
        }
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = transferList?.map((p: any) => p.product_id);
            selectedInventory(allIds);
        } else {
            selectedInventory([]);
        }
    };
    const handleAddNewTransfer = async () => {
        setStockTakeID(0);
        setSelectedProducts([]);
        setShowTransferInventory(true);
        await fetchInventory(currentPageProduct, itemsPerPageProduct, searchTermProduct, []);
        // Reset all quantities in productQuantities to 0
        setProductQuantities((prev) => {
            const resetQuantities: Record<number, number> = {};
            Object.keys(prev).forEach((key) => {
                resetQuantities[Number(key)] = 0;
            });
            return resetQuantities;
        });
    };
    const handleEdit = async (st_no: string) => {
        const data = transferList.find((list) => list.st_no === st_no);
        const details = data?.details || [];
        const productIds = details.map((item: any) => item.product_id);
        setSelectedProducts(productIds);
        setStockTakeID(Number(data?.id));
        // Map product_id to qty for quick lookup
        const qtyMap = details.reduce((acc: any, item: any) => {
            acc[item.product_id] = Number(item.physical_qty);
            return acc;
        }, {} as Record<number, number>);

        // Set quantities separately
        setProductQuantities(qtyMap);

        await fetchInventory(currentPageProduct, itemsPerPageProduct, searchTermProduct, productIds);

        setShowTransferInventory(true);
    };
    const handleDelete = async () => {
        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to delete this record?"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            await productService.deleteStockTake(selectedDetails);
            fetchStockTake();
            selectedInventory([]);
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }
    };
    const handleSubmitInventory = async () => {
        const stockTakeArray = products.map((item) => ({
            product_id: item.product_id,
            location: item.warehouse,
            qty: item.rem_qty,
            physical_qty: productQuantities[item.product_id] || 0,
        }));
        // Optional: filter out 0-qty items
        const filtered = stockTakeArray.filter((item) => item.physical_qty > 0);
        if (filtered.length === 0) {
            showErrorToast(translations["Quantity is Required"]);
            return;
        }
        try {
            await productService.saveStockTake(filtered, stockTakeId);
            fetchStockTake();
            selectedInventory([]);
            setShowTransferInventory(false);
            showSuccessToast(translations["alert_message_114"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }
    };
    const renderInventoryList = () => {
        if (!showFromInventory) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[80vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Stock Pick"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowTransferInventory(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="p-2 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="search"
                                        placeholder={translations["Search"]}
                                        value={searchTermProduct}
                                        onChange={(e) => {
                                            setSearchTermProduct(e.target.value);
                                            setCurrentPageProduct(1);
                                        }}
                                        className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                        style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-2 flex-1 overflow-auto">
                        <div className="max-h-[calc(100vh-435px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className="w-[40%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Product"]}</th>
                                        <th className="w-[15%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Location"]}</th>
                                        <th className="w-[15%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Item Cost"]}</th>
                                        <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["In Transit"]}</th>
                                        <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Qty"]}</th>
                                        <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Physical Qty"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((list, index) => (
                                        <React.Fragment key={list.id || index}>
                                            <tr
                                                key={list.id || index}
                                                className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                                style={{ borderColor: "#40404042" }}
                                            >
                                                <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center space-x-3">
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                            }}
                                                            className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center"
                                                        >
                                                            <img
                                                                src={`${import.meta.env.VITE_BASE_URL}/storage/${
                                                                    list.product_code ? list.product_code + "_thumbnail.webp" : "products/no-image-min.jpg"
                                                                }`}
                                                                alt="Thumbnail"
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = `${import.meta.env.VITE_BASE_URL}/storage/products/no-image-min.jpg`;
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-300 text-custom-sm select-text">{list.product_code}</p>
                                                                <CopyToClipboard text={list.product_code} />
                                                            </div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">{lang == "en" ? list.product_title_en : list.product_title_cn}</p>
                                                                <CopyToClipboard text={lang == "en" ? list.product_title_en : list.product_title_cn} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.warehouse}</td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {baseCurrency()}
                                                    <br></br>
                                                    {formatMoney(list.item_cost)}
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{list.in_transit_qty}</td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{list.rem_qty}</td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    <input
                                                        type="number"
                                                        value={productQuantities[list.product_id] === 0 ? "" : productQuantities[list.product_id] || ""}
                                                        placeholder="0"
                                                        onChange={(e) => {
                                                            const inputValue = parseFloat(e.target.value);
                                                            setProductQuantities((prev) => ({
                                                                ...prev,
                                                                [list.product_id]: isNaN(inputValue) ? 0 : inputValue,
                                                            }));
                                                        }}
                                                        className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded text-center"
                                                    />
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-1">
                            <MemoizedPagination currentPage={currentPageProduct} totalPages={totalPagesProducts} onPageChange={(page) => setCurrentPageProduct(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPageProduct}
                                onChange={(val: number) => {
                                    setItemsPerPageProduct(val);
                                    setCurrentPageProduct(1);
                                }}
                                options={pageSizeOptionsInventory}
                            />
                        </div>
                        <div className="flex items-center space-x-1">
                            <button onClick={() => setShowTransferInventory(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                                {translations["Close"]}
                            </button>
                            <button onClick={handleSubmitInventory} className="px-2 py-2 bg-cyan-700 hover:bg-cyan-600 rounded text-white transition">
                                {translations["Submit"]}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    return (
        <div className="space-y-6">
            {/* Main Content Card */}
            <div className="rounded-lg border shadow-sm" style={{ backgroundColor: "#19191c", borderColor: "#404040" }}>
                {/* Toolbar */}
                <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <input
                                    type="search"
                                    placeholder={translations["Search"]}
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                    style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={handleAddNewTransfer} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                                <span>{translations["Add New"]}</span>
                            </button>
                            <button
                                disabled={selectedDetails.length === 0}
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                            >
                                <span>{translations["Delete"]}</span>
                            </button>
                        </div>
                    </div>
                </div>
                {/* Table */}
                <div className="overflow-x-auto flex-grow">
                    <div className="h-[calc(100vh-215px)] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[5%]"></th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[5%]">
                                        <div className="flex items-center h-full">
                                            <CustomCheckbox checked={selectedDetails.length === transferList?.length && transferList?.length > 0} onChange={(checked) => handleSelectAll(checked)} />
                                        </div>
                                    </th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[25%]">{translations["Date"]}</th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[25%]">{translations["ST No"]}</th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[20%]">{translations["Location"]}</th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[20%]">{translations["Action"]}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transferList.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-2 px-2 text-center text-gray-400 text-sm border border-[#40404042]">
                                            {translations["No Record Found"]}.
                                        </td>
                                    </tr>
                                ) : (
                                    transferList.map((list, index) => (
                                        <React.Fragment key={list.id || index}>
                                            <tr className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`} style={{ borderColor: "#40404042" }}>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleToggleRow(list.id)}
                                                        className={`px-1 py-1 ${
                                                            expanded_Inventory.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                        } text-white rounded-lg transition-colors text-xs`}
                                                    >
                                                        {expanded_Inventory.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                    </button>
                                                </td>
                                                <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                    <CustomCheckbox checked={selectedDetails.includes(list.id as number)} onChange={(checked) => handleSelectAllocation(list.id as number, checked)} />
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(list.date, lang)}</td>
                                                <td className="py-2 px-2">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-400 text-custom-sm select-text">{list.st_no}</p>
                                                            <CopyToClipboard text={list.st_no || ""} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.location}</td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <button
                                                        onClick={() => handleEdit(list.st_no)}
                                                        className="px-1 py-1 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                                        style={{ backgroundColor: "#0891b2", borderColor: "#0891b2" }}
                                                    >
                                                        <span>{translations["Edit"]}</span>
                                                    </button>
                                                </td>
                                            </tr>
                                            {expanded_Inventory.includes(list.id) && (
                                                <tr>
                                                    <td colSpan={8} className="py-3 px-4">
                                                        <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                            <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                    <th className="text-left py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Product Code"]}</th>
                                                                    <th className="text-left py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Product Name"]}</th>
                                                                    <th className="text-left py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Location"]}</th>
                                                                    <th className="text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Qty"]}</th>
                                                                    <th className="text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Physical Qty"]}</th>
                                                                    <th className="text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">
                                                                        {translations["Gain / Loss"] || "Gain / Loss"}
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {inventoryDetailMap[list.id] && inventoryDetailMap[list.id]!.length > 0 ? (
                                                                    inventoryDetailMap[list.id]!.map((detail, i) => (
                                                                        <tr key={detail.id || i}>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                {highlightMatch(detail.product_code, searchTerm)}
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                {lang === "en" ? detail.product_title_en : detail.product_title_cn}
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{detail.warehouse}</td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">{detail.qty}</td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">{detail.physical_qty}</td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                                {detail.qty - detail.physical_qty}
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan={5} className="py-2 px-2 text-center text-gray-400 text-sm">
                                                                            {translations["No Record Found"]}.
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-4">
                        <MemoizedPagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage}
                            onChange={(val: number) => {
                                setItemsPerPage(val);
                                setCurrentPage(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector formats={["odt", "ods", "xlsx"]} baseName="ProductInventory" ids={selectedDetails} language={lang} />
                    </div>
                    <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                </div>
            </div>
            {renderInventoryList()}
        </div>
    );
};
export default InventoryList;

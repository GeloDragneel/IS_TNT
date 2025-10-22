import React, { useState, useEffect, useMemo } from "react";
import { productService, ApiProduct, DetailsRow } from "@/services/productService";
import { useLanguage } from "@/context/LanguageContext";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import Select from "react-select";
import PusherEcho from "@/utils/echo";
import { showConfirm } from "@/utils/alert";
import CopyToClipboard from "@/components/CopyToClipboard";
import { highlightMatch } from "@/utils/highlightMatch";
import { Minus, Plus, X } from "lucide-react";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import CustomCheckbox from "@/components/CustomCheckbox";
import { DropdownData, formatDate, selectStyles } from "@/utils/globalFunction";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { fetchWarehouses, OptionType } from "@/utils/fetchDropdownData";
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
    const [expensesData, setExpensesData] = useState<DropdownData[]>([]);
    const [globTransferNo, setTransferNo] = useState("");
    const [globTransferExt, setTransferExt] = useState("");
    const [totalPagesProducts, setTotalPages_Products] = useState(1);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [activeTab, setActiveTab] = useState("outgoing"); // Default active
    const [productQuantities, setProductQuantities] = useState<Record<number, number>>({});
    const [productWarehouses, setProductWarehouses] = useState<Record<number, OptionType | null>>({});
    const [searchTermProduct, setSearchTermProduct] = useState(() => {
        return "";
    });
    const [currentPageProduct, setCurrentPageProduct] = useState(() => {
        return 1;
    });
    const [itemsPerPageProduct, setItemsPerPageProduct] = useState(() => {
        return 10;
    });
    const getButtonStyle = (tab: any) => ({
        backgroundColor: activeTab === tab ? "#0891b2" : "#2d2d30",
        borderColor: "#2d2d30",
        marginLeft: "5px",
    });
    const buttonClass = "ml-2 px-3 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-cyan-600 text-sm";
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
    const warehouseOptions: OptionType[] = useMemo(
        () =>
            expensesData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [expensesData, lang]
    );
    useEffect(() => {
        const channel = PusherEcho.channel("inventory-channel");
        channel.listen(".inventory-event", () => {
            setTimeout(() => {
                fetchTransfer(currentPage, itemsPerPage, searchTerm);
            }, 500);
        });
        return () => {
            PusherEcho.leave("inventory-channel");
        };
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    // ON LOAD LIST
    useEffect(() => {
        fetchTransfer(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, activeTab, tabId]);

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
        loadWarehouses();
    }, [tabId]);

    useEffect(() => {
        fetchInventory(currentPageProduct, itemsPerPageProduct, searchTermProduct, selectedProducts);
    }, [currentPageProduct, itemsPerPageProduct, searchTermProduct, selectedProducts]);

    const fetchTransfer = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            // setLoading(true);
            const paginatedData = await productService.getInternalTransfer(page, perPage, search, activeTab);
            setTransfer(paginatedData.data);
            setTotalPages(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching list:", err);
        }
    };
    const fetchInventory = async (page = currentPageProduct, perPage = itemsPerPageProduct, search = "", sortId = selectedProducts) => {
        try {
            const paginatedData = await productService.getInternalInventory(page, perPage, search, sortId);
            setProducts(paginatedData.data);
            setTotalPages_Products(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching products:", err);
        }
    };
    const handleSelectAllProducts = (checked: boolean) => {
        if (checked) {
            const allIds = products?.map((p: any) => p.id);
            setSelectedProducts(allIds);
        } else {
            setSelectedProducts([]);
        }
    };
    const loadWarehouses = async () => {
        try {
            const list = await fetchWarehouses(); // fetches & returns
            setExpensesData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadWarehouses:", err);
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
    const handleSelectProduct = (productId: number, checked: boolean) => {
        // ✅ Multi select (default)
        setSelectedProducts((prev) => {
            if (checked) {
                return [...prev, productId];
            } else {
                return prev.filter((id) => id !== productId);
            }
        });
        setCurrentPageProduct(1);
    };
    const handleAddNewTransfer = () => {
        setSelectedProducts([]);
        setTransferNo("");
        setTransferExt("");
        setProductQuantities({});
        setProductWarehouses({});
        setShowTransferInventory(true);
    };
    const handleConfirmTransfer = async () => {
        if (selectedDetails.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const confirmed = await showConfirm(translations["System Message"], translations["alert_message_15"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        const selectedTransfer = transferList.filter((product) => selectedDetails.includes(product.id));
        try {
            await productService.confirmTransfer(selectedTransfer);
            fetchTransfer();
            selectedInventory([]);
            setShowTransferInventory(false);
            showSuccessToast(translations["alert_message_114"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }
    };
    const handleEdit = async (transferNo: string) => {
        const data = transferList.find((list) => list.ftransfer_no === transferNo);
        const details = data?.details || [];
        const inventoryIds = details.map((detail: any) => detail.inventory_id);

        setSelectedProducts(inventoryIds);
        setTransferNo(data?.transfer_no);
        setTransferExt(data?.transfer_ext);

        // Set quantities separately
        const qtyMap = details.reduce((acc: any, item: any) => {
            acc[item.inventory_id] = Number(item.qty);
            return acc;
        }, {} as Record<number, number>);
        setProductQuantities(qtyMap);

        // Set warehouses separately
        const warehouseMap = details.reduce((acc: any, item: any) => {
            acc[item.inventory_id] = warehouseOptions.find((opt) => opt.value === String(item.warehouse_to)) || null;
            return acc;
        }, {} as Record<number, OptionType | null>);
        setProductWarehouses(warehouseMap);

        await fetchInventory(currentPageProduct, itemsPerPageProduct, searchTermProduct, inventoryIds);
        setShowTransferInventory(true);
    };
    const handleDelete = async () => {
        const selectedTransfer = transferList.filter((product) => selectedDetails.includes(product.id));
        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to delete this record?"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            await productService.deleteTransfer(selectedTransfer);
            fetchTransfer();
            selectedInventory([]);
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("Deletion failed:", err);
        }
    };
    const handleSubmitInventory = async () => {
        if (selectedProducts.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }

        const selectedItem = products
            .filter((list) => selectedProducts.includes(list.id))
            .map((item) => ({
                ...item,
                new_qty: productQuantities[item.id] || 0,
                to: productWarehouses[item.id]?.value || "", // Extract value here
            }));

        let is_qty = 0;
        selectedItem.forEach((element) => {
            if (element.new_qty === 0) {
                is_qty++;
            }
        });

        if (is_qty > 0) {
            showErrorToast(translations["Quantity is Required"]);
            return;
        }

        try {
            await productService.saveNewTransfer(
                selectedItem, // No need to map again, already has value
                globTransferNo,
                globTransferExt
            );
            fetchTransfer();
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
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Internal Transfer"]}</h2>
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
                                        <th className="w-[5%] text-left py-2 px-2 text-gray-400 text-sm">
                                            <CustomCheckbox checked={selectedProducts.length === products.length && products.length > 0} onChange={(checked) => handleSelectAllProducts(checked)} />
                                        </th>
                                        <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Product Code"]}</th>
                                        <th className="w-[30%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Product Name"]}</th>
                                        <th className="w-[15%] text-left py-2 px-2 text-gray-400 text-sm">
                                            {translations["Warehouse"]} {translations["From"]}
                                        </th>
                                        <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Rem Qty"]}</th>
                                        <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm">
                                            {translations["Warehouse"]} {translations["To"]}
                                        </th>
                                        <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Qty"]}</th>
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
                                                    <CustomCheckbox checked={selectedProducts.includes(list.id as number)} onChange={(checked) => handleSelectProduct(list.id as number, checked)} />
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{list.product_code}</p>
                                                        <CopyToClipboard text={list.product_code || ""} />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{lang == "en" ? list.product_title_en : list.product_title_cn}</p>
                                                        <CopyToClipboard text={lang == "en" ? list.product_title_en || "" : list.product_title_cn || ""} />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.warehouse}</td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{list.rem_qty}</td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <Select
                                                        classNamePrefix="react-select"
                                                        value={productWarehouses[list.id] || null}
                                                        onChange={(selected) => {
                                                            setProductWarehouses((prev) => ({
                                                                ...prev,
                                                                [list.id]: selected as OptionType | null,
                                                            }));
                                                        }}
                                                        isDisabled={!selectedProducts.includes(list.id as number)}
                                                        options={warehouseOptions.filter((opt) => opt.value !== list.warehouse)}
                                                        styles={{
                                                            ...selectStyles,
                                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                        }}
                                                        className="w-[100%]"
                                                        placeholder={translations["Select"]}
                                                        menuPlacement="auto"
                                                        menuPosition="fixed"
                                                        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                                    />
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    <input
                                                        type="number"
                                                        disabled={!selectedProducts.includes(list.id as number)}
                                                        value={productQuantities[list.id] === 0 ? "" : productQuantities[list.id] || ""}
                                                        placeholder="0"
                                                        onChange={(e) => {
                                                            const inputValue = parseFloat(e.target.value);
                                                            if (!isNaN(inputValue) && inputValue > list.rem_qty) {
                                                                showErrorToast(translations["Remaining quantity is"] + " " + list.rem_qty);
                                                                return; // Stop update
                                                            }
                                                            setProductQuantities((prev) => ({
                                                                ...prev,
                                                                [list.id]: isNaN(inputValue) ? 0 : inputValue,
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
                <div className="p-2 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
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
                            <button className={buttonClass} style={getButtonStyle("outgoing")} onClick={() => setActiveTab("outgoing")}>
                                <span>{translations["Outgoing Transfer"]}</span>
                            </button>
                            <button className={buttonClass} style={getButtonStyle("incoming")} onClick={() => setActiveTab("incoming")}>
                                <span>{translations["Incoming Transfer"]}</span>
                            </button>
                            <button className={buttonClass} style={getButtonStyle("historical")} onClick={() => setActiveTab("historical")}>
                                <span>{translations["Historical Transfer"]}</span>
                            </button>
                            <button className={buttonClass} style={getButtonStyle("archive")} onClick={() => setActiveTab("archive")}>
                                <span>{translations["Archive"]}</span>
                            </button>
                            <button
                                className="hidden ml-2 px-3 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Advance Search"]}</span>
                            </button>
                        </div>
                        {(activeTab === "outgoing" || activeTab === "incoming") && (
                            <div className="flex items-center space-x-2">
                                {activeTab === "outgoing" && (
                                    <button
                                        onClick={handleAddNewTransfer}
                                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                    >
                                        <span>{translations["Add New"]}</span>
                                    </button>
                                )}
                                {activeTab === "incoming" && (
                                    <button
                                        disabled={selectedDetails.length === 0}
                                        onClick={handleConfirmTransfer}
                                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                    >
                                        <span>{translations["Confirm"]}</span>
                                    </button>
                                )}
                                <button
                                    disabled={selectedDetails.length === 0}
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Delete"]}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {/* Table */}
                <div className="overflow-x-auto flex-grow">
                    <div className="h-[calc(100vh-180px)] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[5%]"></th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[5%]">
                                        <div className="flex items-center h-full">
                                            <CustomCheckbox checked={selectedDetails.length === transferList?.length && transferList?.length > 0} onChange={(checked) => handleSelectAll(checked)} />
                                        </div>
                                    </th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[20%]">{translations["Transfer No"]}</th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[20%]">{activeTab === "historical" ? translations["Received Date"] : translations["Transfer Date"]}</th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[15%]">
                                        {translations["Ware House"]} {translations["From"]}
                                    </th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[15%]">
                                        {translations["Ware House"]} {translations["To"]}
                                    </th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[10%]">{translations["Sender"]}</th>
                                    {(activeTab === "outgoing" || activeTab === "incoming" || activeTab === "archive") && (
                                        <th className="text-left py-2 px-2 text-gray-400 text-sm w-[10%]">{translations["Action"]}</th>
                                    )}
                                    {activeTab === "historical" && <th className="text-left py-2 px-2 text-gray-400 text-sm w-[10%]">{translations["Receiver"]}</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {transferList.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-2 px-2 text-center text-gray-400 text-sm border border-[#40404042]">
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
                                                <td className="py-2 px-2">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-300 text-custom-sm select-text">{list.ftransfer_no}</p>
                                                            <CopyToClipboard text={list.ftransfer_no || ""} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    {formatDate(activeTab === "historical" ? list.received_date : list.transfer_date, lang)}
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.warehouse_from}</td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.warehouse_to}</td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.user_id}</td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    {(activeTab === "outgoing" || activeTab === "incoming") && (
                                                        <button
                                                            onClick={() => handleEdit(list.ftransfer_no)}
                                                            className="px-1 py-1 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                                            style={{ backgroundColor: "#0891b2", borderColor: "#0891b2" }}
                                                        >
                                                            <span>{translations["Edit"]}</span>
                                                        </button>
                                                    )}

                                                    {activeTab === "historical" && <span>{list.receiver_id}</span>}

                                                    {activeTab === "archive" && (
                                                        <button
                                                            onClick={() => handleEdit(list.ftransfer_no)}
                                                            className="px-1 py-1 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                                            style={{ backgroundColor: "#0891b2", borderColor: "#0891b2" }}
                                                        >
                                                            <span>{translations["Restore"]}</span>
                                                        </button>
                                                    )}
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
                                                                    <th className="text-left py-2 px-2 text-gray-400 text-sm border border-[#40404042]">
                                                                        {translations["Ware House"]} {translations["From"]}
                                                                    </th>
                                                                    <th className="text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Received Qty"]}</th>
                                                                    <th className="text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Current Qty"]}</th>
                                                                    <th className="text-center py-2 px-2 text-gray-400 text-sm border border-[#40404042]">{translations["Received Qty"]}</th>
                                                                    <th className="text-left py-2 px-2 text-gray-400 text-sm border border-[#40404042]">
                                                                        {translations["Ware House"]} {translations["To"]}
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
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{detail.warehouse_from}</td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">{detail.received_qty}</td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">{detail.rem_qty}</td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">{detail.qty}</td>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{detail.warehouse_to}</td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan={7} className="py-2 px-2 text-center text-gray-400 text-sm">
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
                <div className="p-2 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-1">
                        <MemoizedPagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage}
                            onChange={(val: number) => {
                                setItemsPerPage(val);
                                setCurrentPage(1);
                            }}
                            options={pageSizeOptions}
                        />
                        <ExportReportSelector formats={["odt", "ods", "xlsx"]} baseName="InternalTransfer" ids={selectedDetails} language={lang} />
                    </div>
                    <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                </div>
            </div>
            {renderInventoryList()}
        </div>
    );
};
export default InventoryList;

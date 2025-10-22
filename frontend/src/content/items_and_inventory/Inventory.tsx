import React, { useState, useEffect, useMemo } from "react";
import { inventoryService, ApiInventory, DetailsRow } from "@/services/inventoryService";
import { preorderService } from "@/services/preorderService";
import { useLanguage } from "@/context/LanguageContext";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import Select from "react-select";
import PusherEcho from "@/utils/echo";
import CopyToClipboard from "@/components/CopyToClipboard";
import { highlightMatch } from "@/utils/highlightMatch";
import { Minus, Plus, X } from "lucide-react";
import CustomCheckbox from "@/components/CustomCheckbox";
import { DropdownData, baseCurrency, formatDate, formatMoney, selectStyles } from "@/utils/globalFunction";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { fetchAllExpenses, OptionType } from "@/utils/fetchDropdownData";
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
    const [inventoryList, setInventory] = useState<ApiInventory[]>([]);
    const [withdrawList, setWithdrawList] = useState<ApiInventory[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [expanded_Inventory, setExpandedRows] = useState<number[]>([]);
    const [inventoryDetailMap, setInventoryDetailMap] = useState<Record<number, DetailsRow[] | null>>({});
    const [selectedDetails, selectedInventory] = useState<number[]>([]);
    const [selectedDetails2, selectedInventory2] = useState<number[]>([]);
    const [showFromInventory, setShowWithdrawFromInventory] = useState(false);
    const [searchTermWithdraw, setSearchTermWithdraw] = useState("");
    const [currentPageWithdraw, setCurrentPageWithdraw] = useState(1);
    const [itemsPerPageWithdraw, setItemsPerPageWithdraw] = useState(10);
    const [totalPagesWithdraw, setTotalPages_Withdraw] = useState(1);
    const pageSizeOptionsInventory = useMemo(() => [10, 20, 50, -1], []);
    const [expensesData, setExpensesData] = useState<DropdownData[]>([]);

    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-inventory`;
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
        const metaKey = `${tabId}-cached-meta-inventory`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-inventory`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const expensesOption: OptionType[] = useMemo(
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
                fetchInventory(currentPage, itemsPerPage, searchTerm);
            }, 500);
        });
        return () => {
            PusherEcho.leave("inventory-channel");
        };
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    // ON LOAD LIST
    useEffect(() => {
        const productKey = `${tabId}-cached-inventory`;
        const metaKey = `${tabId}-cached-meta-inventory`;
        const mountKey = `${tabId}-mount-status-inventory`;

        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";
        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchInventory(currentPage, itemsPerPage, searchTerm);
            return;
        }

        const cachedProductsRaw = localStorage.getItem(productKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedProductsRaw || !cachedMetaRaw) {
            fetchInventory(currentPage, itemsPerPage, searchTerm);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedProducts = JSON.parse(cachedProductsRaw);

            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && cachedMeta.search === searchTerm;

            if (isCacheValid) {
                setInventory(cachedProducts);
                setTotalPages(cachedMeta.totalPages);
                localStorage.setItem(`${tabId}-loading-inventory`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchInventory(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    useEffect(() => {
        loadExpenses();
    }, [tabId]);

    useEffect(() => {
        fetchWithdrawList(currentPageWithdraw, itemsPerPageWithdraw, searchTermWithdraw, selectedDetails);
    }, [currentPageWithdraw, itemsPerPageWithdraw, searchTermWithdraw, selectedDetails, tabId]);

    const fetchInventory = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            // setLoading(true);
            localStorage.setItem(`${tabId}-loading-inventory`, JSON.stringify(true));

            const paginatedData = await inventoryService.getInventory(page, perPage, search);

            setInventory(paginatedData.data);
            setTotalPages(paginatedData.last_page);

            localStorage.setItem(`${tabId}-cached-inventory`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-inventory`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            console.error("Error fetching products:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-inventory`, JSON.stringify(false));
        }
    };
    const fetchWithdrawList = async (page = currentPageWithdraw, perPage = itemsPerPageWithdraw, search = "", sortId = selectedDetails) => {
        try {
            localStorage.setItem(`${tabId}-loading-withdraw`, JSON.stringify(true));
            const paginatedData = await inventoryService.getWithdrawList(page, perPage, search, sortId);
            setWithdrawList(paginatedData.data);
            setTotalPages_Withdraw(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching withdraw:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-withdraw`, JSON.stringify(false));
        }
    };
    const loadExpenses = async () => {
        try {
            const list = await fetchAllExpenses(); // fetches & returns
            setExpensesData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadExpenses:", err);
        }
    };
    const handleToggleRow = async (tableId: number) => {
        const isExpanded = expanded_Inventory.includes(tableId);
        const cachedKey = tabId + "_cachedGRNDetails_" + tableId;
        const expandedKey = tabId + "_expandedKey";

        if (isExpanded) {
            // Collapse row
            const updated = expanded_Inventory.filter((product_id) => product_id !== tableId);
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
        } else {
            // Expand row
            const updated = [...expanded_Inventory, tableId];
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
            try {
                const data = inventoryList.find((po) => po.product_id === tableId);
                // Save to state
                if (!data?.details) {
                    setInventoryDetailMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.details;
                setInventoryDetailMap((prev) => ({ ...prev, [tableId]: details }));
                localStorage.setItem(cachedKey, JSON.stringify(details));
            } catch (error) {
                console.error(`Failed to load details for product ${tableId}`, error);
                setInventoryDetailMap((prev) => ({ ...prev, [tableId]: null }));
            }
        }
    };
    const handleSelectAllocation = (product_id: number, checked: boolean) => {
        if (checked) {
            selectedInventory((prev) => [...prev, product_id]);
        } else {
            selectedInventory((prev) => prev.filter((pid) => pid !== product_id));
            selectedInventory2((prev) => prev.filter((pid) => pid !== product_id));
        }
    };
    const handleSelectAllocation2 = (product_id: number, checked: boolean) => {
        if (checked) {
            selectedInventory((prev) => [...prev, product_id]);
            selectedInventory2((prev) => [...prev, product_id]);
        } else {
            selectedInventory((prev) => prev.filter((pid) => pid !== product_id));
            selectedInventory2((prev) => prev.filter((pid) => pid !== product_id));
        }
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = inventoryList?.map((p: any) => p.product_id);
            selectedInventory(allIds);
        } else {
            selectedInventory([]);
            selectedInventory2([]);
        }
    };
    const handleHoldQtyChange = (index: number, value: string) => {
        setInventory((prev) => {
            const updatedProducts = [...prev];
            const newValue = value === "" ? 0 : Number(value);
            updatedProducts[index] = {
                ...updatedProducts[index],
                new_hold_qty: newValue,
            };
            return updatedProducts;
        });
    };
    const handleDetailChange2 = (id: number, value: OptionType | null, column: string) => {
        setWithdrawList((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    const updatedItem: any = { ...item };
                    updatedItem[column] = value;
                    return updatedItem;
                }
                return item;
            })
        );
    };
    const handleDetailChange3 = (id: number, value: string, column: string) => {
        setWithdrawList((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    const updatedItem: any = { ...item };
                    const is_hold = selectedDetails2.find((product_id) => product_id === updatedItem.product_id) ? 1 : 0;
                    updatedItem[column] = value;
                    updatedItem["is_hold"] = is_hold;
                    const newQty = value === "" ? 0 : value;
                    const purpose = updatedItem.purpose;
                    const rem_qty = updatedItem.rem_qty;
                    if (is_hold > 0) {
                        if (Number(newQty) > Number(updatedItem.hold_qty)) {
                            showErrorToast(translations["Remaining quantity is"] + " " + updatedItem.hold_qty);
                            updatedItem["new_qty"] = 0;
                            return updatedItem;
                        }
                    }
                    if (!purpose) {
                        showErrorToast(translations["Purpose is required"]);
                        updatedItem["new_qty"] = 0;
                        return updatedItem;
                    }
                    if (Number(newQty) > Number(rem_qty)) {
                        showErrorToast(translations["Remaining quantity is"] + " " + rem_qty);
                        updatedItem["new_qty"] = 0;
                        return updatedItem;
                    }
                    return updatedItem;
                }
                return item;
            })
        );
    };
    const handleSubmitWithdraw = async () => {
        let count = 0;
        const data = new FormData();
        withdrawList.forEach((list) => {
            if (list) {
                if (Number(list.new_qty) > 0) {
                    const purpose = (list.purpose as OptionType).value;
                    data.append(
                        "details[]",
                        JSON.stringify({
                            id: list.id,
                            product_id: list.product_id,
                            new_qty: list.new_qty,
                            price: list.item_cost,
                            purpose: purpose,
                            warehouse: list.warehouse_code,
                            is_hold: list.is_hold,
                            currency: baseCurrency(),
                        })
                    );
                    count++;
                }
            }
        });
        if (count > 0) {
            try {
                const result = await inventoryService.updateWithdrawInventory(data);
                if (result.token === "Error") {
                    showErrorToast(result.message);
                    return;
                }
                selectedInventory([]);
                selectedInventory2([]);
                fetchInventory(currentPage, itemsPerPage, searchTerm);
                fetchWithdrawList(currentPageWithdraw, itemsPerPageWithdraw, searchTermWithdraw, selectedDetails);
                setShowWithdrawFromInventory(false);
                showSuccessToast(translations[result.message] || result.message);
            } catch (error) {
                showErrorToast(translations["Failed to save Transaction."] || "Failed to save Transaction.");
            }
        }
    };
    const handleWithdrawFromInventory = () => {
        setShowWithdrawFromInventory(true);
    };
    const renderWithdrawFromInventory = () => {
        if (!showFromInventory) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[90vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Withdraw From Inventory"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowWithdrawFromInventory(false);
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
                                        value={searchTermWithdraw}
                                        onChange={(e) => {
                                            setSearchTermWithdraw(e.target.value);
                                            setCurrentPageWithdraw(1);
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
                                        <th className="w-[10%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Product Code"]}</th>
                                        <th className="w-[30%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Product Name"]}</th>
                                        <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["RemQty"]}</th>
                                        <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Price"]}</th>
                                        <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Ware House"]}</th>
                                        <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Purpose"]}</th>
                                        <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Qty"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawList.map((list, index) => (
                                        <React.Fragment key={list.id || index}>
                                            <tr
                                                key={list.id || index}
                                                className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                                style={{ borderColor: "#40404042" }}
                                            >
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
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{list.rem_qty}</td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {baseCurrency()} {formatMoney(list.item_cost)}
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{list.warehouse_code}</td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <Select
                                                        classNamePrefix="react-select"
                                                        value={list.purpose}
                                                        onChange={(selected) => {
                                                            handleDetailChange2(list.id, selected as OptionType | null, "purpose");
                                                        }}
                                                        options={expensesOption}
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
                                                        value={list.new_qty === 0 ? "" : list.new_qty}
                                                        placeholder="0"
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            if (/^\d*\.?\d*$/.test(value)) {
                                                                handleDetailChange3(list.id, e.target.value, "new_qty");
                                                            }
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
                            <MemoizedPagination currentPage={currentPageWithdraw} totalPages={totalPagesWithdraw} onPageChange={(page) => setCurrentPageWithdraw(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPageWithdraw}
                                onChange={(val: number) => {
                                    setItemsPerPageWithdraw(val);
                                    setCurrentPageWithdraw(1);
                                }}
                                options={pageSizeOptionsInventory}
                            />
                        </div>
                        <div className="flex items-center space-x-1">
                            <button onClick={() => setShowWithdrawFromInventory(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                                {translations["Close"]}
                            </button>
                            <button onClick={() => handleSubmitWithdraw()} className="px-2 py-2 bg-cyan-700 hover:bg-cyan-600 rounded text-white transition">
                                {translations["Submit"]}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    const handleHoldOnHold = async (type: string, index: number) => {
        const thirdItem = inventoryList[index];
        var hold_qty = type === "Unhold" ? 0 : thirdItem["new_hold_qty"];
        await preorderService.holdOnHold(thirdItem["product_id"], hold_qty);
        setInventory((prev) => {
            const updatedProducts = [...prev];
            updatedProducts[index] = {
                ...updatedProducts[index],
                new_hold_qty: hold_qty,
                hold_qty: hold_qty,
            };
            return updatedProducts;
        });
        showSuccessToast(translations["Record Successfully Updated"]);
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
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleWithdrawFromInventory}
                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                            >
                                <span>{translations["Withdraw From Inventory"]}</span>
                            </button>
                        </div>
                    </div>
                </div>
                {/* Table */}
                <div className="overflow-x-auto flex-grow">
                    <div className="h-[calc(100vh-180px)] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[2%]"></th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[2%]">
                                        <div className="flex items-center h-full">
                                            <CustomCheckbox checked={selectedDetails.length === inventoryList?.length && inventoryList?.length > 0} onChange={(checked) => handleSelectAll(checked)} />
                                        </div>
                                    </th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[29%]">{translations["Products"]}</th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[13%]">{translations["Location"]}</th>
                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-[5%]">{translations["Rem Qty"]}</th>
                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-[8%]">{translations["Cost"]}</th>
                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-[8%]">{translations["TotalValue"]}</th>
                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-[7%]">{translations["Retail Value"]}</th>
                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-[7%]">{translations["Last Sold Date"]}</th>
                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-[7%]">{translations["Age (Days)"]}</th>
                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-[5%]">{translations["HoldQty"]}</th>
                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-[5%]">{translations["Action"]}</th>
                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-[2%]"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventoryList.map((list, index) => (
                                    <React.Fragment key={list.product_id || index}>
                                        <tr
                                            key={list.product_id || index}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleToggleRow(list.product_id)}
                                                    className={`px-1 py-1 ${
                                                        expanded_Inventory.includes(list.product_id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                    } text-white rounded-lg transition-colors text-xs`}
                                                >
                                                    {expanded_Inventory.includes(list.product_id) ? <Minus size={16} /> : <Plus size={16} />}
                                                </button>
                                            </td>
                                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                <CustomCheckbox
                                                    checked={selectedDetails.includes(list.product_id as number)}
                                                    onChange={(checked) => handleSelectAllocation(list.product_id as number, checked)}
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <div className="flex items-center space-x-3">
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                        }}
                                                        className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center"
                                                    >
                                                        <img
                                                            src={`${import.meta.env.VITE_BASE_URL}/storage/${list.product_thumbnail ?? "products/no-image-min.jpg"}`}
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
                                                            <CopyToClipboard text={list.product_code || ""} />
                                                        </div>
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-400 text-custom-sm">{lang == "en" ? list.product_title_en : list.product_title_cn}</p>
                                                            <CopyToClipboard text={lang == "en" ? list.product_title_en || "" : list.product_title_cn || ""} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">{lang == "en" ? list.warehouse_en : list.warehouse_cn}</p>
                                                    <CopyToClipboard text={lang == "en" ? list.warehouse_en || "" : list.warehouse_cn || ""} />
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{list.rem_qty}</td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {baseCurrency()}
                                                <br></br>
                                                {formatMoney(list.item_cost)}
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {baseCurrency()}
                                                <br></br>
                                                {formatMoney(list.total_cost)}
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                {list.retail_currency}
                                                <br></br>
                                                {formatMoney(list.retail_price)}
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{formatDate(list.last_sold_date, lang)}</td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{list.age_day}</td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                <input
                                                    type="text"
                                                    value={list.new_hold_qty === 0 ? "" : list.new_hold_qty}
                                                    readOnly={list.hold_qty > 0}
                                                    onChange={(e) => {
                                                        const raw = e.target.value.replace(/\D/g, ""); // Keep numbers only
                                                        const num = raw ? String(raw) : "0";
                                                        const unsold_qty = list.rem_qty;
                                                        if (Number(num) > unsold_qty) {
                                                            showErrorToast(translations["Please input number lower than or equal to"] + " " + unsold_qty);
                                                            return;
                                                        }
                                                        handleHoldQtyChange(index, num);
                                                    }}
                                                    placeholder="0"
                                                    className="w-20 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm text-center"
                                                />
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                <button
                                                    type="button"
                                                    disabled={list.new_hold_qty === 0}
                                                    onClick={() => handleHoldOnHold(list.hold_qty > 0 ? "Unhold" : "Hold", index)}
                                                    className="px-1 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm"
                                                >
                                                    <span>{list.hold_qty > 0 ? translations["Unhold"] : translations["Hold"]}</span>
                                                </button>
                                            </td>
                                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                {list.hold_qty > 0 && (
                                                    <CustomCheckbox
                                                        checked={selectedDetails2.includes(list.product_id as number)}
                                                        onChange={(checked) => handleSelectAllocation2(list.product_id as number, checked)}
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                        {expanded_Inventory.includes(list.product_id) && (
                                            <tr>
                                                <td colSpan={12} className="py-3 px-4">
                                                    <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                        <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                <th className="w-auto text-left py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Location"]}</th>
                                                                <th className="w-auto text-center py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Received Qty."]}</th>
                                                                <th className="w-auto text-center py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Allocated Qty."]}</th>
                                                                <th className="w-auto text-center py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Remaining Qty."]}</th>
                                                                <th className="w-auto text-center py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Cost Value"]}</th>
                                                                <th className="w-auto text-center py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Retail Value"]}</th>
                                                                <th className="w-auto text-center py-2 px-4 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Age (Days)"]}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {inventoryDetailMap[list.product_id] && inventoryDetailMap[list.product_id]!.length > 0 ? (
                                                                inventoryDetailMap[list.product_id]!.map((detail, i) => (
                                                                    <tr key={detail.product_id || i}>
                                                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">
                                                                            {highlightMatch(
                                                                                lang === "en"
                                                                                    ? detail.warehouse_en
                                                                                        ? detail.warehouse_en
                                                                                        : translations["N.A."] || "N.A."
                                                                                    : detail.warehouse_cn
                                                                                    ? detail.warehouse_cn
                                                                                    : translations["N.A."] || "N.A.",
                                                                                searchTerm
                                                                            )}
                                                                        </td>
                                                                        <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{detail.qty}</td>
                                                                        <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{detail.allocated_qty}</td>
                                                                        <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{detail.rem_qty}</td>
                                                                        <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                                            {baseCurrency()} {detail.item_cost}
                                                                        </td>
                                                                        <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                                            {detail.retail_currency} {detail.retail_price}
                                                                        </td>
                                                                        <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{detail.age_day}</td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={8} className="py-3 px-4 text-center text-gray-400 text-sm">
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
                                ))}
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
                        <ExportReportSelector formats={["odt", "ods", "xlsx"]} baseName="ProductInventory" ids={selectedDetails} language={lang} />
                    </div>
                    <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                </div>
            </div>
            {renderWithdrawFromInventory()}
        </div>
    );
};
export default InventoryList;

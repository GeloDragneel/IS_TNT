import React, { useState, useEffect, useMemo, useRef } from "react";
import { preorderService, ApiPreorder } from "@/services/preorderService";
import { useLanguage } from "@/context/LanguageContext";
import { highlightMatch } from "@/utils/highlightMatch";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CopyToClipboard from "@/components/CopyToClipboard";
import PusherEcho from "@/utils/echo";
import { ChevronDown, Plus, Minus } from "lucide-react";
import { baseCurrency, formatDate, formatMoney } from "@/utils/globalFunction";
// Handle the Smooth skeleton loading
// localStorage.clear();
interface LoadingSpinnerTbodyProps {
    rowsCount: number;
}
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);
const LoadingSpinnerTbody: React.FC<LoadingSpinnerTbodyProps> = ({ rowsCount }) => {
    return (
        <tbody>
            {Array.from({ length: rowsCount }).map((_, idx) => (
                <tr key={idx} className="bg-transparent-900 border-b border-gray-800">
                    <td className="text-center py-1 px-4">
                        <div className="h-6 bg-gray-800 rounded w-5 mx-auto"></div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="h-6 bg-gray-800 rounded w-5 mx-auto"></div>
                    </td>
                    <td className="py-1 px-4 text-gray-400 text-left text-custom-sm">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16"></div>
                            <div className="h-4 bg-gray-800 rounded w-32"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-16 mx-auto"></div>
                        </div>
                    </td>
                </tr>
            ))}
        </tbody>
    );
};
// localStorage.clear();
interface PerformanceProps {
    tabId: string;
    onPreordertSelect: (preorderId: number, saveType?: string) => void;
    onChangeView: (view: "list" | "details" | "unsold" | "performance") => void; // <- NEW
    onInitiateCopy: (sourcePreorderId: number, settings: any) => void;
    selectedPreorder: number[];
    onselectedPreorderChange: (selected: number[]) => void;
    expandedRows: number[];
    onExpandedRowsChange: (expanded: number[]) => void;
}
interface ApiperformanceFooter {
    base_total_cost: number;
}
interface DetailsExpanded {
    id: number;
    customer_id: number;
    product_code: string;
    product_title_en: string;
    product_title_cn: string;
    currency: string;
    qty: number;
    price: number;
    total: number;
    cost: number;
    deposit: number;
    profit: number;
}
const Performance: React.FC<PerformanceProps> = ({ tabId, onChangeView }) => {
    const { translations, lang } = useLanguage();
    const [products, setPerformance] = useState<ApiPreorder[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [performanceFooter, setPerformanceFooter] = useState<ApiperformanceFooter | null>(null);
    const [performanceFooter2, setPerformanceFooter2] = useState<ApiperformanceFooter | null>(null);
    const [expanded_Performance, setExpanededRows] = useState<number[]>([]);
    const [performanceMap, setPerformanceMap] = useState<Record<number, DetailsExpanded[] | null>>({});

    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-performance`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });

    const initialDropdowns = [
        { value: "Orders1", label: "Preorder (Retail Customer)", active: true },
        { value: "Orders2", label: "Preorder (Wholesale Customer)", active: false },
        { value: "Orders3", label: "Preorder (Retail Customer / Sales Person)", active: false },
        { value: "Orders4", label: "Preorder (Wholesale Customer / Sales Person)", active: false },
        { value: "Invoice1", label: "Sales Invoice (Retail Customer / Sales Person)", active: false },
        { value: "Invoice2", label: "Sales Invoice (Wholesale Customer / Sales Person)", active: false },
        { value: "Invoice3", label: "Sales Invoice (Retail Customer)", active: false },
        { value: "Invoice4", label: "Sales Invoice (Wholesale Customer)", active: false },
    ];

    const [dropdownsState, setDropdownsState] = useState(initialDropdowns);
    const [showDropdown, setShowDropdown] = useState(false);

    const activeItem = dropdownsState.find((item) => item.active);
    const [activeDropdown, setActiveDropdown] = useState(activeItem?.value);
    const handleItemClick = (item: any) => {
        setDropdownsState((prev) =>
            prev.map((d) => ({
                ...d,
                active: d.value === item.value,
            }))
        );
        setShowDropdown(false);
        setActiveDropdown(item.value);
        fetchPerformance(currentPage, itemsPerPage, searchTerm, item.value);
    };
    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-performance`;
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
        const metaKey = `${tabId}-cached-meta-performance`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-performance`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    // REALTIME
    useEffect(() => {
        const channel = PusherEcho.channel("products-channel");
        channel.listen(".product-event", () => {
            fetchPerformance(currentPage, itemsPerPage, searchTerm, activeDropdown);
        });
        return () => {
            PusherEcho.leave("products-channel");
        };
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    // ON LOAD LIST
    useEffect(() => {
        const productKey = `${tabId}-cached-performance`;
        const metaKey = `${tabId}-cached-meta-performance`;
        const mountKey = `${tabId}-mount-status-performance`;
        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";
        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchPerformance(currentPage, itemsPerPage, searchTerm, activeDropdown);
            return;
        }

        const cachedProductsRaw = localStorage.getItem(productKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);
        if (!cachedProductsRaw || !cachedMetaRaw) {
            fetchPerformance(currentPage, itemsPerPage, searchTerm, activeDropdown);
            return;
        }
        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedProducts = JSON.parse(cachedProductsRaw);
            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && JSON.stringify(cachedMeta.search) === JSON.stringify(searchTerm.search);

            if (isCacheValid) {
                setPerformance(cachedProducts);
                setTotalPages(cachedMeta.totalPages);
                setTotalItems(cachedMeta.totalItems);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-performance`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }
        fetchPerformance(currentPage, itemsPerPage, searchTerm, activeDropdown);
    }, [currentPage, itemsPerPage, tabId]);

    const fetchPerformance = async (page = currentPage, perPage = itemsPerPage, search: "", type = activeDropdown) => {
        try {
            setLoading(true);
            localStorage.setItem(`${tabId}-loading-performance`, JSON.stringify(true));
            const paginatedData = await preorderService.getAllPerformance(page, perPage, search, type);
            setPerformance(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            setTotalItems(paginatedData.total);
            setPerformanceFooter(paginatedData.footer);
            setPerformanceFooter2(paginatedData.footer2);
            localStorage.setItem(`${tabId}-cached-performance`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-performance`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            console.error("Error fetching preorder:", err);
        } finally {
            setLoading(false);
            localStorage.setItem(`${tabId}-loading-performance`, JSON.stringify(false));
        }
    };
    // Filter products based on search term
    const filteredProducts = products.filter((product) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            product.id?.toString().includes(searchLower) ||
            product.customer_code?.toLowerCase().includes(searchLower) ||
            product.account_name_en?.toLowerCase().includes(searchLower) ||
            product.account_name_cn?.toLowerCase().includes(searchLower) ||
            product.sales_person_name?.toLowerCase().includes(searchLower)
        );
    });

    const handleToggleRow = async (tableId: number, customerId: number) => {
        const isExpanded = expanded_Performance.includes(tableId);
        var cachedKey = `cached-performance-details${tableId}`;

        if (isExpanded) {
            // Collapse row
            setExpanededRows(expanded_Performance.filter((id) => id !== tableId));
        } else {
            // Expand row
            setExpanededRows([...expanded_Performance, tableId]);
            // Try to get from localStorage first
            const cachedData = localStorage.getItem(cachedKey);
            if (cachedData) {
                // If cache exists, parse and set it
                setPerformanceMap((prev) => ({ ...prev, [tableId]: JSON.parse(cachedData) }));
            } else {
                // If no cache, fetch from API
                try {
                    const type = activeDropdown;
                    const data = await preorderService.getPerformanceDetails(customerId, type ?? "");
                    // Save to state
                    setPerformanceMap((prev) => ({ ...prev, [tableId]: data }));
                    // Save to localStorage
                    localStorage.setItem(cachedKey, JSON.stringify(data));
                } catch (error) {
                    console.error(`Failed to load details for performance ${tableId}`, error);
                    setPerformanceMap((prev) => ({ ...prev, [tableId]: null }));
                }
            }
        }
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
                            <button
                                onClick={() => onChangeView("list")}
                                className="ml-2 px-3 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Orders"]}</span>
                            </button>
                            <button
                                onClick={() => onChangeView("unsold")}
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-cyan-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Unsold Orders"]}</span>
                            </button>
                            <button
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#0891b2", borderColor: "#0891b2", marginLeft: "5px" }}
                            >
                                <span>{translations["SalesPerformance"]}</span>
                            </button>
                            {/* Dropdown Button */}
                            <div className={`relative border-round-3 bg-[#2d2d30] border-[#2d2d30]`} style={{ borderColor: "#2d2d30", marginLeft: "5px" }}>
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className={`ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center text-sm bg-[#2d2d30] border-[#2d2d30]`}
                                >
                                    {activeItem ? (
                                        <>
                                            <span className="mr-1">{translations[activeItem.label]}</span>
                                            <ChevronDown size={16} />
                                        </>
                                    ) : (
                                        <>
                                            <span className="mr-1">{translations["Smart Search"]}</span>
                                            <ChevronDown size={16} />
                                        </>
                                    )}
                                </button>
                                {/* Dropdown Menu */}
                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                        <ul className="py-1 text-sm text-gray-700">
                                            {dropdownsState.map((item) => (
                                                <li key={item.value}>
                                                    <button
                                                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${item.active ? "bg-gray-200 font-semibold" : ""}`}
                                                        onClick={() => handleItemClick(item)}
                                                    >
                                                        {translations[item.label]}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Table */}
                <div className="overflow-x-auto flex-grow">
                    <div className="h-[calc(100vh-215px)] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    {(() => {
                                        switch (activeItem?.value) {
                                            case "Orders1":
                                            case "Orders2":
                                                return (
                                                    <>
                                                        <th className="text-left py-1 px-4 text-gray-400 text-sm w-12"></th>
                                                        <th className="text-left py-1 px-4 text-gray-400 text-sm w-12"></th>
                                                        <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Customer"]}</th>
                                                        <th className="text-center py-2 px-4 text-gray-400 text-sm">{translations["Qty"]}</th>
                                                        <th className="text-center py-2 px-4 text-gray-400 text-sm">{translations["Total Purchase"]}</th>
                                                        <th className="text-center py-2 px-4 text-gray-400 text-sm">{translations["Total Deposit"]}</th>
                                                        <th className="text-center py-2 px-4 text-gray-400 text-sm">{translations["Total Profit"]}</th>
                                                        <th className="text-center py-2 px-4 text-gray-400 text-sm">{translations["Profit"]}%</th>
                                                    </>
                                                );
                                            case "Orders3":
                                            case "Orders4":
                                            case "Invoice1":
                                            case "Invoice2":
                                                return (
                                                    <>
                                                        <th className="text-left py-1 px-4 text-gray-400 text-sm w-12"></th>
                                                        <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Sales Person"]}</th>
                                                        <th className="text-center py-2 px-4 text-gray-400 text-sm">{translations["Total Sales"]}</th>
                                                        <th className="text-center py-2 px-4 text-gray-400 text-sm">{translations["Total Profit"]}</th>
                                                        <th className="text-center py-2 px-4 text-gray-400 text-sm">{translations["Profit"]}%</th>
                                                    </>
                                                );
                                            case "Invoice3":
                                            case "Invoice4":
                                                return (
                                                    <>
                                                        <th className="text-left py-1 px-4 text-gray-400 text-sm w-12"></th>
                                                        <th className="text-left py-1 px-4 text-gray-400 text-sm w-12"></th>
                                                        <th className="text-left py-2 px-4 text-gray-400 text-sm">{translations["Customer"]}</th>
                                                        <th className="text-center py-2 px-4 text-gray-400 text-sm">{translations["Total Purchase"]}</th>
                                                        <th className="text-center py-2 px-4 text-gray-400 text-sm">{translations["Total Deposit"]}</th>
                                                        <th className="text-center py-2 px-4 text-gray-400 text-sm">{translations["Total Profit"]}</th>
                                                        <th className="text-center py-2 px-4 text-gray-400 text-sm">{translations["Profit"]}%</th>
                                                    </>
                                                );
                                            default:
                                                return null; // Return nothing if no matching case
                                        }
                                    })()}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product, index) => (
                                    <React.Fragment key={product.id || index}>
                                        <tr key={product.id || index} className="border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer" style={{ borderColor: "#40404042" }}>
                                            {(activeItem?.value === "Orders1" || activeItem?.value === "Orders2") && (
                                                <>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{index + 1}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <button
                                                            onClick={() => handleToggleRow(product.id, product.customer_id)}
                                                            className={`px-1 py-1 
                                        ${expanded_Performance.includes(product.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                                        text-white rounded-lg transition-colors text-xs`}
                                                        >
                                                            {expanded_Performance.includes(product.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                        </button>
                                                    </td>
                                                    <td className="py-2 px-2">
                                                        <div className="flex items-center space-x-3">
                                                            <div>
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-300 text-custom-sm select-text">{highlightMatch(product.customer_code, searchTerm)}</p>
                                                                    <CopyToClipboard text={product.customer_code} />
                                                                </div>
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-400 text-custom-sm">
                                                                        {highlightMatch(lang === "en" ? product.account_name_en : product.account_name_cn, searchTerm)}
                                                                    </p>
                                                                    <CopyToClipboard text={lang === "en" ? product.account_name_en : product.account_name_cn} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{product.total_qty}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {baseCurrency()}
                                                        <br></br>
                                                        {formatMoney(product.total_base_total)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {baseCurrency()}
                                                        <br></br>
                                                        {formatMoney(product.total_base_deposit)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {baseCurrency()}
                                                        <br></br>
                                                        {formatMoney(product.total_e_profit)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{product.profit_percentage}%</td>
                                                </>
                                            )}
                                            {(activeItem?.value === "Orders3" || activeItem?.value === "Orders4" || activeItem?.value === "Invoice1" || activeItem?.value === "Invoice2") && (
                                                <>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{index + 1}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{product.sales_person_name}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {baseCurrency()}
                                                        <br></br>
                                                        {formatMoney(product.total_base_total)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {baseCurrency()}
                                                        <br></br>
                                                        {formatMoney(product.total_e_profit)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{product.profit_percentage}%</td>
                                                </>
                                            )}
                                            {(activeItem?.value === "Invoice3" || activeItem?.value === "Invoice4") && (
                                                <>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{index + 1}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <button
                                                            onClick={() => handleToggleRow(product.id, product.customer_id)}
                                                            className={`px-1 py-1 
                                        ${expanded_Performance.includes(product.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                                        text-white rounded-lg transition-colors text-xs`}
                                                        >
                                                            {expanded_Performance.includes(product.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                        </button>
                                                    </td>
                                                    <td className="py-2 px-2">
                                                        <div className="flex items-center space-x-3">
                                                            <div>
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-300 text-custom-sm select-text">{highlightMatch(product.customer_code, searchTerm)}</p>
                                                                    <CopyToClipboard text={product.customer_code} />
                                                                </div>
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-400 text-custom-sm">
                                                                        {highlightMatch(lang === "en" ? product.account_name_en : product.account_name_cn, searchTerm)}
                                                                    </p>
                                                                    <CopyToClipboard text={lang === "en" ? product.account_name_en : product.account_name_cn} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {baseCurrency()}
                                                        <br></br>
                                                        {formatMoney(product.total_base_total)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {baseCurrency()}
                                                        <br></br>
                                                        {formatMoney(product.total_base_deposit)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {baseCurrency()}
                                                        <br></br>
                                                        {formatMoney(product.total_e_profit)}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{product.profit_percentage}%</td>
                                                </>
                                            )}
                                        </tr>
                                        {expanded_Performance.includes(product.id) && (
                                            <tr>
                                                <td colSpan={8} className="py-2 px-2">
                                                    <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                        <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                <th className="text-left py-2 px-4 text-gray-400 text-sm w-12">{translations["Product Code"]}</th>
                                                                <th className="text-left py-2 px-4 text-gray-400 text-sm w-12">{translations["Product Name"]}</th>
                                                                <th className="text-center py-2 px-4 text-gray-400 text-sm w-12">{translations["Qty"]}</th>
                                                                <th className="text-center py-2 px-4 text-gray-400 text-sm w-12">{translations["Price"]}</th>
                                                                <th className="text-center py-2 px-4 text-gray-400 text-sm w-12">{translations["Total"]}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {performanceMap[product.id] && performanceMap[product.id]!.length > 0 ? (
                                                                performanceMap[product.id]!.map((detail, i) => (
                                                                    <tr key={detail.id || i}>
                                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                            <div className="group flex items-center">
                                                                                <p className="text-gray-400 text-custom-sm">{detail.product_code}</p>
                                                                                <CopyToClipboard text={detail.product_code} />
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                                            <div className="group flex items-center">
                                                                                <p className="text-gray-400 text-custom-sm">{lang === "en" ? detail.product_title_en : detail.product_title_cn}</p>
                                                                                <CopyToClipboard text={lang === "en" ? detail.product_title_en : detail.product_title_cn} />
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{detail.qty}</td>
                                                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                            {detail.currency} {formatMoney(detail.price)}
                                                                        </td>
                                                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                                            {detail.currency} {formatMoney(detail.total)}
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={6} className="py-2 px-2 text-center text-gray-400 text-sm">
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
                        <select
                            className="px-3 py-2 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm my-important-dropdown"
                            style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30" }}
                        >
                            <option value="Performance.odt">{translations["OpenOffice Writer Document (.odt)"]}</option>
                            <option value="Performance.ods">{translations["OpenOffice Calc Spreadsheet (.ods)"]}</option>
                            <option value="Performance.xlsx">{translations["Ms Excel SpreadSheet (.xlsx)"]}</option>
                        </select>
                        <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                            <span>{translations["MCGenerate"]}</span>
                        </button>
                        <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                            <span>{translations["buttontextcustomize"]}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Performance;

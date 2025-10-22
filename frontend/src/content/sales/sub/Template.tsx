import React, { useState, useEffect, useMemo, useRef } from "react";
import { massMailerService, ApiMassMailer } from "@/services/massMailerService";
import { useLanguage } from "@/context/LanguageContext";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showConfirm } from "@/utils/alert";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import PusherEcho from "@/utils/echo";
import { X, Search, Minus, Plus } from "lucide-react";
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
                    <td className="text-left py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-full"></div>
                            <div className="h-4 bg-gray-800 rounded w-full"></div>
                        </div>
                    </td>
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
                            <div className="h-4 bg-gray-800 rounded w-full"></div>
                        </div>
                    </td>
                </tr>
            ))}
        </tbody>
    );
};
// localStorage.clear();
interface TemplateListProps {
    tabId: string;
    onPreordertSelect: (preorderId: number, saveType?: string) => void;
    onChangeView: (view: "list" | "details" | "settings" | "tags" | "template", from: string) => void;
    selectedPreorder: number[];
    onSelectedMassMailerChange: (selected: number[]) => void;
    fromView: string; // <-- Add this
}
const TemplateList: React.FC<TemplateListProps> = ({ tabId, onPreordertSelect, onChangeView, selectedPreorder, onSelectedMassMailerChange, fromView }) => {
    const { translations, lang } = useLanguage();
    const [products, setProducts] = useState<ApiMassMailer[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-template`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });
    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-template`;
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
        const metaKey = `${tabId}-cached-meta-template`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-template`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.filters.search || "";
        } catch {
            return "";
        }
    });
    useEffect(() => {
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && document.activeElement === inputRef.current) {
                setSearchTerm("");
            }
        };
        window.addEventListener("keydown", handleEscKey);
        return () => {
            window.removeEventListener("keydown", handleEscKey);
        };
    }, []);

    useEffect(() => {
        const channel = PusherEcho.channel("mass-mailer-channel");
        channel.listen(".mass-mailer-event", (data: any) => {
            fetchTemplates();
        });
        return () => {
            PusherEcho.leave("mass-mailer-channel");
        };
    }, [tabId]);

    // ON LOAD LIST
    useEffect(() => {
        const productKey = `${tabId}-cached-mass-template`;
        const metaKey = `${tabId}-cached-meta-template`;
        const mountKey = `${tabId}-mount-status-template`;
        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";
        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchTemplates(currentPage, itemsPerPage, searchTerm);
            return;
        }
        const cachedProductsRaw = localStorage.getItem(productKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);
        if (!cachedProductsRaw || !cachedMetaRaw) {
            fetchTemplates(currentPage, itemsPerPage, searchTerm);
            return;
        }
        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedProducts = JSON.parse(cachedProductsRaw);

            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && JSON.stringify(cachedMeta.search) === JSON.stringify(searchTerm);

            if (isCacheValid) {
                setProducts(cachedProducts);
                setTotalPages(cachedMeta.totalPages);
                setLoading(false);
                localStorage.setItem(`${tabId}-loading-template`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }
        fetchTemplates(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    const fetchTemplates = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            if (loading) {
                setLoading(true);
            }
            localStorage.setItem(`${tabId}-loading-template`, JSON.stringify(true));
            const paginatedData = await massMailerService.getTemplates(page, perPage, search);
            setProducts(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            localStorage.setItem(`${tabId}-cached-mass-template`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-template`,
                JSON.stringify({
                    page,
                    perPage,
                    search,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            console.error("Error fetching list:", err);
        } finally {
            setLoading(false);
            localStorage.setItem(`${tabId}-loading-template`, JSON.stringify(false));
        }
    };
    // Handle select all
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectedMassMailerChange(products.map((p) => p.id).filter(Boolean) as number[]);
        } else {
            onSelectedMassMailerChange([]);
        }
    };
    // Handle individual select
    const handleSelectPreorder = (preorderId: number, checked: boolean) => {
        if (checked) {
            onSelectedMassMailerChange([...selectedPreorder, preorderId]);
        } else {
            onSelectedMassMailerChange(selectedPreorder.filter((id) => id !== preorderId));
        }
    };
    const handleRowClick = (e: React.MouseEvent, preorderId: number) => {
        // Prevent navigation if clicking on checkboxes or toggle switches
        const target = e.target as HTMLElement;
        if (target.closest("input") || target.closest("label") || target.closest("[data-copy-button]")) {
            return;
        }
        onPreordertSelect(preorderId, preorderId == 0 ? "new" : "edit");
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
                                onClick={() => onChangeView(fromView !== "details" ? "list" : "details", "template")}
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-cyan-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Mass Mailer"]}</span>
                            </button>
                            <button
                                onClick={() => onChangeView("settings", "template")}
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Settings"]}</span>
                            </button>
                            <button
                                onClick={() => onChangeView("tags", "template")}
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Tags"]}</span>
                            </button>
                            <button
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#0891b2", borderColor: "#0891b2", marginLeft: "5px" }}
                            >
                                <span>{translations["Template"]}</span>
                            </button>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <button className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                                    <span>{translations["Add New"]}</span>
                                </button>
                                <button
                                    onClick={(e) => handleRowClick(e, 0)}
                                    className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Delete"]}</span>
                                </button>
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
                                    <th className="w-[5%] text-left py-1 px-2 text-gray-400 text-sm w-12">
                                        <CustomCheckbox
                                            checked={selectedPreorder.length === products.length && products.length > 0}
                                            onChange={(checked) => handleSelectAll(checked)}
                                            ariaLabel="Select all products"
                                        />
                                    </th>
                                    <th className="w-[50%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Template"]}</th>
                                    <th className="w-[45%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Action"]}</th>
                                </tr>
                            </thead>
                            {loading ? (
                                <LoadingSpinnerTbody rowsCount={itemsPerPage} />
                            ) : (
                                <tbody>
                                    {products.length === 0 ? (
                                        <tr>
                                            <td colSpan={14} className="py-4 px-4 text-center text-gray-400 text-sm border border-[#40404042]">
                                                {translations["No Record Found"] || "No Record Found"}
                                            </td>
                                        </tr>
                                    ) : (
                                        products.map((list, index) => (
                                            <React.Fragment key={list.id || index}>
                                                <tr
                                                    key={list.id || index}
                                                    className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors ${
                                                        selectedPreorder.includes(list.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                                    }`}
                                                    style={{ borderColor: "#40404042" }}
                                                >
                                                    <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                        <CustomCheckbox
                                                            checked={selectedPreorder.includes(list.id as number)}
                                                            onChange={(checked) => handleSelectPreorder(list.id as number, checked)}
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.template_name}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            // onClick={() => handleCreateShipment(list.invoice_no)}
                                                            className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700 mr-2"
                                                        >
                                                            <span>{translations["Apply"] || "Apply"}</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            // onClick={() => handleCreateShipment(list.invoice_no)}
                                                            className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700 mr-2"
                                                        >
                                                            <span>{translations["Edit"]}</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            // onClick={() => handleCreateShipment(list.invoice_no)}
                                                            className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700 mr-2"
                                                        >
                                                            <span>{translations["View"]}</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                            )}
                        </table>
                    </div>
                </div>
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-2">
                        <MemoizedPagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
                        <MemoizedItemsPerPageSelector
                            value={itemsPerPage}
                            onChange={(val: number) => {
                                setItemsPerPage(val);
                                setCurrentPage(1);
                            }}
                            options={pageSizeOptions}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateList;

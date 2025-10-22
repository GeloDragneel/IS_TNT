import React, { useState, useEffect, useMemo, useRef } from "react";
import { massMailerService, ApiMassMailer } from "@/services/massMailerService";
import { useLanguage } from "@/context/LanguageContext";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showConfirm } from "@/utils/alert";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import { X } from "lucide-react";
import PusherEcho from "@/utils/echo";
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
                    <td className="text-center py-1 px-4">
                        <div className="flex flex-col space-y-2 py-1 flex-1">
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
interface SettingListProps {
    tabId: string;
    onChangeView: (view: "list" | "details" | "settings" | "tags" | "template", from: string) => void;
    onSelectedMassMailerChange: (selected: number[]) => void;
    fromView: string; // <-- Add this
}
const SettingList: React.FC<SettingListProps> = ({ tabId, onChangeView, fromView }) => {
    const { translations, lang } = useLanguage();
    const [products, setProducts] = useState<ApiMassMailer[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const inputRef = useRef<HTMLInputElement>(null);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedSettings, setSelectSettings] = useState<number[]>([]);
    const [loading, setLoading] = useState(() => {
        const savedLoading = localStorage.getItem(`${tabId}-loading-mass-settings`);
        return savedLoading !== null ? JSON.parse(savedLoading) : true;
    });
    const [formData, setFormData] = useState({
        id: 0,
        sender_name: "",
        sender_email: "",
        reply_to: "",
    });
    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-mass-settings`;
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
        const metaKey = `${tabId}-cached-meta-mass-settings`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-mass-settings`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.filters.search || "";
        } catch {
            return "";
        }
    });

    useEffect(() => {
        const channel = PusherEcho.channel("mass-mailer-channel");
        channel.listen(".mass-mailer-event", (data: any) => {
            fetchSettings();
        });
        return () => {
            PusherEcho.leave("mass-mailer-channel");
        };
    }, [tabId]);

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

    // ON LOAD LIST
    useEffect(() => {
        const productKey = `${tabId}-cached-mass-settings`;
        const metaKey = `${tabId}-cached-meta-mass-settings`;
        const mountKey = `${tabId}-mount-status-mass-mailer`;
        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";
        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchSettings(currentPage, itemsPerPage, searchTerm);
            return;
        }
        const cachedProductsRaw = localStorage.getItem(productKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);
        if (!cachedProductsRaw || !cachedMetaRaw) {
            fetchSettings(currentPage, itemsPerPage, searchTerm);
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
                localStorage.setItem(`${tabId}-loading-mass-settings`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }
        fetchSettings(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    const fetchSettings = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            if (loading) {
                setLoading(true);
            }
            localStorage.setItem(`${tabId}-loading-mass-settings`, JSON.stringify(true));
            const paginatedData = await massMailerService.getSettings(page, perPage, search);
            setProducts(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            localStorage.setItem(`${tabId}-cached-mass-settings`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-mass-settings`,
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
            localStorage.setItem(`${tabId}-loading-mass-settings`, JSON.stringify(false));
        }
    };
    // Handle select all
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectSettings(products.map((p) => p.id).filter(Boolean) as number[]);
        } else {
            setSelectSettings([]);
        }
    };
    // Handle individual select
    const handSelectSingle = (rowId: number, checked: boolean) => {
        if (checked) {
            setSelectSettings([...selectedSettings, rowId]);
        } else {
            setSelectSettings(selectedSettings.filter((id) => id !== rowId));
        }
    };
    const handlePopup = (id: number) => {
        if (id === 0) {
            const clearData = {
                id: 0,
                sender_name: "",
                sender_email: "",
                reply_to: "",
            };
            setFormData(clearData);
        } else {
            const data = products.find((item) => item.id === id);
            const initialFormData = {
                id: Number(data?.id),
                sender_name: String(data?.sender_name),
                sender_email: String(data?.sender_email),
                reply_to: String(data?.reply_to),
            };
            setFormData(initialFormData);
        }
        setShowPopup(true);
    };
    const handleSavePopup = async () => {
        const data = new FormData();
        const sender_name = formData["sender_name"]?.toString().trim() ?? "";
        const sender_email = formData["sender_email"]?.toString().trim() ?? "";
        const reply_to = formData["reply_to"]?.toString().trim() ?? "";
        if (!sender_name || sender_name === "") {
            showErrorToast(translations["Sender name is required"] || "Sender email is required");
            return;
        }
        if (sender_email === "") {
            showErrorToast(translations["Sender email is required"] || "Sender email is required");
            return;
        }
        if (reply_to === "") {
            showErrorToast(translations["Reply To is required"] || "Reply To is required");
            return;
        }
        Object.keys(formData).forEach((key) => {
            let value = formData[key as keyof typeof formData];
            if (value !== null && value !== undefined) {
                data.append(key, value.toString());
            }
        });
        try {
            const result = await massMailerService.updateSettings(data);
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            if (result.token === "Warning") {
                showErrorToast(translations[result.message]);
                return;
            }
            fetchSettings();
            setShowPopup(false);
            setSelectSettings([]);
            showSuccessToast(translations[result.message] || result.message);
        } catch (error) {
            showErrorToast(translations["Failed to save Transaction."] || "Failed to save Transaction.");
        }
    };
    const renderPopup = () => {
        if (!showPopup) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[30vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white"></h2>
                            <h2 className="text-xl font-bold text-white">{translations["Settings"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowPopup(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="p-2 flex-1 overflow-auto">
                        <div className="max-h-[calc(100vh-435px)] overflow-y-auto">
                            <div className="grid grid-cols-12 gap-4 p-4">
                                <div className="col-span-12 flex flex-col">
                                    <label className="text-gray-400 text-sm mb-1">{translations["Sender Name"]}</label>
                                    <input
                                        type="text"
                                        value={formData.sender_name}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, sender_name: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="col-span-12 flex flex-col">
                                    <label className="text-gray-400 text-sm mb-1">{translations["Sender Email"]}</label>
                                    <input
                                        type="text"
                                        hidden={lang === "cn"}
                                        value={formData.sender_email}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, sender_email: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="col-span-12 flex flex-col">
                                    <label className="text-gray-400 text-sm mb-1">{translations["Reply To"]}</label>
                                    <input
                                        type="text"
                                        hidden={lang === "cn"}
                                        value={formData.reply_to}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData((prev) => ({ ...prev, reply_to: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-3 border-t border-[#ffffff1a] flex justify-end space-x-2">
                        <button onClick={() => setShowPopup(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button onClick={handleSavePopup} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition">
                            {translations["Save"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    const handleDeleteSelected = async () => {
        if (selectedSettings.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const confirmed = await showConfirm(translations["Delete Record"], translations["Are you sure you want to delete this record?"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const res = await massMailerService.deleteSettings(selectedSettings);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            fetchSettings();
            setSelectSettings([]);
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("No Record(s) Has Been Deleted : ", err);
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
                                onClick={() => onChangeView(fromView !== "details" ? "list" : "details", "settings")}
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-cyan-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Mass Mailer"]}</span>
                            </button>
                            <button
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#0891b2", borderColor: "#0891b2", marginLeft: "5px" }}
                            >
                                <span>{translations["Settings"]}</span>
                            </button>
                            <button
                                onClick={() => onChangeView("tags", "settings")}
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Tags"]}</span>
                            </button>
                            <button
                                onClick={() => onChangeView("template", "settings")}
                                className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                            >
                                <span>{translations["Template"]}</span>
                            </button>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <button onClick={(e) => handlePopup(0)} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                                    <span>{translations["Add New"]}</span>
                                </button>
                                <button onClick={handleDeleteSelected} className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
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
                                            checked={selectedSettings.length === products.length && products.length > 0}
                                            onChange={(checked) => handleSelectAll(checked)}
                                            ariaLabel="Select all products"
                                        />
                                    </th>
                                    <th className="w-[30%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Sender Name"]}</th>
                                    <th className="w-[30%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Sender Email"]}</th>
                                    <th className="w-[30%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Reply To"]}</th>
                                    <th className="w-[5%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Action"]}</th>
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
                                                        selectedSettings.includes(list.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                                    }`}
                                                    style={{ borderColor: "#40404042" }}
                                                >
                                                    <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                        <CustomCheckbox checked={selectedSettings.includes(list.id as number)} onChange={(checked) => handSelectSingle(list.id as number, checked)} />
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.sender_name}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.sender_email}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.reply_to}</td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePopup(list.id)}
                                                            className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700"
                                                        >
                                                            <span>{translations["Edit"]}</span>
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
                {renderPopup()}
            </div>
        </div>
    );
};

export default SettingList;

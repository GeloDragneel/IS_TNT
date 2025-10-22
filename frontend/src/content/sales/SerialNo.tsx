import React, { useState, useEffect, useMemo } from "react";
import { globalService, ApiSerialNo } from "@/services/globalService";
import { useLanguage } from "@/context/LanguageContext";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import { X } from "lucide-react";
import PusherEcho from "@/utils/echo";
import CopyToClipboard from "@/components/CopyToClipboard";
import { highlightMatch } from "@/utils/highlightMatch";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showErrorToast } from "@/utils/toast";
// Handle the Smooth skeleton loading
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);

interface ServiceListProps {
    tabId: string;
}
// localStorage.clear();
const ServiceList: React.FC<ServiceListProps> = ({ tabId }) => {
    const { translations } = useLanguage();
    const [serviceList, setAllocation] = useState<ApiSerialNo[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [selectedDetails, selectedService] = useState<number[]>([]);
    const [popupType, setPopupType] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-services`;
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
        const metaKey = `${tabId}-cached-meta-services`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-services`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [formData, setFormData] = useState({
        popup_value: "",
    });

    useEffect(() => {
        const channel = PusherEcho.channel("allocation-channel");
        channel.listen(".allocation-event", () => {
            fetchService(currentPage, itemsPerPage, searchTerm);
        });
        return () => {
            PusherEcho.leave("allocation-channel");
        };
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    // ON LOAD LIST
    useEffect(() => {
        fetchService(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    const fetchService = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            const paginatedData = await globalService.getSerialNo(page, perPage, search);
            setAllocation(paginatedData.data);
            setTotalPages(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching service:", err);
        }
    };
    const handleSelectSingle = (id: number, checked: boolean) => {
        if (checked) {
            selectedService((prev) => [...prev, id]);
        } else {
            selectedService((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = serviceList?.map((p: any) => p.id);
            selectedService(allIds);
        } else {
            selectedService([]);
        }
    };
    const handleDeleteSelected = async () => {
        if (selectedDetails.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
    };
    const handleSave = async () => {};
    const renderPopup = () => {
        if (!showPopup) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[20vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{popupType === "view" ? translations["Search Batch No"] : translations["No of Records"]}</h2>
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
                    <div className="grid grid-cols-12 gap-4 p-4">
                        <div className="col-span-12 flex flex-col">
                            <label className="text-gray-400 text-sm mb-1">{popupType === "view" ? translations["Batch No"] : translations["No of Records"]}</label>
                            <input
                                type="text"
                                value={formData.popup_value}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData((prev) => ({ ...prev, popup_value: value }));
                                }}
                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button onClick={() => setShowPopup(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button onClick={() => handleSave()} className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition`}>
                            {popupType === "view" ? translations["Search"] : translations["Generate"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    return (
        <div className="space-y-0">
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
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => {
                                        setShowPopup(true);
                                        setPopupType("generate");
                                    }}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Generate"]}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPopup(true);
                                        setPopupType("view");
                                    }}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["View Batch No"]}</span>
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
                                    <th className="w-[5%] py-2 px-2 text-gray-400 text-sm">
                                        <div className="flex items-center justify-center h-full">
                                            <CustomCheckbox checked={selectedDetails.length === serviceList?.length && serviceList?.length > 0} onChange={(checked) => handleSelectAll(checked)} />
                                        </div>
                                    </th>

                                    <th className="w-[25%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Serial No."]}</th>
                                    <th className="w-[15%] text-left py-2 px-2 text-gray-400 text-sm">{translations["No of time verified"]}</th>
                                    <th className="w-[15%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Batch No"]}</th>
                                    <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Date Added"]}</th>
                                    <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Date Updated"]}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {serviceList.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-2 px-2 text-center text-gray-400 border border-[#40404042]">
                                            {translations["No Record Found"]}
                                        </td>
                                    </tr>
                                ) : (
                                    serviceList.map((list, index) => (
                                        <React.Fragment key={list.id || index}>
                                            <tr
                                                key={list.id || index}
                                                onClick={() => {
                                                    setShowPopup(true);
                                                }}
                                                className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                                style={{ borderColor: "#40404042" }}
                                            >
                                                <td className="py-2 px-2">
                                                    <div className="flex items-center justify-center h-full" onClick={(e) => e.stopPropagation()}>
                                                        <CustomCheckbox checked={selectedDetails.includes(list.id as number)} onChange={(checked) => handleSelectSingle(list.id as number, checked)} />
                                                    </div>
                                                </td>

                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{highlightMatch(list.serial_no, searchTerm)}</p>
                                                        <CopyToClipboard text={list.serial_no ?? ""} />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.batch_no}</td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.no_of_time_verified}</td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.updated_at}</td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.created_at}</td>
                                            </tr>
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
                    </div>
                    <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                </div>
            </div>
            {renderPopup()}
        </div>
    );
};
export default ServiceList;

import React, { useState, useEffect, useMemo } from "react";
import { servicesService, ApiServices } from "@/services/servicesService";
import { useLanguage } from "@/context/LanguageContext";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import { X } from "lucide-react";
import PusherEcho from "@/utils/echo";
import CopyToClipboard from "@/components/CopyToClipboard";
import { highlightMatch } from "@/utils/highlightMatch";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { showConfirm } from "@/utils/alert";
// Handle the Smooth skeleton loading
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);

interface ServiceListProps {
    tabId: string;
}
// localStorage.clear();
const ServiceList: React.FC<ServiceListProps> = ({ tabId }) => {
    const { translations, lang } = useLanguage();
    const [serviceList, setAllocation] = useState<ApiServices[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [selectedDetails, selectedService] = useState<number[]>([]);
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
        id: 0,
        service_code: "",
        old_service_code: "",
        description_en: "",
        description_cn: "",
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
            const paginatedData = await servicesService.getServiceList(page, perPage, search);
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
        if (selectedDetails.length > 1) {
            showErrorToast(translations["1 checkbox only"]);
            return;
        }
        const confirmed = await showConfirm(translations["Delete Record"], translations["Are you sure you want to delete this record?"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const res = await servicesService.deleteService(selectedDetails);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            selectedService([]);
            fetchService(currentPage, itemsPerPage, searchTerm);
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("No Record(s) Has Been Deleted : ", err);
        }
    };
    const hanleAssignForms = (type: string, id: number) => {
        switch (type) {
            case "new":
                const clearData = {
                    id: 0,
                    service_code: "",
                    old_service_code: "",
                    description_en: "",
                    description_cn: "",
                };
                setFormData(clearData);
                break;
            case "old":
                const data = serviceList.find((item) => item.id === id);
                const initialFormData = {
                    id: Number(data?.id),
                    service_code: String(data?.service_code),
                    old_service_code: String(data?.service_code),
                    description_en: String(data?.description_en),
                    description_cn: String(data?.description_cn),
                };
                setFormData(initialFormData);
                break;
        }
    };
    const handleSave = async () => {
        const data = new FormData();
        const service_code = formData["service_code"]?.toString().trim() ?? "";
        const description_en = formData["description_en"]?.toString().trim() ?? "";
        const description_cn = formData["description_cn"]?.toString().trim() ?? "";
        if (!service_code || service_code === "") {
            showErrorToast(translations["Service Code is required"]);
            return;
        }
        if (description_en === "" && lang === "en") {
            showErrorToast(translations["Description is required"]);
            return;
        }
        if (description_cn === "" && lang === "cn") {
            showErrorToast(translations["Description is required"]);
            return;
        }
        // Fallback: if Chinese title is missing, use English
        if (!formData["description_cn"] && lang === "en") {
            formData["description_cn"] = description_en;
        }
        if (!formData["description_en"] && lang === "cn") {
            formData["description_en"] = description_cn;
        }
        Object.keys(formData).forEach((key) => {
            let value = formData[key as keyof typeof formData];
            if (value !== null && value !== undefined) {
                data.append(key, value.toString());
            }
        });
        try {
            const result = await servicesService.updateServices(data);
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            if (result.token === "Warning") {
                showErrorToast(translations[result.message]);
                return;
            }
            // Reset state to allow re-initialization after refetch
            fetchService();
            setShowPopup(false);
            showSuccessToast(translations[result.message]);
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
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Services"]}</h2>
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
                            <label className="text-gray-400 text-sm mb-1">{translations["Service Code"]}</label>
                            <input
                                type="text"
                                value={formData.service_code}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData((prev) => ({ ...prev, service_code: value }));
                                }}
                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                        </div>
                        <div className="col-span-12 flex flex-col">
                            <label className="text-gray-400 text-sm mb-1">{translations["Description"]}</label>
                            <input
                                type="text"
                                hidden={lang === "cn"}
                                value={formData.description_en}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData((prev) => ({ ...prev, description_en: value }));
                                }}
                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                            <input
                                type="text"
                                hidden={lang === "en"}
                                value={formData.description_cn}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData((prev) => ({ ...prev, description_cn: value }));
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
                            {translations["Save"]}
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
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => {
                                        setShowPopup(true);
                                        hanleAssignForms("new", 0);
                                    }}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
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
                    <div className="h-[calc(100vh-180px)] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    <th className="w-[3%] text-left py-2 px-2 text-gray-400 text-sm">
                                        <div className="flex items-center h-full">
                                            <CustomCheckbox checked={selectedDetails.length === serviceList?.length && serviceList?.length > 0} onChange={(checked) => handleSelectAll(checked)} />
                                        </div>
                                    </th>
                                    <th className="w-[30%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Service Code"]}</th>
                                    <th className="w-[67%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Description"]}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {serviceList.map((list, index) => (
                                    <React.Fragment key={list.id || index}>
                                        <tr
                                            key={list.id || index}
                                            onClick={() => {
                                                hanleAssignForms("old", list.id);
                                                setShowPopup(true);
                                            }}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                <CustomCheckbox checked={selectedDetails.includes(list.id as number)} onChange={(checked) => handleSelectSingle(list.id as number, checked)} />
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">{highlightMatch(list.service_code, searchTerm)}</p>
                                                    <CopyToClipboard text={list.service_code ?? ""} />
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                {highlightMatch(
                                                    lang === "en"
                                                        ? list.description_en
                                                            ? list.description_en
                                                            : translations["N.A."] || "N.A."
                                                        : list && list.description_cn
                                                        ? list.description_cn
                                                        : translations["N.A."] || "N.A.",
                                                    searchTerm
                                                )}
                                            </td>
                                        </tr>
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
                    </div>
                    <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                </div>
            </div>
            {renderPopup()}
        </div>
    );
};
export default ServiceList;

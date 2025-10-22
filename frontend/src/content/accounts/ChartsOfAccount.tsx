import React, { useState, useEffect, useMemo } from "react";
import { chartsOfAccountService, ApiChartsOfAccount, DetailsRow } from "@/services/chartsOfAccountService";
import { useLanguage } from "@/context/LanguageContext";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import PusherEcho from "@/utils/echo";
import CopyToClipboard from "@/components/CopyToClipboard";
import { highlightMatch } from "@/utils/highlightMatch";
import { Minus, Plus, X } from "lucide-react";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showConfirm } from "@/utils/alert";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
// Handle the Smooth skeleton loading
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);

interface AllocationListProps {
    tabId: string;
}
// localStorage.clear();
const AllocationList: React.FC<AllocationListProps> = ({ tabId }) => {
    const { translations, lang } = useLanguage();
    const [chartsOfAccountLists, setAllocation] = useState<ApiChartsOfAccount[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [expanded_ChartsOfAccount, setExpandedRows] = useState<number[]>([]);
    const [expanded_ChartsOfAccount2, setExpandedRows2] = useState<number[]>([]);
    const [expanded_ChartsOfAccount3, setExpandedRows3] = useState<number[]>([]);
    const [chartsOfAccountDetailMap, setChartsOfAccountMap] = useState<Record<number, DetailsRow[] | null>>({});
    const [chartsOfAccountDetailMap2, setChartsOfAccountMap2] = useState<Record<number, DetailsRow[] | null>>({});
    const [chartsOfAccountDetailMap3, setChartsOfAccountMap3] = useState<Record<number, DetailsRow[] | null>>({});
    const [selectedDetails, selectedMaster] = useState<number[]>([]);
    const [popupTitle, setPopupTitle] = useState("");
    const [showEdit, setShowEdit] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);
    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-allocation`;
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
        const metaKey = `${tabId}-cached-meta-allocation`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-allocation`);
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
        root_name: "",
        account_code: "",
        old_account_code: "",
        account_name_en: "",
        account_name_cn: "",
        account_type_en: "",
        account_type_cn: "",
        description_en: "",
        description_cn: "",
    });
    useEffect(() => {
        const channel = PusherEcho.channel("allocation-channel");
        channel.listen(".allocation-event", () => {
            setTimeout(() => {
                fetchChartsOfAccount(currentPage, itemsPerPage, searchTerm);
            }, 500);
        });
        return () => {
            PusherEcho.leave("allocation-channel");
        };
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    // ON LOAD LIST
    useEffect(() => {
        fetchChartsOfAccount(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    useEffect(() => {
        expanded_ChartsOfAccount.forEach((masterId) => {
            try {
                const data = chartsOfAccountLists.find((po) => po.id === masterId);
                if (!data?.details) {
                    setChartsOfAccountMap((prev) => ({ ...prev, [masterId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.details;
                setChartsOfAccountMap((prev) => ({ ...prev, [masterId]: details }));
            } catch (error) {
                setChartsOfAccountMap((prev) => ({ ...prev, [masterId]: null }));
            }

            expanded_ChartsOfAccount2.forEach((detailId) => {
                try {
                    const master = chartsOfAccountLists.find((po) => po.id === masterId);
                    const data = master?.details?.find((detail: any) => detail.id === detailId);
                    if (!data?.details) {
                        setChartsOfAccountMap2((prev) => ({ ...prev, [detailId]: null }));
                        return;
                    }
                    const details: DetailsRow[] = data.details;
                    setChartsOfAccountMap2((prev) => ({ ...prev, [detailId]: details }));
                } catch (error) {
                    setChartsOfAccountMap2((prev) => ({ ...prev, [detailId]: null }));
                }

                expanded_ChartsOfAccount3.forEach((detail2Id) => {
                    try {
                        // Start from top level (masterId)
                        const master = chartsOfAccountLists.find((po) => po.id === masterId);
                        // Find the second level (detailId)
                        const detail = master?.details?.find((detail: any) => detail.id === detailId);
                        // Find the third level (detail2Id)
                        const data = detail?.details?.find((detail2: any) => detail2.id === detail2Id);

                        if (!data?.details) {
                            setChartsOfAccountMap3((prev) => ({ ...prev, [detail2Id]: null }));
                            return;
                        }
                        const details: DetailsRow[] = data.details;
                        setChartsOfAccountMap3((prev) => ({ ...prev, [detail2Id]: details }));
                    } catch (error) {
                        setChartsOfAccountMap3((prev) => ({ ...prev, [detail2Id]: null }));
                    }
                });
            });
        });
    }, [tabId, chartsOfAccountLists, expanded_ChartsOfAccount, expanded_ChartsOfAccount2, expanded_ChartsOfAccount3]);

    const fetchChartsOfAccount = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-coa`, JSON.stringify(true));
            const paginatedData = await chartsOfAccountService.getAllChartsOfAccount(page, perPage, search);
            setAllocation(paginatedData.data);
            setTotalPages(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching coa:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-coa`, JSON.stringify(false));
        }
    };
    const filteredChartsOfAccount = chartsOfAccountLists.filter((supplier) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            supplier.account_code?.toLowerCase().includes(searchLower) ||
            supplier.account_name_en?.toLowerCase().includes(searchLower) ||
            supplier.description_en?.toLowerCase().includes(searchLower) ||
            supplier.description_cn?.toLowerCase().includes(searchLower)
        );
    });
    const handleToggleRow = async (tableId: number) => {
        const isExpanded = expanded_ChartsOfAccount.includes(tableId);
        const cachedKey = tabId + "_cachedCOADetails_" + tableId;
        const expandedKey = tabId + "_expandedKey";

        if (isExpanded) {
            // Collapse row
            const updated = expanded_ChartsOfAccount.filter((id) => id !== tableId);
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
        } else {
            // Expand row
            const updated = [...expanded_ChartsOfAccount, tableId];
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
            try {
                const data = chartsOfAccountLists.find((po) => po.id === tableId);
                if (!data?.details) {
                    setChartsOfAccountMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.details;
                setChartsOfAccountMap((prev) => ({ ...prev, [tableId]: details }));
                localStorage.setItem(cachedKey, JSON.stringify(details));
            } catch (error) {
                console.error(`Failed to load details for product ${tableId}`, error);
                setChartsOfAccountMap((prev) => ({ ...prev, [tableId]: null }));
            }
        }
    };
    const handleToggleRow2 = async (masterId: number, tableId: number) => {
        const isExpanded = expanded_ChartsOfAccount2.includes(tableId);
        const cachedKey = tabId + "_cachedCOADetails_" + tableId;
        const expandedKey = tabId + "_expandedKey";

        if (isExpanded) {
            // Collapse row
            const updated = expanded_ChartsOfAccount2.filter((id) => id !== tableId);
            setExpandedRows2(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
        } else {
            // Expand row
            const updated = [...expanded_ChartsOfAccount2, tableId];
            setExpandedRows2(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
            try {
                const master = chartsOfAccountLists.find((po) => po.id === masterId);
                const data = master?.details?.find((detail: any) => detail.id === tableId);
                if (!data?.details) {
                    setChartsOfAccountMap2((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.details;
                setChartsOfAccountMap2((prev) => ({ ...prev, [tableId]: details }));
                localStorage.setItem(cachedKey, JSON.stringify(details));
            } catch (error) {
                setChartsOfAccountMap2((prev) => ({ ...prev, [tableId]: null }));
            }
        }
    };
    const handleToggleRow3 = async (superMasterId: number, masterId: number, tableId: number) => {
        const isExpanded = expanded_ChartsOfAccount3.includes(tableId);
        const cachedKey = tabId + "_cachedCOADetails_" + tableId;
        const expandedKey = tabId + "_expandedKey";

        if (isExpanded) {
            // Collapse row
            const updated = expanded_ChartsOfAccount3.filter((id) => id !== tableId);
            setExpandedRows3(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
        } else {
            // Expand row
            const updated = [...expanded_ChartsOfAccount3, tableId];
            setExpandedRows3(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
            try {
                const master = chartsOfAccountLists.find((po) => po.id === superMasterId);
                const detail = master?.details?.find((detail: any) => detail.id === masterId);
                const data = detail?.details?.find((detail: any) => detail.id === tableId);
                if (!data?.details) {
                    setChartsOfAccountMap3((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.details;
                setChartsOfAccountMap3((prev) => ({ ...prev, [tableId]: details }));
                localStorage.setItem(cachedKey, JSON.stringify(details));
            } catch (error) {
                setChartsOfAccountMap3((prev) => ({ ...prev, [tableId]: null }));
            }
        }
    };
    const handleSelectChartsOfAccount = (id: number, checked: boolean) => {
        if (checked) {
            selectedMaster((prev) => [...prev, id]);
        } else {
            selectedMaster((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = chartsOfAccountLists?.map((p: any) => p.id);
            selectedMaster(allIds);
        } else {
            selectedMaster([]);
        }
    };
    const handlePopup = (masterId: number, id: number, layer: number) => {
        const master1 = chartsOfAccountLists.find((po) => po.id === masterId);
        switch (layer) {
            case 1:
                setFormData((prev) => ({
                    ...prev,
                    id: 0,
                    root_name: String(master1?.account_code),
                    account_type_en: String(master1?.account_name_en),
                    account_type_cn: String(master1?.account_name_cn),
                    account_code: "",
                    old_account_code: "",
                    account_name_en: "",
                    account_name_cn: "",
                    description_en: "",
                    description_cn: "",
                }));
                break;
            case 2:
                const allDetails1 = Object.values(chartsOfAccountDetailMap).flat().filter(Boolean);
                const master2 = allDetails1.find((po: any) => po.id === id);
                setFormData((prev) => ({
                    ...prev,
                    id: 0,
                    root_name: String(master2?.account_code),
                    account_type_en: String(master1?.account_name_en),
                    account_type_cn: String(master1?.account_name_cn),
                    account_code: "",
                    old_account_code: "",
                    account_name_en: "",
                    account_name_cn: "",
                    description_en: "",
                    description_cn: "",
                }));
                break;
            case 3:
                const allDetails2 = Object.values(chartsOfAccountDetailMap2).flat().filter(Boolean);
                const master3 = allDetails2.find((po: any) => po.id === id);
                setFormData((prev) => ({
                    ...prev,
                    id: 0,
                    root_name: String(master3?.account_code),
                    account_type_en: String(master1?.account_name_en),
                    account_type_cn: String(master1?.account_name_cn),
                    account_code: "",
                    old_account_code: "",
                    account_name_en: "",
                    account_name_cn: "",
                    description_en: "",
                    description_cn: "",
                }));
                break;

            case 4:
                const allDetails3 = Object.values(chartsOfAccountDetailMap3).flat().filter(Boolean);
                const master4 = allDetails3.find((po: any) => po.id === id);
                setFormData((prev) => ({
                    ...prev,
                    id: Number(master4?.id),
                    root_name: String(master4?.root_name),
                    account_type_en: String(master1?.account_name_en),
                    account_type_cn: String(master1?.account_name_cn),
                    account_code: String(master4?.account_code),
                    old_account_code: String(master4?.account_code),
                    account_name_en: String(master4?.account_name_en),
                    account_name_cn: String(master4?.account_name_cn),
                    description_en: String(master4?.description_en),
                    description_cn: String(master4?.description_cn),
                }));
                break;

            case 5:
                const allDetails4 = Object.values(chartsOfAccountDetailMap).flat().filter(Boolean);
                const master5 = allDetails4.find((po: any) => po.id === id);
                setFormData((prev) => ({
                    ...prev,
                    id: Number(master5?.id),
                    root_name: String(master5?.root_name),
                    account_type_en: String(master1?.account_name_en),
                    account_type_cn: String(master1?.account_name_cn),
                    account_code: String(master5?.account_code),
                    old_account_code: String(master5?.account_code),
                    account_name_en: String(master5?.account_name_en),
                    account_name_cn: String(master5?.account_name_cn),
                    description_en: String(master5?.description_en),
                    description_cn: String(master5?.description_cn),
                }));
                break;
            case 6:
                const allDetails5 = Object.values(chartsOfAccountDetailMap2).flat().filter(Boolean);
                const master6 = allDetails5.find((po: any) => po.id === id);
                setFormData((prev) => ({
                    ...prev,
                    id: Number(master6?.id),
                    root_name: String(master6?.root_name),
                    account_type_en: String(master1?.account_name_en),
                    account_type_cn: String(master1?.account_name_cn),
                    account_code: String(master6?.account_code),
                    old_account_code: String(master6?.account_code),
                    account_name_en: String(master6?.account_name_en),
                    account_name_cn: String(master6?.account_name_cn),
                    description_en: String(master6?.description_en),
                    description_cn: String(master6?.description_cn),
                }));

                break;
        }
        setShowEdit(true);
        setPopupTitle(translations["Charts of Accounts"]);
    };
    const handleDelete = async (id: number) => {
        const confirmed = await showConfirm(translations["Delete Record"], translations["Are you sure you want to delete this record?"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const res = await chartsOfAccountService.deleteChartsOfAccount([id]);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            fetchChartsOfAccount(currentPage, itemsPerPage, searchTerm);
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("No Record(s) Has Been Deleted : ", err);
        }
    };
    const handleSaveCOA = async () => {
        setLoadingSave(true);
        const data = new FormData();
        if (formData.account_code === "") {
            showErrorToast(translations["Account Code is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (formData.account_name_en === "" && lang === "en") {
            showErrorToast(translations["Account Name is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (formData.account_name_cn === "" && lang === "cn") {
            showErrorToast(translations["Account Name is required"]);
            setLoadingSave(false); // Enable button again
            return;
        }
        if (!formData["description_cn"] && lang === "en") {
            formData["description_cn"] = formData["description_en"];
        }
        if (!formData["description_en"] && lang === "cn") {
            formData["description_en"] = formData["description_cn"];
        }
        if (!formData["account_name_cn"] && lang === "en") {
            formData["account_name_cn"] = formData["account_name_en"];
        }
        if (!formData["account_name_en"] && lang === "cn") {
            formData["account_name_en"] = formData["account_name_cn"];
        }
        if (formData.id > 0) {
            if (formData.account_code != formData.old_account_code) {
                setLoadingSave(false); // Enable button again
                const confirmed = await showConfirm(translations["System Message"], translations["Confirm Changing Customer Account Code"], translations["Yes"], translations["Cancel"]);
                if (!confirmed) return;
            }
        }
        Object.keys(formData).forEach((key) => {
            let value = formData[key as keyof typeof formData];
            if (value !== null && value !== undefined) {
                data.append(key, value.toString());
            }
        });
        try {
            const result = await chartsOfAccountService.updateChartsOfAccount(data);
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            if (result.token === "Warning") {
                showErrorToast(translations[result.message]);
                return;
            }
            setShowEdit(false);
            fetchChartsOfAccount();
            showSuccessToast(translations[result.message]);
        } catch (error) {
            console.log(error);
            showErrorToast(translations["Failed to save Transaction."] || "Failed to save Transaction.");
        } finally {
            setLoadingSave(false); // Enable button again after the operation is done
        }
    };
    const renderPopup = () => {
        if (!showEdit) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[25vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{popupTitle}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowEdit(false);
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
                            <label className="text-gray-400 text-sm mb-1">{translations["Root Name"] || "Root Name"}</label>
                            <input
                                type="text"
                                readOnly
                                value={formData.root_name}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData((prev) => ({ ...prev, root_name: value }));
                                }}
                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                        </div>
                        <div className="col-span-12 flex flex-col">
                            <label className="text-gray-400 text-sm mb-1">{translations["Account Type"]}</label>
                            <input
                                type="text"
                                hidden={lang === "cn"}
                                readOnly
                                value={formData.account_type_en}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData((prev) => ({ ...prev, account_type_en: value }));
                                }}
                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                            <input
                                type="text"
                                hidden={lang === "en"}
                                readOnly
                                value={formData.account_type_cn}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData((prev) => ({ ...prev, account_type_cn: value }));
                                }}
                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                        </div>
                        <div className="col-span-12 flex flex-col">
                            <label className="text-gray-400 text-sm mb-1">{translations["Account Code"]}</label>
                            <input
                                type="text"
                                value={formData.account_code}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData((prev) => ({ ...prev, account_code: value }));
                                }}
                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                        </div>
                        <div className="col-span-12 flex flex-col">
                            <label className="text-gray-400 text-sm mb-1">{translations["Account Name"]}</label>
                            <input
                                type="text"
                                hidden={lang === "cn"}
                                value={formData.account_name_en}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData((prev) => ({ ...prev, account_name_en: value }));
                                }}
                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                            <input
                                type="text"
                                hidden={lang === "en"}
                                value={formData.account_name_cn}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData((prev) => ({ ...prev, account_name_cn: value }));
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
                        <button onClick={() => setShowEdit(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button onClick={handleSaveCOA} disabled={loadingSave} className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition`}>
                            {translations["Save"]}
                        </button>
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
                        </div>
                    </div>
                </div>
                {/* Table */}
                <div className="overflow-x-auto flex-grow">
                    <div className="h-[calc(100vh-180px)] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-[4%]"></th>
                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-[4%]">
                                        <div className="flex items-center justify-center h-full">
                                            <CustomCheckbox
                                                checked={selectedDetails.length === chartsOfAccountLists?.length && chartsOfAccountLists?.length > 0}
                                                onChange={(checked) => handleSelectAll(checked)}
                                            />
                                        </div>
                                    </th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[40%]">{translations["Account Name"]}</th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[20%]">{translations["Account Code"]}</th>
                                    <th className="text-left py-2 px-2 text-gray-400 text-sm w-[16%]">{translations["Description"]}</th>
                                    <th className="text-center py-2 px-2 text-gray-400 text-sm w-[16%]">{translations["Action"]}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredChartsOfAccount.map((list, index) => (
                                    <React.Fragment key={list.id || index}>
                                        <tr className="clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer" style={{ borderColor: "#40404042" }}>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleToggleRow(list.id)}
                                                    className={`px-1 py-1 ${
                                                        expanded_ChartsOfAccount.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                    } text-white rounded-lg transition-colors text-xs`}
                                                >
                                                    {expanded_ChartsOfAccount.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                </button>
                                            </td>
                                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center h-full">
                                                    <CustomCheckbox
                                                        checked={selectedDetails.includes(list.id as number)}
                                                        onChange={(checked) => handleSelectChartsOfAccount(list.id as number, checked)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                {highlightMatch(lang === "en" ? list.account_name_en || translations["N.A."] : list.account_name_cn || translations["N.A."], searchTerm)}
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">{list.account_code ? highlightMatch(list.account_code, searchTerm) : translations["N.A."]}</p>
                                                    <CopyToClipboard text={list.account_code || ""} />
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                {highlightMatch(lang === "en" ? list.description_en || translations["N.A."] : list.description_cn || translations["N.A."], searchTerm)}
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                <button
                                                    onClick={() => handlePopup(list.id, list.id, 1)}
                                                    className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700"
                                                >
                                                    <span>{translations["Add"]}</span>
                                                </button>
                                            </td>
                                        </tr>
                                        {expanded_ChartsOfAccount.includes(list.id) && (
                                            <tr>
                                                <td colSpan={6} className="py-2 px-2">
                                                    <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                        <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                <th className="w-[4%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]"></th>
                                                                <th className="w-[4%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]"></th>
                                                                <th className="w-[26%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Account Name"]}</th>
                                                                <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Account Type"]}</th>
                                                                <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Account Code"]}</th>
                                                                <th className="w-[16%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Description"]}</th>
                                                                <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Action"]}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {chartsOfAccountDetailMap[list.id] && chartsOfAccountDetailMap[list.id]!.length > 0 ? (
                                                                chartsOfAccountDetailMap[list.id]!.map((detail, i) => (
                                                                    <React.Fragment key={detail.id || i}>
                                                                        <tr>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]"></td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                                {detail.children_count > 0 && (
                                                                                    <button
                                                                                        onClick={() => handleToggleRow2(list.id, detail.id)}
                                                                                        className={`px-1 py-1 ${
                                                                                            expanded_ChartsOfAccount2.includes(detail.id)
                                                                                                ? "bg-red-600 hover:bg-red-700"
                                                                                                : "bg-green-600 hover:bg-green-700"
                                                                                        } text-white rounded-lg transition-colors text-xs`}
                                                                                    >
                                                                                        {expanded_ChartsOfAccount2.includes(detail.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                                                    </button>
                                                                                )}
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                {highlightMatch(
                                                                                    lang === "en" ? detail.account_name_en || translations["N.A."] : detail.account_name_cn || translations["N.A."],
                                                                                    searchTerm
                                                                                )}
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                {highlightMatch(
                                                                                    lang === "en" ? detail.account_type_en || translations["N.A."] : detail.account_type_cn || translations["N.A."],
                                                                                    searchTerm
                                                                                )}
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                <div className="group flex items-center">
                                                                                    <p className="text-gray-400 text-custom-sm">
                                                                                        {detail.account_code ? highlightMatch(detail.account_code, searchTerm) : translations["N.A."]}
                                                                                    </p>
                                                                                    <CopyToClipboard text={detail.account_code || ""} />
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                {highlightMatch(
                                                                                    lang === "en" ? detail.description_en || translations["N.A."] : detail.description_cn || translations["N.A."],
                                                                                    searchTerm
                                                                                )}
                                                                            </td>
                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                                <button
                                                                                    onClick={() => handlePopup(list.id, detail.id, 2)}
                                                                                    className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700 mr-2"
                                                                                >
                                                                                    <span>{translations["Add"]}</span>
                                                                                </button>
                                                                                {detail.children_count === 0 && (
                                                                                    <>
                                                                                        <button
                                                                                            onClick={() => handlePopup(list.id, detail.id, 5)}
                                                                                            className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700 mr-2"
                                                                                        >
                                                                                            <span>{translations["Edit"]}</span>
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleDelete(detail.id)}
                                                                                            className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-red-600 hover:bg-red-700 mr-2"
                                                                                        >
                                                                                            <span>{translations["Delete"]}</span>
                                                                                        </button>
                                                                                    </>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                        {expanded_ChartsOfAccount2.includes(detail.id) && (
                                                                            <tr>
                                                                                <td colSpan={7} className="py-2 px-2">
                                                                                    <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                                                        <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                                                <th
                                                                                                    className="w-[8%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]"
                                                                                                    colSpan={2}
                                                                                                ></th>
                                                                                                <th className="w-[4%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]"></th>
                                                                                                <th className="w-[22%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                                    {translations["Account Name"]}
                                                                                                </th>
                                                                                                <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                                    {translations["Account Type"]}
                                                                                                </th>
                                                                                                <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                                    {translations["Account Code"]}
                                                                                                </th>
                                                                                                <th className="w-[16%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                                    {translations["Description"]}
                                                                                                </th>
                                                                                                <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                                    {translations["Action"]}
                                                                                                </th>
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody>
                                                                                            {chartsOfAccountDetailMap2[detail.id] && chartsOfAccountDetailMap2[detail.id]!.length > 0 ? (
                                                                                                chartsOfAccountDetailMap2[detail.id]!.map((detail2, i) => (
                                                                                                    <React.Fragment key={detail2.id || i}>
                                                                                                        <tr>
                                                                                                            <td
                                                                                                                className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]"
                                                                                                                colSpan={2}
                                                                                                            ></td>
                                                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                                                                {detail2.children_count > 0 && (
                                                                                                                    <button
                                                                                                                        onClick={() => handleToggleRow3(list.id, detail.id, detail2.id)}
                                                                                                                        className={`px-1 py-1 ${
                                                                                                                            expanded_ChartsOfAccount3.includes(detail2.id)
                                                                                                                                ? "bg-red-600 hover:bg-red-700"
                                                                                                                                : "bg-green-600 hover:bg-green-700"
                                                                                                                        } text-white rounded-lg transition-colors text-xs`}
                                                                                                                    >
                                                                                                                        {expanded_ChartsOfAccount3.includes(detail2.id) ? (
                                                                                                                            <Minus size={16} />
                                                                                                                        ) : (
                                                                                                                            <Plus size={16} />
                                                                                                                        )}
                                                                                                                    </button>
                                                                                                                )}
                                                                                                            </td>
                                                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                                                {highlightMatch(
                                                                                                                    lang === "en"
                                                                                                                        ? detail2.account_name_en || translations["N.A."]
                                                                                                                        : detail2.account_name_cn || translations["N.A."],
                                                                                                                    searchTerm
                                                                                                                )}
                                                                                                            </td>
                                                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                                                {highlightMatch(
                                                                                                                    lang === "en"
                                                                                                                        ? detail2.account_type_en || translations["N.A."]
                                                                                                                        : detail2.account_type_cn || translations["N.A."],
                                                                                                                    searchTerm
                                                                                                                )}
                                                                                                            </td>
                                                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                                                <div className="group flex items-center">
                                                                                                                    <p className="text-gray-400 text-custom-sm">
                                                                                                                        {detail2.account_code
                                                                                                                            ? highlightMatch(detail2.account_code, searchTerm)
                                                                                                                            : translations["N.A."]}
                                                                                                                    </p>
                                                                                                                    <CopyToClipboard text={detail2.account_code || ""} />
                                                                                                                </div>
                                                                                                            </td>
                                                                                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                                                {highlightMatch(
                                                                                                                    lang === "en"
                                                                                                                        ? detail2.description_en || translations["N.A."]
                                                                                                                        : detail2.description_cn || translations["N.A."],
                                                                                                                    searchTerm
                                                                                                                )}
                                                                                                            </td>
                                                                                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                                                                <button
                                                                                                                    onClick={() => handlePopup(list.id, detail2.id, 3)}
                                                                                                                    className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700 mr-2"
                                                                                                                >
                                                                                                                    <span>{translations["Add"]}</span>
                                                                                                                </button>
                                                                                                                {detail2.children_count === 0 && (
                                                                                                                    <>
                                                                                                                        <button
                                                                                                                            onClick={() => handlePopup(list.id, detail2.id, 6)}
                                                                                                                            className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700 mr-2"
                                                                                                                        >
                                                                                                                            <span>{translations["Edit"]}</span>
                                                                                                                        </button>
                                                                                                                        <button
                                                                                                                            onClick={() => handleDelete(detail2.id)}
                                                                                                                            className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-red-600 hover:bg-red-700 mr-2"
                                                                                                                        >
                                                                                                                            <span>{translations["Delete"]}</span>
                                                                                                                        </button>
                                                                                                                    </>
                                                                                                                )}
                                                                                                            </td>
                                                                                                        </tr>

                                                                                                        {expanded_ChartsOfAccount3.includes(detail2.id) && (
                                                                                                            <tr>
                                                                                                                <td colSpan={8} className="py-2 px-2">
                                                                                                                    <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                                                                                        <thead
                                                                                                                            className="sticky top-0 z-[1] py-1 px-4"
                                                                                                                            style={{ backgroundColor: "#1f2132" }}
                                                                                                                        >
                                                                                                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                                                                                <th
                                                                                                                                    className="w-[12%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]"
                                                                                                                                    colSpan={3}
                                                                                                                                ></th>
                                                                                                                                <th className="w-[22%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                                                                    {translations["Account Name"]}
                                                                                                                                </th>
                                                                                                                                <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                                                                    {translations["Account Type"]}
                                                                                                                                </th>
                                                                                                                                <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                                                                    {translations["Account Code"]}
                                                                                                                                </th>
                                                                                                                                <th className="w-[16%] text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                                                                    {translations["Description"]}
                                                                                                                                </th>
                                                                                                                                <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                                                                                    {translations["Action"]}
                                                                                                                                </th>
                                                                                                                            </tr>
                                                                                                                        </thead>
                                                                                                                        <tbody>
                                                                                                                            {chartsOfAccountDetailMap3[detail2.id] &&
                                                                                                                            chartsOfAccountDetailMap3[detail2.id]!.length > 0 ? (
                                                                                                                                chartsOfAccountDetailMap3[detail2.id]!.map((detail3, i) => (
                                                                                                                                    <tr key={detail3.id || i}>
                                                                                                                                        <td
                                                                                                                                            className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]"
                                                                                                                                            colSpan={3}
                                                                                                                                        ></td>
                                                                                                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                                                                            {highlightMatch(
                                                                                                                                                lang === "en"
                                                                                                                                                    ? detail3.account_name_en || translations["N.A."]
                                                                                                                                                    : detail3.account_name_cn || translations["N.A."],
                                                                                                                                                searchTerm
                                                                                                                                            )}
                                                                                                                                        </td>
                                                                                                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                                                                            {highlightMatch(
                                                                                                                                                lang === "en"
                                                                                                                                                    ? detail3.account_type_en || translations["N.A."]
                                                                                                                                                    : detail3.account_type_cn || translations["N.A."],
                                                                                                                                                searchTerm
                                                                                                                                            )}
                                                                                                                                        </td>
                                                                                                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                                                                            <div className="group flex items-center">
                                                                                                                                                <p className="text-gray-400 text-custom-sm">
                                                                                                                                                    {detail3.account_code
                                                                                                                                                        ? highlightMatch(
                                                                                                                                                              detail3.account_code,
                                                                                                                                                              searchTerm
                                                                                                                                                          )
                                                                                                                                                        : translations["N.A."]}
                                                                                                                                                </p>
                                                                                                                                                <CopyToClipboard text={detail3.account_code || ""} />
                                                                                                                                            </div>
                                                                                                                                        </td>
                                                                                                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                                                                            {highlightMatch(
                                                                                                                                                lang === "en"
                                                                                                                                                    ? detail3.description_en || translations["N.A."]
                                                                                                                                                    : detail3.description_cn || translations["N.A."],
                                                                                                                                                searchTerm
                                                                                                                                            )}
                                                                                                                                        </td>
                                                                                                                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                                                                                            <button
                                                                                                                                                onClick={() => handlePopup(list.id, detail3.id, 4)}
                                                                                                                                                className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700 mr-2"
                                                                                                                                            >
                                                                                                                                                <span>{translations["Edit"]}</span>
                                                                                                                                            </button>
                                                                                                                                            <button
                                                                                                                                                onClick={() => handleDelete(detail3.id)}
                                                                                                                                                className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-red-600 hover:bg-red-700 mr-2"
                                                                                                                                            >
                                                                                                                                                <span>{translations["Delete"]}</span>
                                                                                                                                            </button>
                                                                                                                                        </td>
                                                                                                                                    </tr>
                                                                                                                                ))
                                                                                                                            ) : (
                                                                                                                                <tr>
                                                                                                                                    <td
                                                                                                                                        colSpan={8}
                                                                                                                                        className="py-2 px-2 text-center text-gray-400 text-sm border border-[#40404042]"
                                                                                                                                    >
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
                                                                                            ) : (
                                                                                                <tr>
                                                                                                    <td colSpan={7} className="py-2 px-2 text-center text-gray-400 text-sm border border-[#40404042]">
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
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={7} className="py-2 px-2 text-center text-gray-400 text-sm border border-[#40404042]">
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
                    </div>
                    <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                </div>
                {renderPopup()}
            </div>
        </div>
    );
};
export default AllocationList;

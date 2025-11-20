import React, { useState, useEffect, useMemo } from "react";
import { customerGroupService, ApiCustomerGroup, DetailsRow } from "@/services/customerGroupService";
import { useLanguage } from "@/context/LanguageContext";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import PusherEcho from "@/utils/echo";
import CopyToClipboard from "@/components/CopyToClipboard";
import { highlightMatch } from "@/utils/highlightMatch";
import { Minus, Plus, X } from "lucide-react";
import CustomCheckbox from "@/components/CustomCheckbox";
import { OptionType, DropdownData, selectStyles } from "@/utils/globalFunction";
import { showConfirm } from "@/utils/alert";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import { fetchCurrencies, convertToSingleOption } from "@/utils/fetchDropdownData";
import Select from "react-select";
// Handle the Smooth skeleton loading
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);

interface CustomerGroupListProps {
    tabId: string;
}
// localStorage.clear();
const CustomerGroupList: React.FC<CustomerGroupListProps> = ({ tabId }) => {
    const { translations, lang } = useLanguage();
    const [customerGroupList, setCustomerGroup] = useState<ApiCustomerGroup[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [expanded_Group, setExpandedRows] = useState<number[]>([]);
    const [customerGroupMap, setGroupDetailMap] = useState<Record<number, DetailsRow[] | null>>({});
    const [selectedDetails, selectedGroup] = useState<number[]>([]);
    const [showPopup, setShowPopup] = useState(false);
    const [isDisable, setDisable] = useState(false);
    const [currenciesData, setCurrenciesData] = useState<DropdownData[]>([]);
    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-group`;
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
        const metaKey = `${tabId}-cached-meta-group`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-group`);
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
        customer_group_en: "",
        customer_group_cn: "",
        brevo_list_id: 0,
        currency: null as OptionType | null,
    });
    useEffect(() => {
        const channel = PusherEcho.channel("group-channel");
        channel.listen(".group-event", () => {
            setTimeout(() => {
                fetchCustomerGroup(currentPage, itemsPerPage, searchTerm);
            }, 500);
        });
        return () => {
            PusherEcho.leave("group-channel");
        };
    }, [currentPage, itemsPerPage, searchTerm, tabId]);
    useEffect(() => {
        loadCurrency();
    }, [tabId]);

    // ON LOAD LIST
    useEffect(() => {
        fetchCustomerGroup(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);
    const currencyOptions: OptionType[] = useMemo(
        () =>
            currenciesData.map((currency) => ({
                value: currency.value.toString(),
                value2: currency.value.toString(),
                label: lang === "en" ? currency.en : currency.cn,
                en: currency.en,
                cn: currency.cn,
            })),
        [currenciesData, lang]
    );
    const fetchCustomerGroup = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-group`, JSON.stringify(true));
            const paginatedData = await customerGroupService.getCustomerGroupList(page, perPage, search);
            setCustomerGroup(paginatedData.data);
            setTotalPages(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching group:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-group`, JSON.stringify(false));
        }
    };
    const loadCurrency = async () => {
        try {
            const list = await fetchCurrencies(); // fetches & returns
            setCurrenciesData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadCurrency:", err);
        }
    };
    const handleToggleRow = async (tableId: number) => {
        const isExpanded = expanded_Group.includes(tableId);
        const cachedKey = tabId + "_cachedGroupDetails_" + tableId;
        const expandedKey = tabId + "_expandedKey";

        if (isExpanded) {
            // Collapse row
            const updated = expanded_Group.filter((id) => id !== tableId);
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
        } else {
            // Expand row
            const updated = [...expanded_Group, tableId];
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
            try {
                const data = customerGroupList.find((po) => po.id === tableId);
                // Save to state
                if (!data?.details) {
                    console.error("No details found for this PO");
                    setGroupDetailMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.details;
                setGroupDetailMap((prev) => ({ ...prev, [tableId]: details }));
                localStorage.setItem(cachedKey, JSON.stringify(details));
            } catch (error) {
                console.error(`Failed to load details for product ${tableId}`, error);
                setGroupDetailMap((prev) => ({ ...prev, [tableId]: null }));
            }
        }
    };
    const handleSelectAllocation = (id: number, checked: boolean) => {
        if (checked) {
            selectedGroup((prev) => [...prev, id]);
        } else {
            selectedGroup((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = customerGroupList?.map((p: any) => p.id);
            selectedGroup(allIds);
        } else {
            selectedGroup([]);
        }
    };
    const statusMap: Record<string, { color: string }> = {
        0: { color: "bg-red-600 bg-opacity-20 text-red-400 uppercase" },
        1: { color: "bg-green-500 bg-opacity-20 text-green-300 uppercase" },
    };
    const getStatusColor = (status: number) => {
        return statusMap[status]?.color || "bg-cyan-600 bg-opacity-20 text-cyan-400";
    };
    const handleDeleteSelected = async () => {
        if (selectedDetails.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const selectedMaster = customerGroupList.filter((item) => selectedDetails.includes(item.id));
        let isExistsCustomer = 0;
        selectedMaster.forEach((list: any) => {
            if (list) {
                if (list.customer_count > 0) {
                    isExistsCustomer++;
                }
            }
        });
        if (isExistsCustomer > 0) {
            showErrorToast(translations["Customer Group already have customer"] || "Customer Group already have customer");
            return;
        }
        const confirmed = await showConfirm(translations["Delete Record"], translations["Are you sure you want to delete this record?"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;

        try {
            const res = await customerGroupService.deleteCustomerGroup(selectedDetails);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            fetchCustomerGroup();
            selectedGroup([]);
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("No Record(s) Has Been Deleted : ", err);
        }
    };

    const handleSave = async () => {
        const data = new FormData();
        const customer_group_en = formData["customer_group_en"]?.toString().trim() ?? "";
        const customer_group_cn = formData["customer_group_cn"]?.toString().trim() ?? "";
        const currency = formData["currency"]?.toString().trim() ?? "";
        if (customer_group_en === "" && lang === "en") {
            showErrorToast(translations["Customer group is required"] || "Customer group is required");
            return;
        }
        if (customer_group_cn === "" && lang === "cn") {
            showErrorToast(translations["Customer group is required"] || "Customer group is required");
            return;
        }
        if (!currency) {
            showErrorToast(translations["Currency is required"] || "Currency is required");
            return;
        }

        // Fallback: if Chinese title is missing, use English
        if (!formData["customer_group_cn"] && lang === "en") {
            formData["customer_group_cn"] = customer_group_en;
        }
        if (!formData["customer_group_en"] && lang === "cn") {
            formData["customer_group_en"] = customer_group_cn;
        }
        Object.keys(formData).forEach((key) => {
            let value = formData[key as keyof typeof formData];
            if (value !== null && value !== undefined) {
                if (typeof value === "object" && "value" in value) {
                    data.append(key, (value as OptionType).value);
                } else if (Array.isArray(value)) {
                    value.forEach((item) => data.append(`${key}[]`, item.value));
                } else {
                    data.append(key, value.toString());
                }
            }
        });
        setDisable(true);
        try {
            const result = await customerGroupService.updateCustomerGroup(data);
            if (result.token === "Error") {
                setDisable(false);
                showErrorToast(result.message);
                return;
            }
            if (result.token === "Warning") {
                setDisable(false);
                showErrorToast(translations[result.message]);
                return;
            }
            // Reset state to allow re-initialization after refetch
            setDisable(false);
            fetchCustomerGroup();
            setShowPopup(false);
            showSuccessToast(translations[result.message]);
        } catch (error) {
            setDisable(false);
            showErrorToast(translations["Failed to save Transaction."] || "Failed to save Transaction.");
        } finally {
            setDisable(false);
        }
    };

    const renderPopup = () => {
        if (!showPopup) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[20vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Customer Group"]}</h2>
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
                            <label className="text-gray-400 text-sm mb-1">{translations["Customer Group"]}</label>
                            <input
                                type="text"
                                hidden={lang === "cn"}
                                value={formData.customer_group_en}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData((prev) => ({ ...prev, customer_group_en: value }));
                                }}
                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                            <input
                                type="text"
                                hidden={lang === "en"}
                                value={formData.customer_group_cn}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData((prev) => ({ ...prev, customer_group_cn: value }));
                                }}
                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                        </div>
                        <div className="col-span-12 flex flex-col">
                            <label className="text-gray-400 text-sm mb-1">{translations["Currency"]}</label>
                            <Select
                                classNamePrefix="react-select"
                                value={formData.currency}
                                onChange={async (selected) => {
                                    setFormData({ ...formData, currency: selected as OptionType | null });
                                }}
                                options={currencyOptions}
                                styles={{
                                    ...selectStyles,
                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                }}
                                className="w-[100%]"
                                isClearable
                                placeholder={translations["Select"]}
                                menuPlacement="auto"
                                menuPosition="fixed"
                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                            />
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button onClick={() => setShowPopup(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button
                            onClick={handleSave}
                            className={`px-4 py-2 text-custom-sm rounded-lg text-sm font-medium transition-colors 
                            ${isDisable ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                            text-[#ffffffcc] flex justify-center items-center`}
                            disabled={isDisable}
                        >
                            {isDisable ? (
                                <>
                                    <div className="loader mr-2"></div>
                                    <span>{translations["Processing2"]}...</span>
                                </>
                            ) : (
                                <span>{formData.id === 0 ? translations["Save"] : translations['Update']}</span>
                            )}
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
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => {
                                        setShowPopup(true);
                                        const initialFormData = {
                                            id: 0,
                                            customer_group_en: "",
                                            customer_group_cn: "",
                                            brevo_list_id: 0,
                                            currency: null,
                                        };
                                        setFormData(initialFormData);
                                    }}
                                    className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Add New"]}</span>
                                </button>
                                <button
                                    disabled={selectedDetails.length === 0}
                                    onClick={handleDeleteSelected}
                                    className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                >
                                    <span>{translations["Delete"]}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto flex-grow">
                    <div className="h-[calc(100vh-180px)] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    <th className="w-[3%] text-left py-2 px-2 text-gray-400 text-sm"></th>
                                    <th className="w-[3%] text-left py-2 px-2 text-gray-400 text-sm">
                                        <div className="flex items-center h-full">
                                            <CustomCheckbox
                                                checked={selectedDetails.length === customerGroupList?.length && customerGroupList?.length > 0}
                                                onChange={(checked) => handleSelectAll(checked)}
                                            />
                                        </div>
                                    </th>
                                    <th className="w-[34%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Group Name"]}</th>
                                    <th className="w-[12%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Currency"]}</th>
                                    <th className="w-[12%] text-center py-2 px-2 text-gray-400 text-sm">{translations["No. of Audience"]}</th>
                                    <th className="w-[13%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Date Added"]}</th>
                                    <th className="w-[13%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Last Update"]}</th>
                                    <th className="w-[10%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Action"]}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customerGroupList.map((list, index) => (
                                    <React.Fragment key={list.id || index}>
                                        <tr
                                            key={list.id || index}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleToggleRow(list.id)}
                                                    className={`px-1 py-1 ${
                                                        expanded_Group.includes(list.id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                    } text-white rounded-lg transition-colors text-xs`}
                                                >
                                                    {expanded_Group.includes(list.id) ? <Minus size={16} /> : <Plus size={16} />}
                                                </button>
                                            </td>
                                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                <CustomCheckbox checked={selectedDetails.includes(list.id as number)} onChange={(checked) => handleSelectAllocation(list.id as number, checked)} />
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="group flex items-center">
                                                    <p className="text-gray-400 text-custom-sm">{highlightMatch(lang === "en" ? list.customer_group_en : list.customer_group_cn, searchTerm)}</p>
                                                    <CopyToClipboard text={lang === "en" ? list.customer_group_en ?? "" : list.customer_group_cn ?? ""} />
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                <div className="group flex items-center text-left">
                                                    <p className="text-gray-400 text-custom-sm text-left">
                                                        {list.currency ? highlightMatch(list.currency, searchTerm) : translations["N.A."] || "N.A."}
                                                    </p>
                                                    <CopyToClipboard text={list.currency ? list.currency : ""} />
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">{list.customer_count}</td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.created_at}</td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.updated_at}</td>
                                            <td
                                                className="py-2 px-2 text-gray-400 text-center text-custom-sm"
                                                onClick={(e) => e.stopPropagation()} // Prevents td click from bubbling up
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const data = customerGroupList.find((item) => item.id === list.id);
                                                        const selectedOption = convertToSingleOption(data?.currency, currencyOptions);
                                                        const initialFormData = {
                                                            id: Number(data?.id),
                                                            brevo_list_id: Number(data?.brevo_list_id),
                                                            customer_group_en: String(data?.customer_group_en),
                                                            customer_group_cn: String(data?.customer_group_en),
                                                            currency: selectedOption,
                                                        };
                                                        setShowPopup(true);
                                                        setFormData(initialFormData);
                                                    }}
                                                    className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700"
                                                >
                                                    <span>{translations["Edit"]}</span>
                                                </button>
                                            </td>
                                        </tr>
                                        {expanded_Group.includes(list.id) && (
                                            <tr>
                                                <td colSpan={8} className="py-2 px-2">
                                                    <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                        <thead className="sticky top-0 z-[1] py-1 px-4" style={{ backgroundColor: "#1f2132" }}>
                                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Customer Code"]}</th>
                                                                <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Customer Name"]}</th>
                                                                <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Email Address"]}</th>
                                                                <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Sales Person"]}</th>
                                                                <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Last Added Date"]}</th>
                                                                <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Status"]}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {customerGroupMap[list.id] && customerGroupMap[list.id]!.length > 0 ? (
                                                                customerGroupMap[list.id]!.map((detail, i) => (
                                                                    <tr key={detail.id || i}>
                                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                            <div className="group flex items-center">
                                                                                <p className="text-gray-400 text-custom-sm">
                                                                                    {detail.customer_code ? highlightMatch(detail.customer_code, searchTerm) : translations["N.A."] || "N.A."}
                                                                                </p>
                                                                                <CopyToClipboard text={detail.customer_code ? detail.customer_code : ""} />
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                            {highlightMatch(
                                                                                lang === "en"
                                                                                    ? detail.account_name_en
                                                                                        ? detail.account_name_en
                                                                                        : translations["N.A."] || "N.A."
                                                                                    : detail.account_name_cn
                                                                                    ? detail.account_name_cn
                                                                                    : translations["N.A."] || "N.A.",
                                                                                searchTerm
                                                                            )}
                                                                        </td>
                                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                            <div className="group flex items-center">
                                                                                <p className="text-gray-400 text-custom-sm">
                                                                                    {detail.email_address ? highlightMatch(detail.email_address, searchTerm) : translations["N.A."] || "N.A."}
                                                                                </p>
                                                                                <CopyToClipboard text={detail.email_address ? detail.email_address : ""} />
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{detail.sales_person}</td>
                                                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{detail.updated_at}</td>
                                                                        <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">
                                                                            <span className={`px-2 py-1 rounded-full text-xs text-custom-sm ${getStatusColor(detail.status_id)}`}>
                                                                                {translations[detail.status]}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={6} className="py-2 px-2 text-center text-gray-400 text-sm border border-[#40404042]">
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
                        <ExportReportSelector
                            formats={["odt", "ods", "xlsx"]}
                            baseName="CustomerGroupList"
                            ids={selectedDetails.length > 0 ? selectedDetails : customerGroupList.map((p) => p.id)}
                            language={lang}
                        />
                    </div>
                    <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                </div>
                {renderPopup()}
            </div>
        </div>
    );
};
export default CustomerGroupList;

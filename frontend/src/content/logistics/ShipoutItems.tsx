import React, { useState, useEffect, useMemo, useCallback } from "react";
import { dashboardService } from "@/services/dashboardService";
import { shipoutItemService, ApiShipoutItem, DetailsRow, FilterParams } from "@/services/shipoutItemService";
import { useLanguage } from "@/context/LanguageContext";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import Select from "react-select";
import { getFlatpickrLocale, formatDateToCustom } from "@/utils/flatpickrLocale";
import PusherEcho from "@/utils/echo";
import CopyToClipboard from "@/components/CopyToClipboard";
import { highlightMatch } from "@/utils/highlightMatch";
import { X, Mail, Minus, Plus, PackageCheck, CheckCircle } from "lucide-react";
import CustomCheckbox from "@/components/CustomCheckbox";
import { selectStyles, DropdownData } from "@/utils/globalFunction";
import { showConfirm } from "@/utils/alert";
import { ExportReportSelector } from "@/utils/ExportReportSelector";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { BarChart, Bar, LabelList, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { fetchCourier, OptionType, convertToSingleOption } from "@/utils/fetchDropdownData";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/dark.css";
// Handle the Smooth skeleton loading
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);

interface ShipouItemListProps {
    tabId: string;
}
type FormDataType = {
    category_dates: string;
    date_from: Date | null;
    date_to: Date | null;
    date_to2: string;
};
interface DashboardFields {
    month: string;
    name: string;
    value: number;
    color: string;
}
// localStorage.clear();
const ShipouItemList: React.FC<ShipouItemListProps> = ({ tabId }) => {
    const { translations, lang } = useLanguage();
    const [shipoutItemList, setShipoutItem] = useState<ApiShipoutItem[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [expanded_ShipoutItem, setExpandedRows] = useState<number[]>([]);
    const [shipoutItemDetailMap, setShipoutItemDetailMap] = useState<Record<number, DetailsRow[] | null>>({});
    const [selectedMaster, selectedShipoutItem] = useState<number[]>([]);
    const [showPopup, setShowPopup] = useState(false);
    const locale = getFlatpickrLocale(translations);
    const [activeAdvanceSearch, setActiveAdvanceSearch] = useState(false);
    const [disableSendEmail, isDisableSendEmail] = useState(true);
    const [showDateRange, setShowDateRange] = useState(false);

    const [topCourier, setTopCourier] = useState<DashboardFields[]>([]);
    const [monthlyShipped, setMonthlyShipped] = useState<DashboardFields[]>([]);
    const [totalReadyToShip, setTotalReadyToShip] = useState("0");
    const [totalShipped, setTotalShipped] = useState("0");

    const [courierData, setCourierData] = useState<DropdownData[]>([]);
    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-shipout`;
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
        const metaKey = `${tabId}-cached-meta-shipout`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-shipout`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [formData, setFormData] = useState<FormDataType>({
        category_dates: "Date",
        date_from: null as Date | null,
        date_to: null as Date | null,
        date_to2: currentYearMonth,
    });
    const [formData2, setFormData2] = useState({
        tracking: "",
        shipped_packages: 0,
        courier_id: null as OptionType | null,
        date: null as Date | null,
    });

    useEffect(() => {
        const channel = PusherEcho.channel("shipment-channel");
        channel.listen(".shipment-event", () => {
            setTimeout(() => {
                const defaultFilters = {
                    search: searchTerm,
                    date_from: formData.date_from,
                    date_to: formData.date_to,
                    category_dates: formData.category_dates,
                };
                fetchShipoutItem(currentPage, itemsPerPage, defaultFilters);
            }, 500);
        });
        return () => {
            PusherEcho.leave("shipment-channel");
        };
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    useEffect(() => {
        loadCourier();
    }, [tabId]);

    useEffect(() => {
        let isFoundMail = 0;
        const selectedShipout = shipoutItemList.filter((list) => selectedMaster.includes(list.index_id));
        selectedShipout.forEach((element) => {
            if (element.is_display_mail === "Mail") {
                isFoundMail++;
            }
        });
        if (isFoundMail > 0) {
            isDisableSendEmail(false);
        } else {
            isDisableSendEmail(true);
        }
    }, [selectedMaster]);

    useEffect(() => {
        const SupplierKey = `${tabId}-cached-shipout-list`;
        const metaKey = `${tabId}-cached-meta-shipout-list`;
        const mountKey = `${tabId}-mount-status-shipout`;
        const isFirstMount = sessionStorage.getItem(mountKey) !== "mounted";
        const defaultFilters = {
            search: searchTerm,
            date_from: formData.date_from,
            date_to: formData.date_to,
            category_dates: formData.category_dates,
        };
        if (isFirstMount) {
            sessionStorage.setItem(mountKey, "mounted");
            fetchShipoutItem(currentPage, itemsPerPage, defaultFilters);
            return;
        }
        const cachedSuppliersRaw = localStorage.getItem(SupplierKey);
        const cachedMetaRaw = localStorage.getItem(metaKey);

        if (!cachedSuppliersRaw || !cachedMetaRaw) {
            fetchShipoutItem(currentPage, itemsPerPage, defaultFilters);
            return;
        }

        try {
            const cachedMeta = JSON.parse(cachedMetaRaw);
            const cachedSuppliers = JSON.parse(cachedSuppliersRaw);
            const isCacheValid = cachedMeta.page === currentPage && cachedMeta.perPage === itemsPerPage && JSON.stringify(cachedMeta.search) === JSON.stringify(defaultFilters.search);

            if (isCacheValid) {
                setShipoutItem(cachedSuppliers);
                setTotalPages(cachedMeta.totalPages);
                localStorage.setItem(`${tabId}-loading-shipout-list`, JSON.stringify(false));
                return;
            }
        } catch (err) {
            console.warn("Failed to parse cached meta:", err);
        }

        fetchShipoutItem(currentPage, itemsPerPage, defaultFilters);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    useEffect(() => {
        const fetchDashboard = async () => {
            const dateStr = formData.date_to2;
            const [year, month] = dateStr.split("-");
            const data = await dashboardService.getDashboardShipout(Number(month), Number(year));
            const topCourier = data.topCourier;
            const shippedMonthly = data.shippedMonthly;
            const mapToWithdrawInventory: DashboardFields[] = topCourier.map((item: any) => ({
                position: lang === "en" ? item.courier_en : item.courier_cn,
                count: item.count,
            }));
            const monthlyShipped: DashboardFields[] = shippedMonthly.map((item: any) => ({
                month: translations[item.month] || item.month,
                value: item.value,
            }));
            setTopCourier(mapToWithdrawInventory);
            setMonthlyShipped(monthlyShipped);
            setTotalReadyToShip(data.totalReadyToShip);
            setTotalShipped(data.totalShipped);
        };
        fetchDashboard();
    }, [lang, formData.date_to2]);

    const fetchShipoutItem = async (page = currentPage, perPage = itemsPerPage, filters: FilterParams = { search: "" }) => {
        try {
            localStorage.setItem(`${tabId}-loading-shipout-list`, JSON.stringify(true));
            const paginatedData = await shipoutItemService.getShipoutItem(page, perPage, filters);
            setShipoutItem(paginatedData.data);
            setTotalPages(paginatedData.last_page);
            localStorage.setItem(`${tabId}-cached-shipout-list`, JSON.stringify(paginatedData.data));
            localStorage.setItem(
                `${tabId}-cached-meta-shipout-list`,
                JSON.stringify({
                    page,
                    perPage,
                    filters,
                    totalPages: paginatedData.last_page,
                    totalItems: paginatedData.total,
                })
            );
        } catch (err) {
            console.error("Error fetching shipment:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-shipout-list`, JSON.stringify(false));
        }
    };
    const loadCourier = async () => {
        try {
            const list = await fetchCourier(); // fetches & returns
            setCourierData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadCourier:", err);
        }
    };
    const handleToggleRow = async (tableId: number) => {
        const isExpanded = expanded_ShipoutItem.includes(tableId);
        const cachedKey = tabId + "_cachedShipoutDetails_" + tableId;
        const expandedKey = tabId + "_expandedKey";

        if (isExpanded) {
            // Collapse row
            const updated = expanded_ShipoutItem.filter((index_id) => index_id !== tableId);
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
        } else {
            // Expand row
            const updated = [...expanded_ShipoutItem, tableId];
            setExpandedRows(updated);
            localStorage.setItem(expandedKey, JSON.stringify(updated));
            try {
                const data = shipoutItemList.find((po) => po.index_id === tableId);
                // Save to state
                if (!data?.details) {
                    setShipoutItemDetailMap((prev) => ({ ...prev, [tableId]: null }));
                    return;
                }
                const details: DetailsRow[] = data.details;
                setShipoutItemDetailMap((prev) => ({ ...prev, [tableId]: details }));
                localStorage.setItem(cachedKey, JSON.stringify(details));
            } catch (error) {
                console.error(`Failed to load details for product ${tableId}`, error);
                setShipoutItemDetailMap((prev) => ({ ...prev, [tableId]: null }));
            }
        }
    };
    const handleSelectShipout = (id: number, checked: boolean) => {
        if (checked) {
            selectedShipoutItem((prev) => [...prev, id]);
        } else {
            selectedShipoutItem((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = shipoutItemList?.map((p: any) => p.id);
            selectedShipoutItem(allIds);
        } else {
            selectedShipoutItem([]);
        }
    };
    const handleDateFrom = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, date_from: dates[0] ?? null }));
    }, []);
    const handleDateTo = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, date_to: dates[0] ?? null }));
    }, []);
    const handleDateRange = () => {
        if (!formData.date_from || !formData.date_to) {
            return;
        }
        setShowDateRange(false);
        const filters = {
            search: "",
            date_from: formData.date_from,
            date_to: formData.date_to,
            category_dates: formData.category_dates,
        };
        fetchShipoutItem(1, itemsPerPage, filters);
    };
    const handleReset = () => {
        setFormData({
            ...formData,
            date_from: null,
            date_to: null,
            category_dates: "Date",
        });
        setActiveAdvanceSearch(false);
        setSearchTerm("");
        setCurrentPage(1);
        setItemsPerPage(15);
        fetchShipoutItem(1, 15, {
            search: "",
            date_from: null,
            date_to: null,
            category_dates: "Date",
        });
    };
    const courierOption: OptionType[] = useMemo(
        () =>
            courierData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [courierData, lang]
    );
    function arrayUnique(list: any) {
        return [...new Set(list)];
    }
    const renderPopup = () => {
        if (!showPopup) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[25vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Ship-Out"]}</h2>
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
                            <label className="text-gray-400 text-sm mb-1">{translations["Courier"]}</label>
                            <Select
                                value={formData2.courier_id}
                                classNamePrefix="react-select"
                                onChange={async (selected) => {
                                    setFormData2({ ...formData2, courier_id: selected as OptionType | null });
                                }}
                                options={courierOption}
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
                        <div className="col-span-12 flex flex-col">
                            <label className="text-gray-400 text-sm mb-1">{translations["Tracking No."]}</label>
                            <input
                                type="text"
                                value={formData2.tracking}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData2((prev) => ({ ...prev, tracking: value }));
                                }}
                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                        </div>
                        <div className="col-span-12 flex flex-col">
                            <label className="text-gray-400 text-sm mb-1">{translations["No. of Packages"]}</label>
                            <input
                                type="number"
                                value={formData2.shipped_packages === 0 ? "" : formData2.shipped_packages}
                                onChange={(e) => {
                                    const value = Number(e.target.value);
                                    setFormData2((prev) => ({ ...prev, shipped_packages: value }));
                                }}
                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                        </div>
                        <div className="col-span-12 flex flex-col">
                            <label className="text-gray-400 text-sm mb-1">{translations["Date"]}</label>
                            <Flatpickr
                                onChange={(selectedDates) => {
                                    setFormData2((prev) => ({ ...prev, date: selectedDates[0] ?? null }));
                                }}
                                options={{
                                    dateFormat: "M d Y",
                                    defaultDate: formData2.date || undefined,
                                    allowInput: true,
                                    locale: locale,
                                }}
                                className="w-full px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button onClick={() => setShowPopup(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button onClick={handleSaveMultiple} className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition`}>
                            {translations["Save"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    const renderDateRange = () => {
        if (!showDateRange) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[20vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Date Range"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowDateRange(false);
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
                            <label className="text-gray-400 text-sm mb-1">{translations["DateFrom"]}</label>
                            <Flatpickr
                                onChange={handleDateFrom}
                                options={{
                                    dateFormat: "M d Y",
                                    defaultDate: formData.date_from || undefined,
                                    allowInput: false,
                                    locale: locale,
                                }}
                                className="px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                        </div>
                        <div className="col-span-12 flex flex-col">
                            <label className="text-gray-400 text-sm mb-1">{translations["DateTo"]}</label>
                            <Flatpickr
                                onChange={handleDateTo}
                                options={{
                                    dateFormat: "M d Y",
                                    defaultDate: formData.date_to || undefined,
                                    allowInput: false,
                                    locale: locale,
                                }}
                                className="px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button onClick={() => setShowDateRange(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button onClick={() => handleDateRange()} className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition`}>
                            {translations["Search"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    const handleDeleteSelected = async () => {
        if (selectedMaster.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const confirmed = await showConfirm(translations["Delete Record"], translations["Are you sure you want to delete this record?"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        const selectedShipout = shipoutItemList.filter((list) => selectedMaster.includes(list.index_id));
        const data = new FormData();
        selectedShipout.forEach((list) => {
            if (list) {
                data.append(
                    "details[]",
                    JSON.stringify({
                        table_ids: list.table_ids,
                        invoice_no: list.invoice_no,
                    })
                );
            }
        });
        try {
            const res = await shipoutItemService.deleteShipOut(data);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            selectedShipoutItem([]);
            const filters = {
                search: "",
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            fetchShipoutItem(1, itemsPerPage, filters);
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("No Record(s) Has Been Deleted : ", err);
        }
    };
    const handleShipoutSelected = async () => {
        if (selectedMaster.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        let count = 0;
        let customerArr: any = [];
        const selectedShipout = shipoutItemList.filter((list) => selectedMaster.includes(list.index_id));
        selectedShipout.forEach((list) => {
            customerArr.push(list.customer_id);
            count++;
        });
        let _len = arrayUnique(customerArr).length;
        if (_len === count) {
            let cntCour = 0;
            let cntTracking = 0;
            let cntPckgs = 0;
            let cntStats = 0;
            selectedShipout.forEach((element) => {
                if (!element.courier_id) {
                    cntCour++;
                }
                if (element.tracking === "") {
                    cntTracking++;
                }
                if (element.shipped_packages === 0) {
                    cntPckgs++;
                }
                if (Number(element.status) === 2) {
                    cntStats++;
                }
            });
            if (cntCour > 0) {
                showErrorToast(translations["Courier Name is required"]);
                return;
            }
            if (cntTracking > 0) {
                showErrorToast(translations["Tracking"] + " " + translations["RequiredField"]);
                return;
            }
            if (cntPckgs > 0) {
                showErrorToast(translations["Shipped Packages"] + " " + translations["RequiredField"]);
                return;
            }
            if (cntStats > 0) {
                const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to update the existing record"], translations["Yes"], translations["Cancel"]);
                if (!confirmed) return;
                updateShipouItems(selectedShipout);
                return;
            }
            updateShipouItems(selectedShipout);
            return;
        }
        if (_len === 1) {
            setShowPopup(true);
            return;
        }
        if (_len !== count) {
            showErrorToast(translations["Please select one customer only"]);
            return;
        }
    };
    const handleSendMailSelected = async () => {
        if (selectedMaster.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const selectedShipout = shipoutItemList.filter((list) => selectedMaster.includes(list.index_id) && list.is_display_mail === "Mail");
        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to continue"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const res = await shipoutItemService.sendEmailOnShipOut(selectedShipout);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            selectedShipoutItem([]);
            const filters = {
                search: "",
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            setShowPopup(false);
            fetchShipoutItem(1, itemsPerPage, filters);
            showSuccessToast(translations[res.message]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("No Record(s) Has Been Deleted : ", err);
        }
    };
    const handleSaveMultiple = async () => {
        const tracking = formData2["tracking"]?.toString().trim() ?? "";
        const shipped_packages = formData2["shipped_packages"]?.toString().trim() ?? 0;
        const date = formData2["date"]?.toString().trim() ?? "";
        if (!formData2.courier_id) {
            showErrorToast(translations["Courier Name is required"]);
            return;
        }
        if (tracking === "") {
            showErrorToast(translations["Tracking"] + " " + translations["RequiredField"]);
            return;
        }
        if (Number(shipped_packages) === 0) {
            showErrorToast(translations["Shipped Packages"] + " " + translations["RequiredField"]);
            return;
        }
        if (date === "") {
            showErrorToast(translations["alert_message_28"]);
            return;
        }
        const selectedShipout = shipoutItemList.filter((list) => selectedMaster.includes(list.index_id));
        const updatedSelectedShipout = selectedShipout.map((item) => ({
            ...item,
            courier_id: formData2.courier_id?.value,
            tracking: tracking,
            shipped_packages: shipped_packages,
            status: 2,
            date: formatDateToCustom(new Date(date)),
        }));
        updateShipouItems(updatedSelectedShipout);
    };
    const updateShipouItems = async (selectedShipout: any) => {
        try {
            const res = await shipoutItemService.updateShipoutItems(selectedShipout);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            selectedShipoutItem([]);
            const filters = {
                search: "",
                date_from: formData.date_from,
                date_to: formData.date_to,
                category_dates: formData.category_dates,
            };
            setShowPopup(false);
            fetchShipoutItem(1, itemsPerPage, filters);
            showSuccessToast(translations[res.message]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("No Record(s) Has Been Deleted : ", err);
        }
    };
    return (
        <div className="grid grid-cols-12 gap-1">
            <div className="col-span-3 h-[calc(100vh-70px)] overflow-y-auto pr-2">
                {/* Sticky Header */}
                {/* <div className="sticky top-0 z-10 bg-[#19191c] border-b border-gray-700 p-4 rounded-lg shadow-md border">
                    <div className="flex gap-2 items-center">
                        <span className="text-[#ffffffcc]">{translations["Filter"]} : </span>
                        <input
                            type="month"
                            value={formData.date_to}
                            onChange={(e) => {
                                const value = e.target.value;
                                setFormData((prev) => ({ ...prev, date_to: value }));
                            }}
                            className="flex-1 px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm rounded"
                            placeholder="End Month"
                        />
                    </div>
                </div> */}
                {/* Cards Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 mt-2">
                    {[
                        { title: translations["Shipped Items"] || "Shipped Items", value: totalShipped, icon: PackageCheck, bg: "bg-green-900/50", iconColor: "text-green-400" },
                        { title: translations["Ready To Ship"] || "Ready To Ship", value: totalReadyToShip, icon: CheckCircle, bg: "bg-blue-900/50", iconColor: "text-blue-400" },
                    ].map((card, idx) => (
                        <div key={idx} className="p-4 rounded-lg shadow-md border border-gray-700" style={{ backgroundColor: "#19191c", borderColor: "#404040" }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">{card.title}</p>
                                    <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                                </div>
                                <div className={`${card.bg} p-3 rounded-lg`}>
                                    <card.icon className={card.iconColor} size={24} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div
                    className="p-4 rounded-lg shadow-md border mb-2"
                    style={{
                        backgroundColor: "#19191c",
                        borderColor: "#404040",
                    }}
                >
                    <h2 className="text-lg font-bold text-white mb-4">{translations["Shipped Over 6 Months"] || "Shipped Over 6 Months"}</h2>
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart
                            data={monthlyShipped}
                            margin={{ top: 30, right: 40, left: 20, bottom: 20 }} // increased margins
                        >
                            <CartesianGrid stroke="#303030" strokeDasharray="4 4" />

                            <XAxis
                                dataKey="month"
                                stroke="#aaa"
                                tick={{ fontSize: 12, fontWeight: 500 }}
                                axisLine={{ stroke: "#555" }}
                                tickLine={false}
                                interval={0} // force all labels to show
                                tickMargin={10} // adds spacing between axis and labels
                            />

                            <YAxis
                                stroke="#aaa"
                                tick={{ fontSize: 12, fontWeight: 500 }}
                                axisLine={{ stroke: "#555" }}
                                tickLine={false}
                                width={60} // more room for large numbers
                                tickFormatter={(value) => {
                                    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
                                    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
                                    return value;
                                }}
                            />

                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#22222b",
                                    border: "1px solid #0891B2",
                                    color: "#eee",
                                    fontSize: 14,
                                    borderRadius: 6,
                                    boxShadow: "0 0 10px #0891B2aa",
                                }}
                                itemStyle={{ color: "#0891B2", fontWeight: "bold" }}
                                formatter={(value) => `${value.toLocaleString()}`}
                            />

                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#0891b2"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "#0891b2", stroke: "white", strokeWidth: 1 }}
                                activeDot={{ r: 6, fill: "#0891b2", stroke: "white", strokeWidth: 2 }}
                                style={{ filter: "drop-shadow(0 0 5px #0891B2aa)" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div
                    className="p-6 rounded-lg shadow-md border mb-4"
                    style={{
                        backgroundColor: "#19191c",
                        borderColor: "#404040",
                        height: 360,
                        paddingBottom: 20,
                    }}
                >
                    <h2 className="text-lg font-bold text-white mb-4">{translations["Top Courier"]}</h2>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={topCourier} margin={{ top: 5, right: 30, left: 5, bottom: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#303030" />
                            <XAxis
                                type="number"
                                stroke="#aaa"
                                tick={{ fontSize: 14, fontWeight: 600 }}
                                axisLine={{ stroke: "#555" }}
                                tickLine={false}
                                allowDecimals={false}
                                tickFormatter={(value) => {
                                    if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
                                    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
                                    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
                                    return value;
                                }}
                            />
                            <YAxis dataKey="position" type="category" width={120} stroke="#aaa" tick={{ fontSize: 14, fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
                                contentStyle={{
                                    backgroundColor: "#22222b",
                                    border: "1px solid #0891B2",
                                    color: "#eee",
                                    fontSize: 14,
                                    borderRadius: 6,
                                    boxShadow: "0 0 10px #0891B2aa",
                                }}
                                itemStyle={{ color: "#0891B2", fontWeight: "bold" }}
                                formatter={(value: number) => {
                                    if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
                                    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
                                    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
                                    return value.toLocaleString();
                                }}
                            />
                            <Bar dataKey="count" fill="#22c55e" barSize={20} radius={[5, 5, 5, 5]}>
                                <LabelList
                                    dataKey="count"
                                    position="right"
                                    formatter={(value: any) => {
                                        if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
                                        if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
                                        if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
                                        return value;
                                    }}
                                    style={{ fill: "#fff", fontWeight: "bold", fontSize: 14 }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="col-span-9">
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
                                    <div
                                        className={`relative border-round-3 ${activeAdvanceSearch ? "bg-green-600 border-green-600" : "bg-[#2d2d30] border-[#2d2d30]"}`}
                                        style={{ borderColor: "#2d2d30", marginLeft: "5px" }}
                                    >
                                        <button
                                            onClick={() => setShowDateRange(true)}
                                            className={`
                                        ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center  text-sm
                                        ${activeAdvanceSearch ? "bg-green-600 border-green-600 hover:bg-green-600" : "bg-[#2d2d30] border-[#2d2d30]"}
                                    `}
                                        >
                                            <span className="mr-1">{translations["Advance Search"]}</span>
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleReset()}
                                        className="ml-2 px-2 py-2 border rounded-lg text-white transition-colors flex items-center space-x-px hover:bg-gray-600 text-sm"
                                        style={{ backgroundColor: "#2d2d30", borderColor: "#2d2d30", marginLeft: "5px" }}
                                    >
                                        <span>{translations["Reset"]}</span>
                                    </button>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={handleSendMailSelected}
                                            disabled={disableSendEmail}
                                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                        >
                                            <span>{translations["Send Mail"]}</span>
                                        </button>
                                        <button
                                            disabled={selectedMaster.length === 0}
                                            onClick={handleShipoutSelected}
                                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                        >
                                            <span>{translations["Ship-Out"]}</span>
                                        </button>
                                        <button
                                            disabled={selectedMaster.length === 0}
                                            onClick={handleDeleteSelected}
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
                            <div className="h-[calc(100vh-180px)] overflow-y-auto">
                                <table className="w-full">
                                    <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                            <th className=" text-center py-2 px-2 text-gray-400 text-sm w-[3%]"></th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm w-[3%]">
                                                <div className="flex items-center h-full">
                                                    <CustomCheckbox
                                                        checked={selectedMaster.length === shipoutItemList?.length && shipoutItemList?.length > 0}
                                                        onChange={(checked) => handleSelectAll(checked)}
                                                    />
                                                </div>
                                            </th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm w-[15%]">{translations["Customer"]}</th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm w-[14%]">{translations["Courier"]}</th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm w-[15%]">{translations["Tracking"]}</th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm w-[11%]">{translations["Invoice No"]}</th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm w-[10%]">{translations["Packages"]}</th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm w-[10%]">{translations["Status"]}</th>
                                            <th className=" text-left py-2 px-2 text-gray-400 text-sm w-[14%]">{translations["Date"]}</th>
                                            <th className=" text-center py-2 px-2 text-gray-400 text-sm w-[5%]"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shipoutItemList.map((list, index) => (
                                            <React.Fragment key={list.index_id || index}>
                                                <tr
                                                    key={list.index_id || index}
                                                    className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                                    style={{ borderColor: "#40404042" }}
                                                >
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleToggleRow(list.index_id)}
                                                            className={`px-1 py-1 ${
                                                                expanded_ShipoutItem.includes(list.index_id) ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                                                            } text-white rounded-lg transition-colors text-xs`}
                                                        >
                                                            {expanded_ShipoutItem.includes(list.index_id) ? <Minus size={16} /> : <Plus size={16} />}
                                                        </button>
                                                    </td>
                                                    <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                        <CustomCheckbox
                                                            checked={selectedMaster.includes(list.index_id as number)}
                                                            onChange={(checked) => handleSelectShipout(list.index_id as number, checked)}
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <div className="flex items-center space-x-3">
                                                            <div>
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-400 text-custom-sm">{highlightMatch(list.customer_code, searchTerm)}</p>
                                                                    <CopyToClipboard text={list.customer_code || ""} />
                                                                </div>
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-400 text-custom-sm">
                                                                        {highlightMatch(lang === "en" ? list.account_name_en : list.account_name_cn, searchTerm)}
                                                                    </p>
                                                                    <CopyToClipboard text={lang === "en" ? list.account_name_en || "" : list.account_name_cn || ""} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <Select
                                                            classNamePrefix="react-select"
                                                            value={convertToSingleOption(list.courier_id, courierOption)}
                                                            onChange={(selected) => {
                                                                if (selected) {
                                                                    setShipoutItem((prev) =>
                                                                        prev.map((item) =>
                                                                            item.index_id === list.index_id
                                                                                ? {
                                                                                      ...item,
                                                                                      courier_id: parseInt(selected.value),
                                                                                  }
                                                                                : item
                                                                        )
                                                                    );
                                                                }
                                                            }}
                                                            options={courierOption}
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

                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <input
                                                            type="text"
                                                            value={list.tracking}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                setShipoutItem((prev) => prev.map((item) => (item.index_id === list.index_id ? { ...item, tracking: value } : item)));
                                                            }}
                                                            onFocus={(e) => {
                                                                if (e.target.value === "0") {
                                                                    e.target.select();
                                                                }
                                                            }}
                                                            className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <div className="group flex items-center">
                                                            <p className="text-gray-400 text-custom-sm">
                                                                {list.invoice_no ? highlightMatch(list.invoice_no, searchTerm) : translations["N.A."] || "N.A."}
                                                            </p>
                                                            <CopyToClipboard text={list.invoice_no ? list.invoice_no : ""} />
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <input
                                                            type="number"
                                                            value={list.shipped_packages === 0 ? "" : list.shipped_packages}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                if (/^\d*\.?\d*$/.test(value)) {
                                                                    setShipoutItem((prev) =>
                                                                        prev.map((item) => (item.index_id === list.index_id ? { ...item, shipped_packages: Number(value) } : item))
                                                                    );
                                                                }
                                                            }}
                                                            onFocus={(e) => {
                                                                if (e.target.value === "0") {
                                                                    e.target.select();
                                                                }
                                                            }}
                                                            className="w-full px-3 py-1.5 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-sm rounded"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        {highlightMatch(
                                                            lang === "en"
                                                                ? list.shipping_stat_en
                                                                    ? list.shipping_stat_en
                                                                    : translations["N.A."] || "N.A."
                                                                : list && list.shipping_stat_cn
                                                                ? list.shipping_stat_cn
                                                                : translations["N.A."] || "N.A.",
                                                            searchTerm
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                        <Flatpickr
                                                            onChange={(selectedDates) => {
                                                                const selectedDate = selectedDates?.[0] ?? null;
                                                                setShipoutItem((prev) => prev.map((item) => (item.index_id === list.index_id ? { ...item, date: selectedDate } : item)));
                                                            }}
                                                            options={{
                                                                dateFormat: "M d Y",
                                                                defaultDate: list.date ? new Date(list.date) : undefined,
                                                                allowInput: true,
                                                                locale: locale,
                                                            }}
                                                            className="w-full px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                        {list.is_display_mail === "Sent" ? (
                                                            translations["Sent"]
                                                        ) : list.is_display_mail === "Mail" ? (
                                                            <Mail className="inline-block w-6 h-6 text-blue-400" />
                                                        ) : (
                                                            ""
                                                        )}
                                                    </td>
                                                </tr>
                                                {expanded_ShipoutItem.includes(list.index_id) && (
                                                    <tr>
                                                        <td colSpan={10} className="py-2 px-2">
                                                            <table className="w-full" style={{ backgroundColor: "#060818" }}>
                                                                <thead className="sticky top-0 z-[1] py-1 px-2" style={{ backgroundColor: "#1f2132" }}>
                                                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                                        <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                            {translations["Product Code"]}
                                                                        </th>
                                                                        <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">
                                                                            {translations["Product Name"]}
                                                                        </th>
                                                                        <th className="w-auto text-center py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Qty"]}</th>
                                                                        <th className="w-auto text-left py-2 px-2 text-gray-400 text-sm w-12 border border-[#40404042]">{translations["Remarks"]}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {shipoutItemDetailMap[list.index_id] && shipoutItemDetailMap[list.index_id]!.length > 0 ? (
                                                                        shipoutItemDetailMap[list.index_id]!.map((detail, i) => (
                                                                            <tr key={detail.id || i}>
                                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                    <div className="group flex items-center">
                                                                                        <p className="text-gray-400 text-custom-sm">
                                                                                            {highlightMatch(lang === "en" ? detail.product_code : detail.product_code, searchTerm)}
                                                                                        </p>
                                                                                        <CopyToClipboard text={lang === "en" ? detail.product_code || "" : detail.product_code || ""} />
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">
                                                                                    <div className="group flex items-center">
                                                                                        <p className="text-gray-400 text-custom-sm">
                                                                                            {highlightMatch(lang === "en" ? detail.product_title_en : detail.product_title_cn, searchTerm)}
                                                                                        </p>
                                                                                        <CopyToClipboard text={lang === "en" ? detail.product_title_en || "" : detail.product_title_cn || ""} />
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm border border-[#40404042]">{detail.qty}</td>
                                                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-[#40404042]">{detail.remarks}</td>
                                                                            </tr>
                                                                        ))
                                                                    ) : (
                                                                        <tr>
                                                                            <td colSpan={4} className="py-2 px-2 text-center text-gray-400 text-sm border border-[#40404042]">
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
                                    baseName="ShipOutItems"
                                    ids={selectedMaster.length > 0 ? selectedMaster : shipoutItemList.map((p) => p.id)}
                                    language={lang}
                                />
                            </div>
                            <div className="flex items-center space-x-1">{/* Optional right side content */}</div>
                        </div>
                        {renderPopup()}
                        {renderDateRange()}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ShipouItemList;

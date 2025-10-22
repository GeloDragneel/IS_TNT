import React, { useState, useEffect, useCallback, useMemo } from "react";
import { reportsService, ApiReports, FilterParams } from "@/services/reportsService";
import { useLanguage } from "@/context/LanguageContext";
import { getFlatpickrLocale, formatDateToCustom } from "@/utils/flatpickrLocale";
import { formatMoney, formatDate, baseCurrency } from "@/utils/globalFunction";
import Flatpickr from "react-flatpickr";
import { showErrorToast } from "@/utils/toast";
import { Info, X } from "lucide-react";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);
interface UnpaidItemReceivedProps {
    tabId: string;
}
interface ExpenseItem {
    account_code: string | number;
    account_name_en: string;
    account_name_cn: string;
    amount: number;
}
interface MasterFooter {
    currency: string;
    sales_amount: number;
    cogs_amount: number;
    misc_income: number;
    other_income: number;
    ex_rate_diff: number;
    inventory_cost: number;
    total_revenues: number;
    tax: number;
    net_sales_revenues: number;
    gross_profit: number;
    total_expenses: number;
    ex_rate_gain: number;
    ex_rate_loss: number;
    net_profit: number;
    assets: number;
    expenses: ExpenseItem[];
}
type FormDataType = {
    date_from: Date | null; // Allow null here
    date_to: Date | null; // Allow null here
};
// localStorage.clear();
const UnpaidItemReceived: React.FC<UnpaidItemReceivedProps> = ({ tabId }) => {
    const { translations, lang } = useLanguage();
    const locale = getFlatpickrLocale(translations);
    const [showPopup, setShowPopup] = useState(false);
    const [popupTitle, setPopupTitle] = useState("");
    const [modileTitle, setModileTitle] = useState("");
    const pageSizeOptions = useMemo(() => [10, 20, 50, -1], []);
    const [totalPagesPopup, setTotalPages_Popup] = useState(1);
    const [popupList, setPopupDetails] = useState<ApiReports[]>([]);
    const [masterDisplay, setMasterDisplay] = useState<MasterFooter | null>(null);
    const [formData, setFormData] = useState<FormDataType>({
        date_from: new Date(),
        date_to: new Date(),
    });
    const [searchTermPopup, setSearchTermPopup] = useState(() => {
        const cached = localStorage.getItem(`cached-popup-list`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPagePopup, setCurrentPagePopup] = useState(() => {
        const metaKey = `cached-popup-list`;
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
    const [itemsPerPagePopup, setItemsPerPagePopup] = useState(() => {
        const metaKey = `cached-popup-list`;
        const cachedMeta = localStorage.getItem(metaKey);
        let perPage = 10;
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
    useEffect(() => {
        handleSearch();
    }, [tabId]);

    useEffect(() => {
        const defaultFilters = {
            search: searchTermPopup,
            date_from: formData.date_from,
            date_to: formData.date_to,
        };

        fetchOtherIncome(currentPagePopup, itemsPerPagePopup, defaultFilters);
        fetchSalesRevenue(currentPagePopup, itemsPerPagePopup, defaultFilters);
    }, [currentPagePopup, itemsPerPagePopup, searchTermPopup, tabId]);

    const fetchSalesRevenue = async (page = currentPagePopup, perPage = itemsPerPagePopup, filters: FilterParams = { search: "" }) => {
        try {
            const paginatedData = await reportsService.getSalesReveue(page, perPage, filters);
            setPopupDetails(paginatedData.data);
            setTotalPages_Popup(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching list:", err);
        }
    };
    const fetchOtherIncome = async (page = currentPagePopup, perPage = itemsPerPagePopup, filters: FilterParams = { search: "" }) => {
        try {
            const paginatedData = await reportsService.getOtherIncome(page, perPage, filters);
            console.log(paginatedData);
            setPopupDetails(paginatedData.data);
            setTotalPages_Popup(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching list:", err);
        }
    };
    const handleSearch = async () => {
        const date_from = formData.date_from;
        const date_to = formData.date_to;
        const currency = "RMB";
        if (!date_from) {
            showErrorToast(translations["Please input date from"]);
            return;
        }
        if (!date_to) {
            showErrorToast(translations["Please input date to"]);
            return;
        }
        const paginatedData = await reportsService.getProfitAndLoss(formatDateToCustom(date_from), formatDateToCustom(date_to), currency);
        setMasterDisplay(paginatedData);
    };
    const handleDateFrom = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, date_from: dates[0] ?? null }));
    }, []);
    const handleDateTo = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, date_to: dates[0] ?? null }));
    }, []);
    const handleClear = () => {
        const emptyMasterFooter: MasterFooter = {
            currency: "",
            sales_amount: 0,
            cogs_amount: 0,
            misc_income: 0,
            other_income: 0,
            ex_rate_diff: 0,
            inventory_cost: 0,
            total_revenues: 0,
            tax: 0,
            net_sales_revenues: 0,
            gross_profit: 0,
            total_expenses: 0,
            ex_rate_gain: 0,
            ex_rate_loss: 0,
            net_profit: 0,
            assets: 0,
            expenses: [],
        };
        setMasterDisplay(emptyMasterFooter);
    };
    const handlePopup = (module: string) => {
        switch (module) {
            case "Sales":
                const defaultFilters = {
                    search: searchTermPopup,
                    date_from: formData.date_from,
                    date_to: formData.date_to,
                };
                setPopupTitle(translations["Sales Revenue"]);
                fetchSalesRevenue(currentPagePopup, itemsPerPagePopup, defaultFilters);
                break;
            case "COGS":
                const defaultFilters2 = {
                    search: searchTermPopup,
                    date_from: formData.date_from,
                    date_to: formData.date_to,
                };
                setPopupTitle(translations["Total Cost of Goods Sold"]);
                fetchSalesRevenue(currentPagePopup, itemsPerPagePopup, defaultFilters2);
                break;
            case "OtherIncome":
                const defaultFilters3 = {
                    search: searchTermPopup,
                    date_from: formData.date_from,
                    date_to: formData.date_to,
                };
                setPopupTitle(translations["OtherIncome"]);
                fetchOtherIncome(currentPagePopup, itemsPerPagePopup, defaultFilters3);
                break;
        }
        setModileTitle(module);
        setShowPopup(true);
    };
    const renderPopup = () => {
        if (!showPopup) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] max-h-[80vh] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <h2 className="text-xl font-bold text-white">{popupTitle}</h2>
                        <button
                            onClick={() => setShowPopup(false)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            aria-label={translations["Close"]}
                        >
                            <X className="h-6 w-6 text-white" />
                        </button>
                    </div>
                    <div className="p-2 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="search"
                                        placeholder={translations["Search"]}
                                        value={searchTermPopup}
                                        onChange={(e) => {
                                            setSearchTermPopup(e.target.value);
                                            setCurrentPagePopup(1);
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
                                        <th className="text-left py-2 px-2 text-gray-400 text-sm">{translations["Transaction Date"]}</th>
                                        <th className="text-left py-2 px-2 text-gray-400 text-sm">{translations["Customer"]}</th>
                                        <th className="text-left py-2 px-2 text-gray-400 text-sm">{translations["Reference"]}</th>
                                        <th className="text-center py-2 px-2 text-gray-400 text-sm">{translations["Amount"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {popupList.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-4 px-2 text-center text-gray-400 text-custom-sm">
                                                {translations["No Record Found"]}
                                            </td>
                                        </tr>
                                    ) : (
                                        popupList.map((list, index) => (
                                            <tr key={list.id || index} className="clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors" style={{ borderColor: "#40404042" }}>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{formatDate(list.transaction_date, lang)}</td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{list.customer_code}</p>
                                                    </div>
                                                    <div className="group flex items-center">
                                                        <p className="text-gray-400 text-custom-sm">{list.account_name_en}</p>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.ref_data}</td>
                                                <td className="py-2 px-2 text-gray-400 text-center text-custom-sm">
                                                    {baseCurrency()}
                                                    <br />
                                                    {modileTitle === "Sales" && formatMoney(list.base_amount)}
                                                    {modileTitle === "OtherIncome" && formatMoney(list.base_amount)}
                                                    {modileTitle === "COGS" && formatMoney(list.sub_total_on_cost)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-1">
                            <MemoizedPagination currentPage={currentPagePopup} totalPages={totalPagesPopup} onPageChange={(page) => setCurrentPagePopup(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPagePopup}
                                onChange={(val: number) => {
                                    setItemsPerPagePopup(val);
                                    setCurrentPagePopup(1);
                                }}
                                options={pageSizeOptions}
                            />
                        </div>
                        <div className="flex items-center space-x-1">
                            <button onClick={() => setShowPopup(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                                {translations["Close"]}
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
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <Flatpickr
                                    onChange={handleDateFrom}
                                    options={{
                                        dateFormat: "M d Y",
                                        defaultDate: formData.date_from || undefined,
                                        allowInput: false,
                                        locale: locale,
                                    }}
                                    placeholder={translations["Select"]}
                                    className="px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                />
                            </div>
                            <div className="relative">
                                <Flatpickr
                                    onChange={handleDateTo}
                                    options={{
                                        dateFormat: "M d Y",
                                        defaultDate: formData.date_to || undefined,
                                        allowInput: false,
                                        locale: locale,
                                    }}
                                    placeholder={translations["Select"]}
                                    className="px-3 py-2 border-[1px] border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                />
                            </div>
                            <button onClick={handleSearch} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                                <span>{translations["Search"]}</span>
                            </button>
                            <button onClick={handleClear} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                                <span>{translations["Add New"]}</span>
                            </button>
                            <button className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                                <span>{translations["Print"]}</span>
                            </button>
                        </div>
                    </div>
                </div>
                {/* Table */}
                <div className="overflow-x-auto flex-grow">
                    <div className="h-[calc(100vh-175px)] overflow-y-auto">
                        <table className="table-auto w-full border border-gray-600 border-collapse">
                            <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    <th className="w-[100%] text-center py-4 px-2 text-gray-400 w-12 uppercase" colSpan={3}>
                                        <span className=" text-sm">{translations["Statement of Profit and Loss"]}</span>
                                        <br></br>
                                        <span className="text-xs">
                                            ({formData.date_from ? formatDate(formData.date_from.toISOString(), lang) : "-"} -
                                            {formData.date_to ? formatDate(formData.date_to.toISOString(), lang) : "-"})
                                        </span>
                                    </th>
                                </tr>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    <th className="w-[60%] text-center py-2 px-2 text-gray-400 text-sm w-12 uppercase"></th>
                                    <th className="w-[20%] text-right py-2 px-6 text-gray-400 text-sm w-12 uppercase">{translations["Debit"]}</th>
                                    <th className="w-[20%] text-right py-2 px-6 text-gray-400 text-sm w-12 uppercase">{translations["Credit"]}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {masterDisplay && (
                                    <>
                                        <tr className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                            <td className="py-2 px-4 text-gray-200 text-left text-custom-sm text-lg border border-gray-600">
                                                <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handlePopup("Sales")}>
                                                    <p>{translations["Sales Revenue"]}</p>
                                                    <Info className="w-5 h-5 text-blue-400 hover:text-blue-500" />
                                                </div>
                                            </td>
                                            <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600"></td>
                                            <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600">{formatMoney(masterDisplay.sales_amount)}</td>
                                        </tr>
                                        {masterDisplay.misc_income > 0 && (
                                            <tr className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                                <td className="py-2 px-4 text-gray-200 text-left text-custom-sm text-lg border border-gray-600">{translations["Misc Income"]}</td>
                                                <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600">{formatMoney(masterDisplay.misc_income)}</td>
                                                <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600"></td>
                                            </tr>
                                        )}
                                        <tr className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                            <td className="py-2 px-4 text-gray-200 text-left text-custom-sm text-lg border border-gray-600">{translations["Less: Tax"]}</td>
                                            <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600">{formatMoney(masterDisplay.tax)}</td>
                                            <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600"></td>
                                        </tr>
                                        <tr className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                            <td className="py-2 px-4 text-gray-200 text-left text-custom-sm text-lg border border-gray-600">{translations["Total Revenues"]}</td>
                                            <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600"></td>
                                            <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600">{formatMoney(masterDisplay.total_revenues)}</td>
                                        </tr>
                                        <tr className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                            <td className="py-2 px-4 text-gray-200 text-left text-custom-sm text-lg border border-gray-600">{translations["Net Sales Revenue"]}</td>
                                            <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600"></td>
                                            <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600">{formatMoney(masterDisplay.net_sales_revenues)}</td>
                                        </tr>
                                        <tr className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                            <td className="py-2 px-4 text-gray-200 text-left text-custom-sm text-lg border border-gray-600" colSpan={3}>
                                                {translations["Cost of Goods"]}
                                            </td>
                                        </tr>
                                        <tr className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                            <td className="py-2 px-4 text-gray-200 text-left text-custom-sm text-lg border border-gray-600">
                                                <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handlePopup("COGS")}>
                                                    <p>{translations["Total Cost of Goods Sold"]}</p>
                                                    <Info className="w-5 h-5 text-blue-400 hover:text-blue-500" />
                                                </div>
                                            </td>
                                            <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600">{formatMoney(masterDisplay.cogs_amount)}</td>
                                            <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600"></td>
                                        </tr>
                                        {masterDisplay.other_income > 0 && (
                                            <tr className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                                <td className="py-2 px-4 text-gray-200 text-left text-custom-sm text-lg border border-gray-600">
                                                    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handlePopup("OtherIncome")}>
                                                        <p>{translations["OtherIncome"]}</p>
                                                        <Info className="w-5 h-5 text-blue-400 hover:text-blue-500" />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600"></td>
                                                <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600">{formatMoney(masterDisplay.other_income)}</td>
                                            </tr>
                                        )}
                                        {masterDisplay.inventory_cost > 0 && (
                                            <tr className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                                <td className="py-2 px-4 text-gray-200 text-left text-custom-sm text-lg border border-gray-600">
                                                    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handlePopup("InventoryCost")}>
                                                        <p>{translations["Inventory Cost"]}</p>
                                                        <Info className="w-5 h-5 text-blue-400 hover:text-blue-500" />
                                                    </div>
                                                </td>
                                                <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600">{formatMoney(masterDisplay.inventory_cost)}</td>
                                                <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600"></td>
                                            </tr>
                                        )}
                                        <tr className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                            <td className="py-2 px-4 text-gray-200 text-left text-custom-sm text-lg border border-gray-600">{translations["Gross Profit / (Loss)"]}</td>
                                            <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600"></td>
                                            <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600">{formatMoney(masterDisplay.gross_profit)}</td>
                                        </tr>
                                        <tr className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                            <td className="py-2 px-4 text-gray-200 text-left text-custom-sm text-lg border border-gray-600" colSpan={3}>
                                                {translations["Less Operating Expenses"]}
                                            </td>
                                        </tr>
                                        {masterDisplay.expenses &&
                                            masterDisplay.expenses.length > 0 &&
                                            masterDisplay.expenses.map((expense, index) => (
                                                <tr key={index} className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                                    <td className="py-2 px-2 text-gray-400 text-left text-custom-sm border border-gray-600">
                                                        - {expense.account_code} {expense.account_name_en}
                                                    </td>
                                                    <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600">{formatMoney(expense.amount)}</td>
                                                    <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600"></td>
                                                </tr>
                                            ))}
                                        <tr className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                            <td className="py-2 px-4 text-gray-200 text-left text-custom-sm text-lg border border-gray-600">{translations["Total Operating Expenses"]}</td>
                                            <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600">{formatMoney(masterDisplay.total_expenses)}</td>
                                            <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600"></td>
                                        </tr>
                                        {masterDisplay.ex_rate_loss > 0 && (
                                            <tr className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                                <td className="py-2 px-4 text-gray-200 text-left text-custom-sm text-lg border border-gray-600">{translations["Exchange Rate (Loss)"]}</td>
                                                <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600">{formatMoney(masterDisplay.ex_rate_loss)}</td>
                                                <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600"></td>
                                            </tr>
                                        )}
                                        {masterDisplay.ex_rate_gain > 0 && (
                                            <tr className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                                <td className="py-2 px-4 text-gray-200 text-left text-custom-sm text-lg border border-gray-600">{translations["Exchange Rate (Gain)"]}</td>
                                                <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600"></td>
                                                <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600">{formatMoney(masterDisplay.ex_rate_gain)}</td>
                                            </tr>
                                        )}
                                        {masterDisplay.assets > 0 && (
                                            <tr className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                                <td className="py-2 px-4 text-gray-200 text-left text-custom-sm text-lg border border-gray-600">{translations["Assets"]}</td>
                                                <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600">{formatMoney(masterDisplay.assets)}</td>
                                                <td className="py-2 px-4 text-gray-400 text-right text-custom-sm border border-gray-600"></td>
                                            </tr>
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <table className="table-auto w-full ">
                        <tbody>
                            {masterDisplay && (
                                <tr className=" hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                    <td className="py-2 px-4 text-gray-200 text-left text-custom-sm text-lg" colSpan={2}>
                                        {translations["Net Profit / (Loss)"]}
                                    </td>
                                    <td className="py-2 px-4 text-gray-100 text-right text-custom-sm text-lg">{formatMoney(masterDisplay.net_profit)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {renderPopup()}
            </div>
        </div>
    );
};

export default UnpaidItemReceived;

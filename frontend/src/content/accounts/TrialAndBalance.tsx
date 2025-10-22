import React, { useState, useEffect, useCallback } from "react";
import { reportsService } from "@/services/reportsService";
import { useLanguage } from "@/context/LanguageContext";
import { getFlatpickrLocale, formatDateToCustom } from "@/utils/flatpickrLocale";
import { formatMoney } from "@/utils/globalFunction";
import Flatpickr from "react-flatpickr";
import { showErrorToast } from "@/utils/toast";
interface UnpaidItemReceivedProps {
    tabId: string;
}
type FormDataType = {
    date_from: Date | null; // Allow null here
    date_to: Date | null; // Allow null here
};
interface TrialBalanceEntry {
    account_code: string;
    transaction_date: string;
    account_name_en: string;
    account_name_cn: string;
    amount: number;
}
interface TrialBalanceSection {
    data: TrialBalanceEntry[];
    total: number;
}
interface MasterFooter {
    assets: TrialBalanceSection;
    liabilities: TrialBalanceSection;
    equity: TrialBalanceSection;
}
// localStorage.clear();
const UnpaidItemReceived: React.FC<UnpaidItemReceivedProps> = ({ tabId }) => {
    const { translations, lang } = useLanguage();
    const locale = getFlatpickrLocale(translations);
    const [masterDisplay, setMasterDisplay] = useState<MasterFooter | null>(null);
    const [formData, setFormData] = useState<FormDataType>({
        date_from: new Date(),
        date_to: new Date(),
    });

    useEffect(() => {
        handleSearch();
    }, [tabId]);

    const handleSearch = async () => {
        const date_from = formData.date_from;
        const date_to = formData.date_to;
        if (!date_from) {
            showErrorToast(translations["Please input date from"]);
            return;
        }
        if (!date_to) {
            showErrorToast(translations["Please input date to"]);
            return;
        }
        const paginatedData = await reportsService.getTrialBalance(formatDateToCustom(date_from), formatDateToCustom(date_to));
        setMasterDisplay(paginatedData);
    };
    const handleDateFrom = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, date_from: dates[0] ?? null }));
    }, []);
    const handleDateTo = useCallback((dates: Date[]) => {
        setFormData((prev) => ({ ...prev, date_to: dates[0] ?? null }));
    }, []);
    return (
        <div className="space-y-6">
            {/* Main Content Card */}
            <div className="rounded-lg border shadow-sm" style={{ backgroundColor: "#19191c", borderColor: "#404040" }}>
                {/* Toolbar */}
                <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
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
                        </div>
                    </div>
                </div>
                {/* Table */}
                <div className="flex-grow">
                    <div className="h-[calc(100vh-155px)] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2 mt-2">
                            <div>
                                <table className="table-auto w-full border border-gray-600 border-collapse">
                                    <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                            <th className="text-left py-2 px-4 text-gray-400 uppercase">
                                                <span className="text-sm">{translations["Assets"]}</span>
                                            </th>
                                            <th className="text-right py-2 px-4 text-gray-400 text-sm uppercase">{translations["Debit"]}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {masterDisplay &&
                                            masterDisplay.assets.data.map((item: any, index: number) => (
                                                <tr key={index} className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                                    <td className="py-2 px-4 text-gray-400 text-left border border-gray-600 text-custom-sm">
                                                        {item.account_code} {lang === "en" ? item.account_name_en : item.account_name_cn}
                                                    </td>
                                                    <td className="py-2 px-4 text-gray-200 text-right border border-gray-600 text-custom-sm">{formatMoney(item.amount)}</td>
                                                </tr>
                                            ))}
                                        {/* Assets Total */}
                                        {masterDisplay && (
                                            <tr className="border-t border-gray-600 font-bold bg-gray-800">
                                                <td className="py-2 px-4 text-gray-200 text-left border border-gray-600">{translations["Total Assets"]}</td>
                                                <td className="py-2 px-4 text-gray-200 text-right border border-gray-600">{formatMoney(masterDisplay.assets.total)}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div>
                                <table className="table-auto w-full border border-gray-600 border-collapse">
                                    <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                            <th className="text-left py-2 px-4 text-gray-400 uppercase">
                                                <span className="text-sm">{translations["Liabilities"]}</span>
                                            </th>
                                            <th className="text-right py-2 px-4 text-gray-400 text-sm uppercase">{translations["Credit"]}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {masterDisplay &&
                                            masterDisplay.liabilities.data.map((item: any, index: number) => (
                                                <tr key={index} className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                                    <td className="py-2 px-4 text-gray-400 text-left border border-gray-600 text-custom-sm">
                                                        {item.account_code} {lang === "en" ? item.account_name_en : item.account_name_cn}
                                                    </td>
                                                    <td className="py-2 px-4 text-gray-200 text-right border border-gray-600 text-custom-sm">{formatMoney(item.amount)}</td>
                                                </tr>
                                            ))}

                                        {/* Total row */}
                                        {masterDisplay && (
                                            <tr className="border-t border-gray-600 font-bold bg-gray-800">
                                                <td className="py-2 px-4 text-gray-200 text-left border border-gray-600">{translations["Total Liabilities"]}</td>
                                                <td className="py-2 px-4 text-gray-200 text-right border border-gray-600">{formatMoney(masterDisplay.liabilities.total)}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                <table className="table-auto w-full border border-gray-600 border-collapse mt-2">
                                    <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                            <th className="text-left py-2 px-4 text-gray-400 uppercase">
                                                <span className="text-sm">{translations["Equity"]}</span>
                                            </th>
                                            <th className="text-right py-2 px-4 text-gray-400 text-sm uppercase">{translations["Credit"]}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {masterDisplay &&
                                            masterDisplay.equity.data.map((item: any, index: number) => (
                                                <tr key={index} className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                                    <td className="py-2 px-4 text-gray-400 text-left border border-gray-600 text-custom-sm">
                                                        {item.account_code} {lang === "en" ? item.account_name_en : item.account_name_cn}
                                                    </td>
                                                    <td className="py-2 px-4 text-gray-200 text-right border border-gray-600 text-custom-sm">{formatMoney(item.amount)}</td>
                                                </tr>
                                            ))}

                                        {/* Total row */}
                                        {masterDisplay && (
                                            <tr className="border-t border-gray-600 font-bold bg-gray-800">
                                                <td className="py-2 px-4 text-gray-200 text-left border border-gray-600">
                                                    {translations["Total Liabilities"]} {translations["&"]} {translations["Total Equity"]}
                                                </td>
                                                <td className="py-2 px-4 text-gray-200 text-right border border-gray-600">
                                                    {formatMoney(masterDisplay.equity.total + masterDisplay.liabilities.total)}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnpaidItemReceived;

import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { dashboardService } from "@/services/dashboardService";
import { baseCurrency, formatDate } from "@/utils/globalFunction";
import CopyToClipboard from "@/components/CopyToClipboard";
import { PackageCheck, ArrowDownCircle, ArrowUpCircle, Wallet, Landmark, TrendingDown, Receipt } from "lucide-react";
import { Legend, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, Cell, LegendPayload } from "recharts";

interface DashboardFields {
    month: string;
    name: string;
    value: number;
    color: string;
}

const AccountsDashboard: React.FC = () => {
    const { translations, lang } = useLanguage();
    const [monthlyRevenue, setRevenue] = useState<DashboardFields[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [agingInvoices, setAgingInvoices] = useState<any>(null);
    const [agingSalesOrder, setAgingSalesOrder] = useState<any>(null);
    const [topSalesPerson, setTopSalesPerson] = useState<DashboardFields[]>([]);
    const months = [
        translations["Jan"],
        translations["Feb"],
        translations["Mar"],
        translations["Apr"],
        translations["May"],
        translations["Jun"],
        translations["Jul"],
        translations["Aug"],
        translations["Sep"],
        translations["Oct"],
        translations["Nov"],
        translations["Dec"],
    ];
    const currentYear = new Date().getFullYear();
    const availableYears = Array.from({ length: 7 }, (_, i) => currentYear - i);
    const [selectedMonthYear, setSelectedMonthYear] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });

    useEffect(() => {
        const fetchDashboard = async () => {
            const data = await dashboardService.getDashboardAccounts(Number(selectedMonthYear.month + 1), Number(selectedMonthYear.year));
            const monthlyRevenue = data.revenue;
            const groupedExpensesByAccount = data.groupedExpensesByAccount;
            const mapToWithdrawInventory: DashboardFields[] = monthlyRevenue.map((item: any) => ({
                month: translations[item.month] || item.month,
                income: item.income,
                expenses: item.expenses,
                cost: item.cost,
            }));
            const mappedToSalesPerson: DashboardFields[] = groupedExpensesByAccount.map((item: any) => ({
                name: lang === "en" ? item.account_name_en : item.account_name_cn,
                value: item.total_base_amount,
                color: item.color || "bg-gray-500", // fallback color
            }));
            setRevenue(mapToWithdrawInventory);
            setSummary(data.summary);
            setAgingInvoices(data.AgingInvoices);
            setAgingSalesOrder(data.AgingSalesOrder);
            setTopSalesPerson(mappedToSalesPerson);
        };
        fetchDashboard();
    }, [lang, selectedMonthYear]);

    const tailwindToHex: Record<string, string> = {
        "rose-500": "#f43f5e",
        "fuchsia-500": "#d946ef",
        "lime-500": "#84cc16",
        "amber-500": "#f59e0b",
        "emerald-500": "#10b981",
        "cyan-500": "#06b6d4",
        "violet-500": "#8b5cf6",
        "orange-500": "#f97316",
        "sky-500": "#0ea5e9",
        "indigo-500": "#6366f1",
    };

    const pieDataSalesPerson = topSalesPerson.map((cat) => {
        const colorKey = cat.color.replace("bg-", "").replace("/50", "");
        return {
            name: cat.name,
            value: cat.value,
            color: tailwindToHex[colorKey] || "#8884d8",
        };
    });

    const formatAmount = (value: number): string => {
        if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + "B";
        if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + "M";
        if (value >= 1_000) return (value / 1_000).toFixed(2) + "K";
        return value.toFixed(2);
    };
    interface CustomLegendProps {
        payload?: LegendPayload[];
    }
    const CustomLegend: React.FC<CustomLegendProps> = ({ payload }) => {
        if (!payload) return null;
        return (
            <div className="flex flex-col items-start gap-2 mt-5 px-2">
                {payload.map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded hover:bg-gray-800 transition-colors">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-gray-300 text-xs font-medium whitespace-nowrap">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    };
    const maxItems = 10;
    const sortedData = [...pieDataSalesPerson].sort((a, b) => b.value - a.value);

    let dataForChart;
    if (sortedData.length > maxItems) {
        const topItems = sortedData.slice(0, maxItems - 1); // reserve 1 for "Others"
        const others = sortedData.slice(maxItems - 1);
        const othersTotal = others.reduce((sum, item) => sum + item.value, 0);
        dataForChart = [...topItems, { name: "Others", value: othersTotal, color: "#555", othersList: others }];
    } else {
        dataForChart = sortedData;
    }

    type TooltipData = {
        name: string;
        value: number;
        othersList?: { name: string; value: number }[];
    };

    interface CustomTooltipProps {
        active?: boolean;
        payload?: { payload: TooltipData }[];
    }

    const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
        if (!active || !payload || !payload.length) return null;
        const data = payload[0].payload;
        return (
            <div
                style={{
                    background: "#1f1f1f",
                    border: "1px solid #333",
                    borderRadius: 8,
                    padding: "10px",
                    color: "#fff",
                    maxWidth: 250,
                }}
            >
                <strong style={{ fontSize: 14 }}>{data.name}</strong>

                {data.name === "Others" && data.othersList ? (
                    <ul style={{ marginTop: 6, fontSize: 12, color: "#ccc" }}>
                        {data.othersList.map((o, i) => (
                            <li key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>{o.name}</span>
                                <span>{formatAmount(o.value)}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ marginTop: 6, color: "#ccc" }}>Value: {formatAmountCompact(data.value)}</p>
                )}
            </div>
        );
    };
    const formatAmountCompact = (value: number) => {
        if (value >= 1_000_000_000) {
            return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "b";
        }
        if (value >= 1_000_000) {
            return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
        }
        if (value >= 1_000) {
            return (value / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
        }
        return value.toString();
    };
    return (
        <div className="dashboard-scrollable-container max-h-[calc(100vh-70px)] overflow-y-auto">
            <div className="space-y-6">
                {/* Top Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    <div className="md:col-span-2 p-4 rounded-xl shadow-sm bg-gray-900">
                        {/* Months */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {months.map((m, i) => {
                                const isFutureMonth = selectedMonthYear.year === new Date().getFullYear() && i > new Date().getMonth();
                                return (
                                    <button
                                        key={m}
                                        onClick={() => !isFutureMonth && setSelectedMonthYear((prev) => ({ ...prev, month: i }))}
                                        disabled={isFutureMonth}
                                        className={`text-sm font-medium py-2 px-2 rounded-md transition w-full ${
                                            selectedMonthYear.month === i
                                                ? "bg-cyan-600 text-white"
                                                : isFutureMonth
                                                ? "bg-gray-600 text-gray-300 cursor-not-allowed" // slightly darker gray
                                                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                                        }`}
                                    >
                                        {m}
                                    </button>
                                );
                            })}
                        </div>
                        {/* Years */}
                        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto mb-4">
                            {availableYears.map((y) => {
                                const isFutureYear = y > new Date().getFullYear();
                                return (
                                    <button
                                        key={y}
                                        onClick={() => !isFutureYear && setSelectedMonthYear((prev) => ({ ...prev, year: y }))}
                                        disabled={isFutureYear}
                                        className={`text-sm py-2 px-2 rounded-md w-full text-left transition ${
                                            selectedMonthYear.year === y
                                                ? "bg-cyan-600 text-white"
                                                : isFutureYear
                                                ? "bg-gray-600 text-gray-300 cursor-not-allowed" // slightly darker gray
                                                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                                        }`}
                                    >
                                        {y}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div
                        className="md:col-span-6 p-6 rounded-xl border shadow-sm"
                        style={{
                            backgroundColor: "#19191c",
                            borderColor: "#404040",
                            height: 400,
                            paddingBottom: 20,
                        }}
                    >
                        <div className="flex items-center mb-4">
                            <h2 className="text-lg font-bold text-white mr-2">
                                {translations["Account Summary"] || "Account Summary"} <span>{selectedMonthYear.year}</span>
                            </h2>
                        </div>
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={monthlyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                                <defs>
                                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid strokeDasharray="3 3" stroke="#2f2f2f" />
                                <XAxis dataKey="month" stroke="#bbb" tick={{ fontSize: 13, fontWeight: 600 }} tickLine={false} />
                                <YAxis
                                    stroke="#bbb"
                                    tick={{ fontSize: 13, fontWeight: 600 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => {
                                        if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
                                        if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
                                        return value;
                                    }}
                                />

                                {/* Custom Tooltip */}
                                <Tooltip
                                    cursor={{ stroke: "#444", strokeDasharray: "3 3" }}
                                    contentStyle={{
                                        backgroundColor: "#1f1f25",
                                        border: "1px solid #0891B2",
                                        borderRadius: "10px",
                                        color: "#fff",
                                        boxShadow: "0 0 12px #0891B266",
                                    }}
                                    formatter={(value: number, name: string) => {
                                        const formatted =
                                            value >= 1_000_000_000
                                                ? `${(value / 1_000_000_000).toFixed(2)}B`
                                                : value >= 1_000_000
                                                ? `${(value / 1_000_000).toFixed(2)}M`
                                                : value >= 1_000
                                                ? `${(value / 1_000).toFixed(2)}K`
                                                : value.toLocaleString();
                                        return [`RMB ${formatted}`, name];
                                    }}
                                    labelStyle={{ color: "#aaa", fontWeight: 500 }}
                                />

                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    wrapperStyle={{
                                        color: "#ccc",
                                        fontSize: 13,
                                        fontWeight: 500,
                                    }}
                                />

                                {/* Income Line */}
                                <Line
                                    type="monotone"
                                    dataKey="income"
                                    name="Income"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "#3b82f6" }}
                                    activeDot={{ r: 7, fill: "#60a5fa" }}
                                    fillOpacity={1}
                                    fill="url(#incomeGradient)"
                                />

                                {/* Cost Line */}
                                <Line
                                    type="monotone"
                                    dataKey="cost"
                                    name="Cost of Goods"
                                    stroke="#eab308"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "#eab308" }}
                                    activeDot={{ r: 7, fill: "#facc15" }}
                                    fillOpacity={1}
                                    fill="url(#costGradient)"
                                />

                                {/* Expenses Line */}
                                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5, fill: "#f87171" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="md:col-span-4 p-0 rounded-xl shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                            {[
                                {
                                    title: translations["Income"] || "Income",
                                    value: summary?.totalIncome || 0,
                                    icon: Landmark,
                                    bg: "bg-indigo-900/50",
                                    iconColor: "text-indigo-400",
                                },
                                {
                                    title: translations["Cost of Goods Sold"] || "Cost of Goods Sold",
                                    value: summary?.totalCost || 0,
                                    icon: PackageCheck,
                                    bg: "bg-green-900/50",
                                    iconColor: "text-green-400",
                                },
                                {
                                    title: translations["Expenses"] || "Expenses",
                                    value: summary?.totalExpenses || 0,
                                    icon: TrendingDown,
                                    bg: "bg-red-900/50",
                                    iconColor: "text-red-400",
                                },
                                {
                                    title: translations["Accounts Receivable"] || "Accounts Receivable",
                                    value: summary?.accountsReceivable || 0,
                                    icon: ArrowUpCircle,
                                    bg: "bg-cyan-900/50",
                                    iconColor: "text-cyan-400",
                                },
                                {
                                    title: translations["Deposit Received (Customer)"] || "Deposit Received (Customer)",
                                    value: summary?.depositReceived || 0,
                                    icon: ArrowDownCircle,
                                    bg: "bg-blue-900/50",
                                    iconColor: "text-blue-400",
                                },
                                {
                                    title: translations["Deposit Offset (Customer)"] || "Deposit Offset (Customer)",
                                    value: summary?.depositOffsetCustomer || 0,
                                    icon: ArrowUpCircle,
                                    bg: "bg-teal-900/50",
                                    iconColor: "text-teal-400",
                                },
                                {
                                    title: translations["Advance Payment"] || "Advance Payment",
                                    value: summary?.advancePayment || 0,
                                    icon: Wallet,
                                    bg: "bg-yellow-900/50",
                                    iconColor: "text-yellow-400",
                                },
                                {
                                    title: translations["Accounts Payable"] || "Accounts Payable",
                                    value: summary?.accountsPayableTotal || 0,
                                    icon: Receipt,
                                    bg: "bg-purple-900/50",
                                    iconColor: "text-purple-400",
                                },
                            ].map((card, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 rounded-lg shadow-md border border-gray-700 transition-all duration-200 hover:shadow-lg hover:border-cyan-600"
                                    style={{ backgroundColor: "#19191c", borderColor: "#404040" }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-400 text-sm">{card.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-3xl font-bold text-white">{card.value.toLocaleString()}</p>
                                                <div className="flex items-center gap-1 text-gray-400 text-xs px-1 py-1 border-gray-700">
                                                    <span>
                                                        {months[selectedMonthYear.month]} {selectedMonthYear.year}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`${card.bg} p-3 rounded-lg`}>
                                            <card.icon className={card.iconColor} size={24} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-6 p-0 rounded-xl shadow-sm">
                        <div
                            className="md:col-span-7 p-4 rounded-xl border shadow-sm"
                            style={{
                                backgroundColor: "#19191c",
                                borderColor: "#404040",
                                height: "auto",
                                paddingBottom: 20,
                            }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-white">{translations?.["Ageing Invoices"] || "Ageing Invoices"}</h2>
                                <div className="flex items-center gap-1 text-gray-400 text-xs px-1 py-1 border-gray-700">
                                    <span>
                                        {months[selectedMonthYear.month]} {selectedMonthYear.year}
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-x-auto flex-grow">
                                <div className="h-[calc(100vh-670px)] overflow-y-auto">
                                    <table className="w-full">
                                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                <th className="text-left py-2 px-2 text-gray-400 text-sm">{translations["Date"]}</th>
                                                <th className="text-left py-2 px-2 text-gray-400 text-sm">{translations["Customer Code"]}</th>
                                                <th className="text-left py-2 px-2 text-gray-400 text-sm">{translations["Customer Name"]}</th>
                                                <th className="text-left py-2 px-2 text-gray-400 text-sm">{translations["SO No"]}</th>
                                                <th className="text-center py-2 px-2 text-gray-400 text-sm">{translations["Amount"]}</th>
                                                <th className="text-center py-2 px-2 text-gray-400 text-sm">{translations["Age (Days)"]}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {agingInvoices?.length > 0 ? (
                                                agingInvoices.map((row: any, index: number) => (
                                                    <tr key={index} className="border-b hover:bg-gray-800/40 transition-colors" style={{ borderColor: "#2d2d30" }}>
                                                        <td className="text-gray-400 py-2 px-2 text-custom-sm">{formatDate(row.invoice_date, lang)}</td>
                                                        <td className="text-gray-400 py-2 px-2 text-custom-sm">{row.customer_code}</td>
                                                        <td className="text-gray-400 py-2 px-2 text-custom-sm">{row.customer_name}</td>
                                                        <td className="text-gray-400 py-2 px-2 text-custom-sm">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-400 text-custom-sm">{row.invoice_no}</p>
                                                                    <CopyToClipboard text={row.invoice_no || ""} />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-gray-400 py-2 px-2 text-custom-sm text-center">
                                                            {baseCurrency()} {row.base_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="text-gray-400 py-2 px-2 text-custom-sm text-center">{row.age ?? "-"}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="py-4 text-center text-gray-500">
                                                        {translations["No Record Found"]}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-6 p-0 rounded-xl shadow-sm">
                        <div
                            className="md:col-span-7 p-4 rounded-xl border shadow-sm"
                            style={{
                                backgroundColor: "#19191c",
                                borderColor: "#404040",
                                height: "auto",
                                paddingBottom: 20,
                            }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-white">{translations?.["Ageing Sales Order"] || "Ageing Sales Order"}</h2>
                                <div className="flex items-center gap-1 text-gray-400 text-xs px-1 py-1 border-gray-700">
                                    <span>
                                        {months[selectedMonthYear.month]} {selectedMonthYear.year}
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-x-auto flex-grow">
                                <div className="h-[calc(100vh-670px)] overflow-y-auto">
                                    <table className="w-full">
                                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                <th className="text-left py-2 px-2 text-gray-400 text-sm">{translations["Date"]}</th>
                                                <th className="text-left py-2 px-2 text-gray-400 text-sm">{translations["Customer Code"]}</th>
                                                <th className="text-left py-2 px-2 text-gray-400 text-sm">{translations["Customer Name"]}</th>
                                                <th className="text-left py-2 px-2 text-gray-400 text-sm">{translations["SO No"]}</th>
                                                <th className="text-center py-2 px-2 text-gray-400 text-sm">{translations["Amount"]}</th>
                                                <th className="text-center py-2 px-2 text-gray-400 text-sm">{translations["Age (Days)"]}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {agingSalesOrder?.length > 0 ? (
                                                agingSalesOrder.map((row: any, index: number) => (
                                                    <tr key={index} className="border-b hover:bg-gray-800/40 transition-colors" style={{ borderColor: "#2d2d30" }}>
                                                        <td className="text-gray-400 py-2 px-2 text-custom-sm">{formatDate(row.invoice_date, lang)}</td>
                                                        <td className="text-gray-400 py-2 px-2 text-custom-sm">{row.customer_code}</td>
                                                        <td className="text-gray-400 py-2 px-2 text-custom-sm">{row.customer_name}</td>
                                                        <td className="text-gray-400 py-2 px-2 text-custom-sm">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="group flex items-center">
                                                                    <p className="text-gray-400 text-custom-sm">{row.invoice_no}</p>
                                                                    <CopyToClipboard text={row.invoice_no || ""} />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-gray-400 py-2 px-2 text-custom-sm text-center">
                                                            {baseCurrency()} {row.base_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="text-gray-400 py-2 px-2 text-custom-sm text-center">{row.age ?? "-"}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="py-4 text-center text-gray-500">
                                                        {translations["No Record Found"]}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        className="md:col-span-12 p-4 rounded-xl shadow-sm flex flex-col"
                        style={{
                            backgroundColor: "#19191c",
                            borderColor: "#404040",
                            borderWidth: 1,
                            borderStyle: "solid",
                            height: 460,
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white">
                                {translations?.["Expenses"] || "Expenses"} <span>{selectedMonthYear.year}</span>
                            </h2>
                        </div>

                        {/* Chart + Legend */}
                        <div style={{ display: "flex", gap: "20px", height: 460 }}>
                            {/* Chart */}
                            <div style={{ flexGrow: 1, position: "relative" }}>
                                {dataForChart.length === 0 ? (
                                    // Empty design if no data
                                    <div
                                        style={{
                                            height: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#666",
                                            fontSize: 14,
                                            fontStyle: "italic",
                                            border: "1px dashed #333",
                                            borderRadius: 8,
                                        }}
                                    >
                                        {translations["No Expenses Yet"] || "No Expenses Yet"}
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={dataForChart}
                                            margin={{ top: 20, right: 20, left: 20, bottom: 40 }} // add bottom margin for X-axis labels
                                        >
                                            <defs>
                                                {dataForChart.map((entry, index) => (
                                                    <linearGradient key={`bar-gradient-${index}`} id={`bar-gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                                                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                                                    </linearGradient>
                                                ))}
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
                                            <XAxis type="category" dataKey="name" tick={{ fill: "#ccc", fontSize: 12 }} interval={0} />
                                            <YAxis type="number" tick={{ fill: "#ccc", fontSize: 12 }} />
                                            <Tooltip cursor={{ fill: "rgba(255, 255, 255, 0.05)" }} content={<CustomTooltip />} />
                                            <Bar
                                                dataKey="value"
                                                barSize={90}
                                                radius={[6, 6, 0, 0]}
                                                label={({ x, y, width, value }) => {
                                                    const w = typeof width === "number" ? width : 0;
                                                    const val = typeof value === "number" ? value : 0;
                                                    return (
                                                        <text
                                                            x={(typeof x === "number" ? x : 0) + w / 2} // use numeric w
                                                            y={(typeof y === "number" ? y : 0) - 5} // numeric y
                                                            fill="#fff"
                                                            fontSize={12}
                                                            textAnchor="middle"
                                                            dominantBaseline="middle"
                                                        >
                                                            {formatAmountCompact(val)}
                                                        </text>
                                                    );
                                                }}
                                            >
                                                {dataForChart.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={`url(#bar-gradient-${index})`} className={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            {/* Legend on the right */}
                            <div style={{ width: 200, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                <CustomLegend
                                    payload={dataForChart.map((d) => ({
                                        value: d.name,
                                        color: d.color,
                                    }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountsDashboard;

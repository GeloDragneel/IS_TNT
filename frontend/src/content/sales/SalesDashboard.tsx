import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { dashboardService } from "@/services/dashboardService";
import { baseCurrency, formatMoney } from "@/utils/globalFunction";
import { PackageCheck, ArrowDownCircle, ArrowUpCircle, Wallet, Landmark, TrendingDown, Receipt } from "lucide-react";
import { Legend, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, PieLabelRenderProps, LegendPayload, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

interface DashboardFields {
    month: string;
    name: string;
    value: number;
    color: string;
    rank: number;
    price: number;
    category: string;
    sales: number;
    salesChange: number;
    image: string;
}
const SaleDashboard: React.FC = () => {
    const { translations, lang } = useLanguage();
    const [monthlyRevenue, setRevenue] = useState<DashboardFields[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [topCustomers, setTopCustomers] = useState<DashboardFields[]>([]);
    const [topSalesPerson, setTopSalesPerson] = useState<DashboardFields[]>([]);
    const [topProducts, setTopProducts] = useState<DashboardFields[]>([]);
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
    const [selectedMetric, setSelectedMetric] = useState<"total_sales" | "total_deposit" | "total_qty">("total_sales");
    useEffect(() => {
        const fetchDashboard = async () => {
            const data = await dashboardService.getDashboardSales(Number(selectedMonthYear.month + 1), Number(selectedMonthYear.year));
            const monthlyRevenue = data.monthlyRevenue;
            const topCustomer = data.topCustomer;
            const topSalesPerson = data.topSalesPerson;
            const topProducts = data.topProducts;
            const mapToSalesSummary: DashboardFields[] = monthlyRevenue.map((item: any) => ({
                month: translations[item.month] || item.month,
                total_sales: item.total_sales,
                total_deposit: item.total_deposit,
                total_qty: item.total_qty,
            }));
            const mappedTopCustomer: DashboardFields[] = topCustomer.map((item: any) => ({
                name: item.customer_code,
                value: item.base_total,
                color: item.color || "bg-gray-500", // fallback color
            }));
            const mappedToSalesPerson: DashboardFields[] = topSalesPerson.map((item: any) => ({
                name: item.customer_code,
                value: item.base_total,
                color: item.color || "bg-gray-500", // fallback color
            }));
            const mappedToTopProducts: DashboardFields[] = topProducts.map((item: any) => ({
                rank: item.rank,
                name: lang === "en" ? item.product_title_en : item.product_title_cn,
                price: item.base_total,
                category: lang === "en" ? item.brands_en : item.brands_cn,
                sales: item.base_total,
                salesChange: item.qty,
                image: import.meta.env.VITE_BASE_URL + "/storage/products/thumbnail/" + item.product_code + "_thumbnail.webp",
            }));
            setTopCustomers(mappedTopCustomer);
            setTopSalesPerson(mappedToSalesPerson);
            setTopProducts(mappedToTopProducts);
            setRevenue(mapToSalesSummary);
            setSummary(data.summary);
        };
        fetchDashboard();
    }, [lang, selectedMonthYear]);

    const metricSettings = {
        total_sales: { label: translations["Total"], color: "#3b82f6", dataKey: "total_sales" },
        total_deposit: { label: translations["Deposit"], color: "#eab308", dataKey: "total_deposit" },
        total_qty: { label: translations["Quantity"], color: "#4ade80", dataKey: "total_qty" },
    };
    const { label, color, dataKey } = metricSettings[selectedMetric];
    const tailwindToHex: Record<string, string> = {
        "red-500": "#ef4444",
        "blue-500": "#3b82f6",
        "green-500": "#22c55e",
        "yellow-500": "#eab308",
        "purple-500": "#a855f7",
        "pink-500": "#ec4899",
        "gray-500": "#6b7280",
    };
    const pieDataCustomer = topCustomers.map((cat) => {
        const colorKey = cat.color.replace("bg-", "").replace("/50", "");
        return {
            name: cat.name,
            value: cat.value,
            color: tailwindToHex[colorKey] || "#8884d8",
        };
    });
    const pieDataSalesPerson = topSalesPerson.map((cat) => {
        const colorKey = cat.color.replace("bg-", "").replace("/50", "");
        return {
            name: cat.name,
            value: cat.value,
            color: tailwindToHex[colorKey] || "#8884d8",
        };
    });

    const CustomTooltip = (props: any) => {
        const { active, payload } = props;
        const totalSumAmount = topCustomers.reduce((total, item) => total + item.value, 0);
        if (active && payload && payload.length) {
            const total = totalSumAmount;
            const percentage = ((payload[0].value / total) * 100).toFixed(1);
            return (
                <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3">
                    <p className="text-white font-semibold text-sm">{payload[0].name}</p>
                    <p className="text-gray-300 text-sm">{formatMoney(payload[0].value)}</p>
                    <p className="text-gray-400 text-xs">{percentage}%</p>
                </div>
            );
        }

        return null;
    };
    const renderCustomLabel = (props: PieLabelRenderProps) => {
        // cast numeric fields explicitly
        const cx = props.cx as number;
        const cy = props.cy as number;
        const midAngle = props.midAngle as number;
        const innerRadius = props.innerRadius as number;
        const outerRadius = props.outerRadius as number;
        const percent = props.percent as number | undefined;

        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent && percent < 0.05) return null;

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" className="text-xs font-semibold" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
                {`${(percent! * 100).toFixed(0)}%`}
            </text>
        );
    };
    interface CustomLegendProps {
        payload?: LegendPayload[];
    }
    const CustomLegend: React.FC<CustomLegendProps> = ({ payload }) => {
        if (!payload) return null;
        return (
            <div className="flex flex-wrap justify-center gap-2 mt-2 px-2">
                {payload.map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center gap-1.5 bg-gray-800/50 px-2.5 py-1.5 rounded hover:bg-gray-800 transition-colors">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-gray-300 text-xs font-medium whitespace-nowrap">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    };
    type TrendArrowProps = {
        change: number;
    };
    const formatAmount = (value: number): string => {
        if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + "B";
        if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + "M";
        if (value >= 1_000) return (value / 1_000).toFixed(2) + "K";
        return value.toFixed(2);
    };

    const TrendArrow: React.FC<TrendArrowProps> = ({ change }) => <span className={`ml-1 text-sm font-semibold text-green-400`}>: {Math.abs(change)}</span>;
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
                    <div className="md:col-span-6 p-6 rounded-2xl border shadow-lg" style={{ backgroundColor: "#19191c", borderColor: "#404040", height: "auto", paddingBottom: 20 }}>
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-xl font-bold text-white">
                                {translations["Preorder Summary"] || "Preorder Summary"} <span>{selectedMonthYear.year}</span>
                            </h2>
                            {/* Right section: Metric buttons + year dropdown */}
                            <div className="flex items-center gap-1 relative">
                                {/* Metric switch buttons */}
                                <div className="flex gap-1">
                                    {Object.keys(metricSettings).map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedMetric(key as "total_sales" | "total_deposit" | "total_qty")}
                                            className={`px-2 py-1 rounded-full transition-colors duration-200 ${
                                                selectedMetric === key ? "bg-white text-black shadow-md" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                            }`}
                                        >
                                            {metricSettings[key as keyof typeof metricSettings].label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={monthlyRevenue} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="4 4" stroke="#2a2a2a" />
                                <XAxis dataKey="month" stroke="#aaa" tick={{ fontSize: 13, fontWeight: 600 }} tickLine={false} axisLine={{ stroke: "#555" }} />
                                <YAxis
                                    stroke="#aaa"
                                    tick={{ fontSize: 13, fontWeight: 600 }}
                                    tickLine={false}
                                    axisLine={{ stroke: "#555" }}
                                    tickFormatter={(value) => {
                                        if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
                                        if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
                                        return value;
                                    }}
                                />
                                <Tooltip
                                    cursor={{ stroke: "#888", strokeWidth: 2, strokeDasharray: "3 3" }}
                                    contentStyle={{
                                        backgroundColor: "#2c2c34",
                                        border: "1px solid " + color,
                                        borderRadius: "8px",
                                        color: "#fff",
                                        fontSize: 14,
                                        boxShadow: `0 0 10px ${color}66`,
                                    }}
                                    formatter={(value: number) => {
                                        const isCurrency = dataKey === "total_sales" || dataKey === "total_deposit";
                                        const formatted =
                                            value >= 1_000_000_000
                                                ? `${(value / 1_000_000_000).toFixed(2)}B`
                                                : value >= 1_000_000
                                                ? `${(value / 1_000_000).toFixed(2)}M`
                                                : value >= 1_000
                                                ? `${(value / 1_000).toFixed(2)}K`
                                                : value.toLocaleString();
                                        return [isCurrency ? baseCurrency() + " " + formatted : formatted, label];
                                    }}
                                />
                                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ color: "#ccc", fontSize: 13, fontWeight: 500 }} />
                                <Line
                                    type="monotone"
                                    dataKey={dataKey}
                                    name={label}
                                    stroke={color}
                                    strokeWidth={3.5}
                                    dot={{ r: 5, fill: color, stroke: "#fff", strokeWidth: 1.5 }}
                                    activeDot={{ r: 8, fill: color, stroke: "#fff", strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="md:col-span-4 p-0 rounded-xl shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                            {[
                                {
                                    title: translations["Total Sales (Confirmed)"] || "Total Sales (Confirmed)",
                                    value: summary?.totalConfirmed_total || "0",
                                    icon: Landmark,
                                    bg: "bg-indigo-900/50",
                                    iconColor: "text-indigo-400",
                                },
                                {
                                    title: translations["Total Sales (Unconfirmed)"] || "Total Sales (Unconfirmed)",
                                    value: summary?.totalUnconfirmed_total || 0,
                                    icon: PackageCheck,
                                    bg: "bg-green-900/50",
                                    iconColor: "text-green-400",
                                },
                                {
                                    title: translations["Total Deposit (Confirmed)"] || "Total Deposit (Confirmed)",
                                    value: summary?.totalConfirmed_deposit || 0,
                                    icon: TrendingDown,
                                    bg: "bg-red-900/50",
                                    iconColor: "text-red-400",
                                },
                                {
                                    title: translations["Total Deposit (Unconfirmed)"] || "Total Deposit (Unconfirmed)",
                                    value: summary?.totalUnconfirmed_deposit || 0,
                                    icon: Wallet,
                                    bg: "bg-cyan-900/50",
                                    iconColor: "text-cyan-400",
                                },
                                {
                                    title: translations["WebSales Total"] || "WebSales Total",
                                    value: summary?.webSales_total || 0,
                                    icon: Receipt,
                                    bg: "bg-blue-900/50",
                                    iconColor: "text-blue-400",
                                },
                                {
                                    title: translations["WebSales Deposit"] || "WebSales Deposit",
                                    value: summary?.webSales_deposit || 0,
                                    icon: ArrowDownCircle,
                                    bg: "bg-teal-900/50",
                                    iconColor: "text-teal-400",
                                },
                                {
                                    title: translations["Wholesale Total"] || "Wholesale Total",
                                    value: summary?.wholesale_total || 0,
                                    icon: ArrowUpCircle,
                                    bg: "bg-yellow-900/50",
                                    iconColor: "text-yellow-400",
                                },
                                {
                                    title: translations["Wholesale Deposit"] || "Wholesale Deposit",
                                    value: summary?.wholesale_deposit || 0,
                                    icon: PackageCheck,
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
                                        {/* Keep original icon intact */}
                                        <div className={`${card.bg} p-3 rounded-lg`}>
                                            <card.icon className={card.iconColor} size={24} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Top Customer */}
                    <div
                        className="md:col-span-4 p-4 rounded-xl shadow-sm flex flex-col"
                        style={{
                            backgroundColor: "#19191c",
                            borderColor: "#404040",
                            borderWidth: 1,
                            borderStyle: "solid",
                            height: 460,
                        }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white">{translations?.["Top Customer"] || "Top Customer"}</h2>
                            <div className="flex items-center gap-1 text-gray-400 text-xs px-1 py-1 border-gray-700">
                                <span>
                                    {months[selectedMonthYear.month]} {selectedMonthYear.year}
                                </span>
                            </div>
                        </div>
                        <div style={{ flexGrow: 1 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <defs>
                                        {pieDataCustomer.map((entry, index) => (
                                            <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                                                <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <Pie data={pieDataCustomer} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} innerRadius={70} paddingAngle={2} label={renderCustomLabel}>
                                        {pieDataCustomer.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={`url(#gradient-${index})`}
                                                stroke="#1f2937"
                                                strokeWidth={2}
                                                className={`hover:opacity-80 transition-opacity cursor-pointer ${entry.name}`}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <CustomLegend
                            payload={pieDataCustomer.map((d) => ({
                                value: d.name,
                                color: d.color,
                            }))}
                        />
                    </div>

                    {/* Performance By Sales Person */}
                    <div
                        className="md:col-span-4 p-4 rounded-xl shadow-sm flex flex-col"
                        style={{
                            backgroundColor: "#19191c",
                            borderColor: "#404040",
                            borderWidth: 1,
                            borderStyle: "solid",
                            height: 460,
                        }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white">{translations?.["Performance By Sales Person"] || "Performance By Sales Person"}</h2>
                            <div className="flex items-center gap-1 text-gray-400 text-xs px-1 py-1 border-gray-700">
                                <span>
                                    {months[selectedMonthYear.month]} {selectedMonthYear.year}
                                </span>
                            </div>
                        </div>
                        <div style={{ flexGrow: 1 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={pieDataSalesPerson} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                                    <defs>
                                        {pieDataSalesPerson.map((entry, index) => (
                                            <linearGradient key={`bar-gradient-${index}`} id={`bar-gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                                                <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
                                    <XAxis dataKey="name" tick={{ fill: "#ccc" }} />
                                    <YAxis tick={{ fill: "#ccc" }} tickFormatter={formatAmount} />
                                    <Tooltip
                                        cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                                        contentStyle={{
                                            backgroundColor: "#1f1f1f",
                                            border: "1px solid #333",
                                            borderRadius: "8px",
                                        }}
                                        labelStyle={{ color: "#ccc" }} // label text color (usually the category name)
                                        itemStyle={{ color: "#eee" }} // value text color (the hovered value)
                                        formatter={(value: number) => formatAmount(value)}
                                    />

                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40} label={{ position: "top", fill: "#fff", fontSize: 12 }}>
                                        {pieDataSalesPerson.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={`url(#bar-gradient-${index})`} className={`${entry.color}`} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <CustomLegend
                            payload={pieDataSalesPerson.map((d) => ({
                                value: d.name,
                                color: d.color,
                            }))}
                        />
                    </div>

                    {/* Top Products */}
                    <div
                        className="md:col-span-4 p-4 rounded-xl shadow-sm flex flex-col overflow-hidden"
                        style={{
                            backgroundColor: "#19191c",
                            borderColor: "#404040",
                            borderWidth: 1,
                            borderStyle: "solid",
                            height: 460,
                        }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white">{translations?.["Top Products"] || "Top Products"}</h2>
                            <div className="flex items-center gap-1 text-gray-400 text-xs px-1 py-1 border-gray-700">
                                <span>
                                    {months[selectedMonthYear.month]} {selectedMonthYear.year}
                                </span>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto space-y-6 pr-2">
                            {topProducts.map(({ rank, name, price, category, salesChange, image }, idx) => (
                                <div key={idx} className="flex items-center justify-between border-b border-gray-700 pb-2 last:border-b-0">
                                    <div className="w-8 text-gray-400 font-mono font-bold">{`#${rank}`}</div>
                                    <img
                                        src={image || `${import.meta.env.VITE_BASE_URL}/storage/products/no-image-min.jpg`}
                                        alt={name}
                                        className="w-12 h-12 rounded-full object-cover ml-2"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null; // prevent infinite loop if fallback image also fails
                                            target.src = `${import.meta.env.VITE_BASE_URL}/storage/products/no-image-min.jpg`;
                                        }}
                                    />

                                    <div className="flex-1 ml-3">
                                        <div className="font-semibold text-white leading-tight text-custom-sm">{name}</div>
                                        <div className="text-xs text-gray-400">
                                            {baseCurrency()} {formatMoney(price)} <span className="text-blue-400 cursor-pointer">{category}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end ml-4 min-w-[70px]">
                                        <div className="flex items-center text-xs font-medium">
                                            <span>{translations["Order Quantity"] || "Order Quantity"}</span>
                                            <TrendArrow change={salesChange} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SaleDashboard;

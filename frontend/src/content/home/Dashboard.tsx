import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { dashboardService } from "@/services/dashboardService";
import { formatDate } from "@/utils/globalFunction";
import PusherEcho from "@/utils/echo";
import { X } from "lucide-react";
const Dashboard: React.FC = () => {
    const { translations, lang } = useLanguage();
    const [showNewOrders, setShowPopup] = useState(false);
    const [titlePopup, setTitlePopup] = useState("");
    const [exchangeRates, setExchangeRates] = useState<any>(() => {
        const saved = localStorage.getItem("dashboard_exchangeRates");
        return saved ? JSON.parse(saved) : null;
    });
    const [newOrderList, setNewOrders] = useState<any>(() => {
        const saved = localStorage.getItem("dashboard_newOrderList");
        return saved ? JSON.parse(saved) : null;
    });
    const [shipmentList, setShipments] = useState<any>(() => {
        const saved = localStorage.getItem("dashboard_shipmentList");
        return saved ? JSON.parse(saved) : null;
    });
    const [preorderClosingList, setPreorderClosing] = useState<any>(() => {
        const saved = localStorage.getItem("dashboard_preorderClosingList");
        return saved ? JSON.parse(saved) : null;
    });
    const [orderPopup, setOrderPopup] = useState({
        id: 0,
        order_date: "",
        account_name_en: "",
        account_name_cn: "",
        customer_code: "",
        currency: "",
        customer_type: "",
        order_status: 0,
        price: 0,
        product_code: "",
        product_title_cn: "",
        product_title_en: "",
        qty: 0,
        source_cn: "",
        source_en: "",
        user_id: "",
    });
    const [closingPopup, setCloingPopup] = useState({
        id: 0,
        product_code: "",
        product_title_en: "",
        product_title_cn: "",
        preorder_start_date: "",
        preorder_end_date: "",
        po_dateline: "",
        pcs_per_carton: "",
        item_cost: 0,
        item_cost_currency: "",
        supplier_code: "",
        supplier_name: "",
        order_qty: "",
        version_no: "",
    });
    const [shipmentPopup, setShipmentPopup] = useState<any | null>(null);
    // Save to localStorage whenever data changes
    useEffect(() => {
        if (exchangeRates) {
            localStorage.setItem("dashboard_exchangeRates", JSON.stringify(exchangeRates));
        }
    }, [exchangeRates]);

    useEffect(() => {
        if (newOrderList) {
            localStorage.setItem("dashboard_newOrderList", JSON.stringify(newOrderList));
        }
    }, [newOrderList]);

    useEffect(() => {
        if (shipmentList) {
            localStorage.setItem("dashboard_shipmentList", JSON.stringify(shipmentList));
        }
    }, [shipmentList]);

    useEffect(() => {
        if (preorderClosingList) {
            localStorage.setItem("dashboard_preorderClosingList", JSON.stringify(preorderClosingList));
        }
    }, [preorderClosingList]);

    useEffect(() => {
        // Only fetch if localStorage is empty
        if (!exchangeRates) fetchExchangeRates();
        if (!shipmentList) fetchShipments();
        if (!preorderClosingList) fetchPreorderClosing();
        if (!newOrderList) fetchNewOrders();
    }, []);

    useEffect(() => {
        const channelProducts = PusherEcho.channel("products-channel");
        const channelPreorder = PusherEcho.channel("preorder-channel");
        const channelShipments = PusherEcho.channel("shipment-channel");
        channelPreorder.listen(".preorder-event", () => {
            fetchNewOrders();
        });
        channelShipments.listen(".shipment-event", () => {
            fetchShipments();
        });
        channelProducts.listen(".product-event", () => {
            fetchNewOrders();
            fetchShipments();
            fetchPreorderClosing();
            console.log("hey");
        });
        return () => {
            PusherEcho.leave("products-channel");
            PusherEcho.leave("preorder-channel");
            PusherEcho.leave("shipment-channel");
        };
    }, []);
    const fetchExchangeRates = async () => {
        const paginatedData = await dashboardService.getDashboardExRates();
        setExchangeRates(paginatedData);
    };
    const fetchShipments = async () => {
        const paginatedData = await dashboardService.getDashboardShipments();
        setShipments(paginatedData);
    };
    const fetchPreorderClosing = async () => {
        const paginatedData = await dashboardService.getDashboardPreorderClosing();
        setPreorderClosing(paginatedData);
    };
    const fetchNewOrders = async () => {
        const paginatedData = await dashboardService.getDashboardNewOrders();
        setNewOrders(paginatedData);
    };
    const getCurrencySymbol = (code: string) => {
        const symbolMap: { [key: string]: string } = {
            US$: "$",
            SG$: "S$",
            RMB: "¥",
            EUR: "€",
            JPY: "¥",
            GBP: "£",
        };
        return symbolMap[code] || code;
    };
    const getCurrentCurrencies = () => {
        if (!exchangeRates?.current || !exchangeRates?.currencies) return [];

        return exchangeRates.currencies.map((currencyCode: string) => ({
            code: currencyCode,
            symbol: getCurrencySymbol(currencyCode),
            rate: exchangeRates.current[currencyCode],
            trend: exchangeRates.current[`${currencyCode}_trend`],
        }));
    };
    const getHistoryArray = () => {
        if (!exchangeRates?.history) return [];

        return Object.values(exchangeRates.history).sort((a: any, b: any) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
    };
    const getTrendIcon = (trend: string) => {
        if (trend === "up") return "↗";
        if (trend === "down") return "↘";
        return "→";
    };
    const getTrendColor = (trend: string) => {
        if (trend === "up") return "text-emerald-400";
        if (trend === "down") return "text-red-400";
        return "text-gray-400";
    };
    const currencies = getCurrentCurrencies();
    const history = getHistoryArray();
    const handlePopup = (id: number, module: string) => {
        switch (module) {
            case "newOrder":
                setTitlePopup("New Orders");
                const dataOrder = newOrderList?.find((item: any) => item.id === id);
                setOrderPopup(dataOrder);
                break;
            case "shipments":
                const dataShipment = shipmentList?.find((item: any) => item.id === id);
                setShipmentPopup(dataShipment);
                setTitlePopup("Shipments");
                break;
            case "preorderClosing":
                const dataClosing = preorderClosingList?.find((item: any) => item.id === id);
                setCloingPopup(dataClosing);
                setTitlePopup("Preorder Closing");
                break;
        }
        setShowPopup(true);
    };
    const renderPopup = () => {
        if (!showNewOrders) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations[titlePopup]}</h2>
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
                    <div className="p-4">
                        {titlePopup === "New Orders" && orderPopup && (
                            <div className="flex flex-col md:flex-row gap-6 text-sm text-white">
                                {/* Column 1: Image */}
                                <div className="relative w-full md:w-[20%] aspect-square">
                                    <img
                                        src={
                                            orderPopup.product_code
                                                ? `${import.meta.env.VITE_BASE_URL}/storage/products/thumbnail/${orderPopup.product_code}_thumbnail.webp`
                                                : `${import.meta.env.VITE_BASE_URL}/storage/products/no-image-min.jpg`
                                        }
                                        alt="Thumbnail"
                                        className="w-full h-full object-cover rounded border border-[#ffffff1a]"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `${import.meta.env.VITE_BASE_URL}/storage/products/no-image-min.jpg`;
                                        }}
                                    />
                                </div>

                                {/* Columns 2–4: Info */}
                                <div className="w-full md:w-[80%] grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                                    {/* Column 2 */}
                                    <div className="space-y-5">
                                        <div>
                                            <span className="text-gray-400">{translations["Date"]}:</span>
                                            <br />
                                            <span className="text-[#00ffd5]">{formatDate(orderPopup.order_date, lang)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{translations["Order Status"]}:</span>
                                            <br />
                                            <span className="inline-block bg-yellow-500 text-black px-2 py-0.5 rounded text-xs">{orderPopup.order_status === 2 ? "Unconfirmed" : "Confirmed"}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{translations["Product Code"]}:</span>
                                            <br />
                                            <span className="text-[#00ffd5]">{orderPopup.product_code}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{translations["Product Name"]}:</span>
                                            <br />
                                            <span className="text-[#00ffd5]">{orderPopup.product_title_en}</span>
                                        </div>
                                    </div>

                                    {/* Column 3 */}
                                    <div className="space-y-5">
                                        <div>
                                            <span className="text-gray-400">{translations["Customer Code"]}:</span>
                                            <br />
                                            <span className="text-[#00ffd5]">{orderPopup.customer_code}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{translations["Ordered Qty"]}:</span>
                                            <br />
                                            <span className="text-[#00ffd5]">{orderPopup.qty}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{translations["Source"]}:</span>
                                            <br />
                                            <span className="text-[#00ffd5]">{orderPopup.source_en || translations["N.A."]}</span>
                                        </div>
                                    </div>

                                    {/* Column 4 */}
                                    <div className="space-y-5">
                                        <div>
                                            <span className="text-gray-400">{translations["Customer Name"]}:</span>
                                            <br />
                                            <span className="text-[#00ffd5]">{orderPopup.account_name_en || translations["N.A."]}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{translations["Price"]}:</span>
                                            <br />
                                            <span className="text-[#00ffd5]">
                                                {orderPopup.currency} {orderPopup.price}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{translations["User ID"]}:</span>
                                            <br />
                                            <span className="text-[#00ffd5]">{orderPopup.user_id || translations["N.A."]}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {titlePopup === "Preorder Closing" && (
                            <div className="flex flex-col md:flex-row gap-6 text-sm text-white">
                                {/* Column 1: Image */}
                                <div className="relative w-full md:w-[30%] aspect-square">
                                    <img
                                        src={
                                            closingPopup.product_code
                                                ? `${import.meta.env.VITE_BASE_URL}/storage/products/thumbnail/${closingPopup.product_code}_thumbnail.webp`
                                                : `${import.meta.env.VITE_BASE_URL}/storage/products/no-image-min.jpg`
                                        }
                                        alt="Thumbnail"
                                        className="w-full h-full object-cover rounded border border-[#ffffff1a]"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `${import.meta.env.VITE_BASE_URL}/storage/products/no-image-min.jpg`;
                                        }}
                                    />
                                </div>

                                {/* Columns 2–4: Info */}
                                <div className="w-full md:w-[70%] grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                    {/* Column 2 */}
                                    <div className="space-y-5">
                                        <div>
                                            <span className="text-gray-400">{translations["Product Code"]}:</span>
                                            <br />
                                            <span className="text-[#00ffd5]">{closingPopup.product_code}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{translations["Product Name"]}:</span>
                                            <br />
                                            <span className="text-[#00ffd5]">{lang === "en" ? closingPopup.product_title_en : closingPopup.product_title_cn}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{translations["Preorder Start Date"]}:</span>
                                            <br />
                                            <span className="text-[#00ffd5]">{formatDate(closingPopup.preorder_start_date, lang)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{translations["Preorder End Date"]}:</span>
                                            <br />
                                            <span className="text-[#00ffd5]">{formatDate(closingPopup.preorder_end_date, lang)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{translations["PO Submission Dateline"]}:</span>
                                            <br />
                                            <span className="text-[#00ffd5]">{formatDate(closingPopup.po_dateline, lang)}</span>
                                        </div>
                                    </div>
                                    {/* Column 3 */}
                                    <div className="space-y-5">
                                        <div>
                                            <span className="text-gray-400">{translations["Supplier Code"]}:</span>
                                            <br />
                                            <span className="text-[#00ffd5]">{closingPopup.supplier_code}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{translations["Supplier Name"]}:</span>
                                            <br />
                                            <span className="text-[#00ffd5]">{closingPopup.supplier_name}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{translations["Pcs Per Carton"]}:</span>
                                            <br />
                                            <span className="text-[#00ffd5]">{closingPopup.pcs_per_carton}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{translations["On Order"]}:</span>
                                            <br />
                                            <span className="text-[#00ffd5]">{closingPopup.order_qty}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">{translations["Item Cost"]}:</span>
                                            <br />
                                            <span className="text-[#00ffd5]">
                                                {closingPopup.item_cost_currency} {closingPopup.item_cost}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {titlePopup === "Shipments" && shipmentPopup && (
                            <div className="p-2">
                                <fieldset className="border border-[#ffffff1a] rounded-lg p-4 mb-2">
                                    <legend className="text-white text-left px-3 py-1 border border-[#ffffff1a] rounded-md bg-[#19191c]">{translations["Information"]}:</legend>
                                    <table className="w-full text-sm">
                                        <thead style={{ backgroundColor: "#1f2132" }}>
                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                <th className="text-left text-gray-400 font-medium py-2 px-2">{translations["Date"]}</th>
                                                <th className="text-left text-gray-400 font-medium py-2 px-2">{translations["Customer Code"]}</th>
                                                <th className="text-left text-gray-400 font-medium py-2 px-2">{translations["Customer Name"]}</th>
                                                <th className="text-left text-gray-400 font-medium py-2 px-2">{translations["Courier"]}</th>
                                                <th className="text-left text-gray-400 font-medium py-2 px-2">{translations["Tracking No"]}</th>
                                                <th className="text-left text-gray-400 font-medium py-2 px-2">{translations["Invoice No."]}</th>
                                                <th className="text-center text-gray-400 font-medium py-2 px-2">{translations["Total Packages"]}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{formatDate(shipmentPopup.shipout_date, lang)}</td>
                                                <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{shipmentPopup.customer_code}</td>
                                                <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{shipmentPopup.account_name_en}</td>
                                                <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{shipmentPopup.courier_en}</td>
                                                <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{shipmentPopup.tracking}</td>
                                                <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{shipmentPopup.invoice_no}</td>
                                                <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{shipmentPopup.shipped_packages}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </fieldset>
                                {/* Shipped Items Table */}
                                <fieldset className="border border-[#ffffff1a] rounded-lg p-4 mb-2 mt-5">
                                    <legend className="text-white text-left px-3 py-1 border border-[#ffffff1a] rounded-md bg-[#19191c]">{translations["Shipped Items"] || "Shipped Items"} :</legend>
                                    <table className="w-full text-sm">
                                        <thead style={{ backgroundColor: "#1f2132" }}>
                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                <th className="text-left text-gray-400 font-medium py-2 px-2">{translations["Product Code"]}</th>
                                                <th className="text-left text-gray-400 font-medium py-2 px-2">{translations["Product Name"]}</th>
                                                <th className="text-center text-gray-400 font-medium py-2 px-2 w-16">{translations["Qty"]}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {shipmentPopup.details.map((item: any) => (
                                                <tr key={item.id} className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{item.product_code}</td>
                                                    <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? item.product_title_en : item.product_title_cn}</td>
                                                    <td className="py-3 px-4 text-gray-400 text-center text-custom-sm">{item.qty}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </fieldset>
                            </div>
                        )}
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button onClick={() => setShowPopup(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    return (
        <div className="dashboard-scrollable-container max-h-[calc(100vh-70px)] overflow-y-auto">
            <div className="space-y-6">
                {/* Top Metrics Row */}
                {/* Second Row - Charts and Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {/* Exchange Rates Overview */}
                    <div className="p-6 rounded-xl border shadow-sm" style={{ backgroundColor: "#19191c", borderColor: "#404040" }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white">{translations["Exchange Rate"]}</h3>
                            {exchangeRates?.current?.date && <span className="text-sm text-gray-400">{formatDate(exchangeRates.current.date, lang)}</span>}
                        </div>
                        {/* Current Rates */}
                        <div className="mb-6">
                            <div className="flex items-end justify-between space-x-4 mb-6">
                                {currencies.map((currency: any, index: any) => (
                                    <div
                                        key={index}
                                        className="p-4 rounded-lg border flex-1"
                                        style={{
                                            backgroundColor: "#19191c",
                                            borderColor: "#404040",
                                        }}
                                    >
                                        <div className="text-gray-400 text-xs mb-1">{currency.code}</div>
                                        <div className="flex items-baseline space-x-1 mb-2">
                                            <span className="text-white text-2xl font-bold">
                                                {currency.symbol}
                                                {currency.rate}
                                            </span>
                                        </div>
                                        <div className={`flex items-center text-xs ${getTrendColor(currency.trend)}`}>
                                            <span className="mr-1">{getTrendIcon(currency.trend)}</span>
                                            <span className="capitalize">{translations[currency.trend] || currency.trend}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* History Table */}
                        {history.length > 0 && (
                            <div className="mt-6">
                                <h4 className="text-sm font-semibold text-white mb-3">{translations["Historical Rates"] || "Historical Rates"}</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead style={{ backgroundColor: "#1f2132" }}>
                                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                <th className="text-left text-gray-400 font-medium py-2 px-2">{translations["Date"]}</th>
                                                {exchangeRates?.currencies?.map((currency: string) => (
                                                    <th key={currency} className="text-right text-gray-400 font-medium py-2 px-2">
                                                        {currency}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.map((row: any, index: number) => (
                                                <tr key={index} className="border-b" style={{ borderColor: "#2d2d30" }}>
                                                    <td className="text-gray-400 py-2 px-2 text-custom-sm">{formatDate(row.date, lang)}</td>
                                                    {exchangeRates?.currencies?.map((currency: string) => (
                                                        <td key={currency} className="py-3 px-4 text-gray-400 text-center text-custom-sm">
                                                            <div className="flex items-center justify-end space-x-1">
                                                                <span className="text-gray-400">{row[currency]}</span>
                                                                <span className={`text-xs ${getTrendColor(row[`${currency}_trend`])}`}>{getTrendIcon(row[`${currency}_trend`])}</span>
                                                            </div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Order Statistics */}
                    <div className="p-6 rounded-xl border shadow-sm" style={{ backgroundColor: "#19191c", borderColor: "#404040" }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white">{translations["New Orders"]}</h3>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                    <span className="text-gray-300">{translations["Unconfirmed"]}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="text-gray-300">{translations["Confirmed"]}</span>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <div className="max-h-[calc(100vh-500px)] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead style={{ backgroundColor: "#1f2132" }}>
                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                            <th className="text-left text-gray-400 font-medium py-2 px-2">{translations["Date"]}</th>
                                            <th className="text-left text-gray-400 font-medium py-2 px-2">{translations["Customer"]}</th>
                                            <th className="text-left text-gray-400 font-medium py-2 px-2">{translations["Source"]}</th>
                                            <th className="text-left text-gray-400 font-medium py-2 px-2">{translations["Products"]}</th>
                                            <th className="text-left text-gray-400 font-medium py-2 px-2">{translations["Qty"]}</th>
                                            <th className="text-left text-gray-400 font-medium py-2 px-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {newOrderList?.map((row: any, index: number) => (
                                            <tr
                                                onClick={() => {
                                                    handlePopup(row.id, "newOrder");
                                                }}
                                                key={index}
                                                className="border-b cursor-pointer hover:bg-gray-700 hover:bg-opacity-30 transition-colors"
                                                style={{ borderColor: "#2d2d30" }}
                                            >
                                                <td className="text-gray-400 py-2 px-2 text-custom-sm">{formatDate(row.order_date, lang)}</td>
                                                <td className="text-gray-400 py-2 px-2 text-custom-sm">
                                                    <div className="flex items-center space-x-3">
                                                        <div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">{row.customer_code}</p>
                                                            </div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">{lang === "en" ? row.account_name_en : row.account_name_cn}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-gray-400 py-2 px-2 text-custom-sm">
                                                    {row.customer_type === "RC" ? (
                                                        <>
                                                            {lang === "en" ? row.source_en : row.source_cn}
                                                            <br />
                                                            {row.user_id}
                                                        </>
                                                    ) : (
                                                        translations["Wholesale"]
                                                    )}
                                                </td>
                                                <td className="text-gray-400 py-2 px-2 text-custom-sm">
                                                    <div className="flex items-center space-x-3">
                                                        <div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">{row.product_code}</p>
                                                            </div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">{lang === "en" ? row.product_title_en : row.product_title_cn}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-gray-400 py-2 px-2 text-custom-sm">{row.qty}</td>
                                                <td className="text-gray-400 py-2 px-2 text-custom-sm">
                                                    <div className={`w-2 h-2 rounded-full ${row.order_status === 1 ? "bg-green-500" : "bg-orange-500"}`}></div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    {/* Order Statistics */}
                    <div className="p-6 rounded-xl border shadow-sm" style={{ backgroundColor: "#19191c", borderColor: "#404040" }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white">
                                {translations["Shipments"]} - {translations["Shipped"]}
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <div className="max-h-[calc(100vh-500px)] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead style={{ backgroundColor: "#1f2132" }}>
                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                            <th className="text-left text-gray-400 font-medium py-2 px-2">{translations["Date"]}</th>
                                            <th className="text-left text-gray-400 font-medium py-2 px-2">{translations["Customer"]}</th>
                                            <th className="text-left text-gray-400 font-medium py-2 px-2">{translations["Courier ID"]}</th>
                                            <th className="text-left text-gray-400 font-medium py-2 px-2">{translations["Tracking No."]}</th>
                                            <th className="text-left text-gray-400 font-medium py-2 px-2">{translations["Invoice No."]}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shipmentList?.map((row: any, index: number) => (
                                            <tr
                                                onClick={() => {
                                                    handlePopup(row.id, "shipments");
                                                }}
                                                key={index}
                                                className="border-b cursor-pointer hover:bg-gray-700 hover:bg-opacity-30 transition-colors"
                                                style={{ borderColor: "#2d2d30" }}
                                            >
                                                <td className="text-gray-400 py-2 px-2 text-custom-sm">{formatDate(row.shipout_date, lang)}</td>
                                                <td className="text-gray-400 py-2 px-2 text-custom-sm">
                                                    <div className="flex items-center space-x-3">
                                                        <div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">{row.customer_code}</p>
                                                            </div>
                                                            <div className="group flex items-center">
                                                                <p className="text-gray-400 text-custom-sm">{lang === "en" ? row.account_name_en : row.account_name_cn}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-gray-400 py-2 px-2 text-custom-sm">{lang === "en" ? row.courier_en : row.courier_cn}</td>
                                                <td className="text-gray-400 py-2 px-2 text-custom-sm">{row.tracking}</td>
                                                <td className="text-gray-400 py-2 px-2 text-custom-sm">{row.invoice_no}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 rounded-xl border shadow-sm" style={{ backgroundColor: "#19191c", borderColor: "#404040" }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white">{translations["Preorder Closing"]}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <div className="max-h-[calc(100vh-500px)] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead style={{ backgroundColor: "#1f2132" }}>
                                        <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                            <th className="w-[10%] text-left text-gray-400 font-medium py-2 px-2"></th>
                                            <th className="w-[20%] text-left text-gray-400 font-medium py-2 px-2">{translations["Product Code"]}</th>
                                            <th className="w-[50%] text-left text-gray-400 font-medium py-2 px-2">{translations["Product Name"]}</th>
                                            <th className="w-[20%] text-left text-gray-400 font-medium py-2 px-2">{translations["Closing Date"]}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preorderClosingList?.map((row: any, index: number) => (
                                            <tr
                                                onClick={() => {
                                                    handlePopup(row.id, "preorderClosing");
                                                }}
                                                key={index}
                                                className="border-b cursor-pointer hover:bg-gray-700 hover:bg-opacity-30 transition-colors"
                                                style={{ borderColor: "#2d2d30" }}
                                            >
                                                <td className="text-gray-400 py-2 px-2 text-custom-sm">
                                                    <div className="flex items-center space-x-3">
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                            }}
                                                            className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center"
                                                        >
                                                            <img
                                                                src={
                                                                    row.product_code
                                                                        ? `${import.meta.env.VITE_BASE_URL}/storage/products/thumbnail/${row.product_code}_thumbnail.webp`
                                                                        : `${import.meta.env.VITE_BASE_URL}/storage/products/no-image-min.jpg`
                                                                }
                                                                alt="Thumbnail"
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    // Fallback if the image fails to load
                                                                    (e.target as HTMLImageElement).src = `${import.meta.env.VITE_BASE_URL}/storage/products/no-image-min.jpg`;
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="text-gray-400 py-2 px-2 text-custom-sm">{row.product_code}</td>
                                                <td className="text-gray-400 py-2 px-2 text-custom-sm">{lang === "en" ? row.product_title_en : row.product_title_cn}</td>
                                                <td className="text-gray-400 py-2 px-2 text-custom-sm">{formatDate(row.preorder_end_date, lang)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                {renderPopup()}
            </div>
        </div>
    );
};

export default Dashboard;

import React, { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { productService } from "@/services/productService";
import { DropdownData, OptionType, selectStyles } from "@/utils/globalFunction";
import { convertToSingleOptionString, fetchWarehouses } from "@/utils/fetchDropdownData";
import Select from "react-select";
interface UnpaidItemReceivedProps {
    tabId: string;
}
// localStorage.clear();
const UnpaidItemReceived: React.FC<UnpaidItemReceivedProps> = ({ tabId }) => {
    const { translations, lang } = useLanguage();
    const [masterDisplay, setMasterDisplay] = useState<any[]>([]);
    const [unshippedQty, setTotalUnshippedQty] = useState(0);
    const [remQty, setRemQty] = useState(0);
    const [formData, setFormData] = useState({
        rwarehouse: null as OptionType | null,
        search: "",
    });
    const [warehousesData, setWarehousesData] = useState<DropdownData[]>([]);
    const warehouseOptions: OptionType[] = useMemo(
        () =>
            warehousesData.map((warehouse) => ({
                value: warehouse.value.toString(),
                value2: warehouse.value.toString(),
                label: lang === "en" ? warehouse.en : warehouse.cn,
                en: warehouse.en,
                cn: warehouse.cn,
            })),
        [warehousesData, lang]
    );

    useEffect(() => {
        handleSearch();
        loadWarehouse();
    }, [tabId]);

    useEffect(() => {
        if (warehouseOptions.length > 0) {
            const selectedwarehouseOptions = convertToSingleOptionString("CNDG-WH", warehouseOptions);
            setFormData((prev) => ({ ...prev, rwarehouse: selectedwarehouseOptions }));
        }
    }, [warehouseOptions, lang]);

    const handleSearch = async () => {
        const search = formData.search;
        const warehouse = String(formData.rwarehouse?.value);
        const data = await productService.getInventoryTracking(search, warehouse, lang);
        setMasterDisplay(data.list);
        setRemQty(data.remQty);
        setTotalUnshippedQty(data.unshippedQty);
    };
    const loadWarehouse = async () => {
        try {
            const list = await fetchWarehouses(); // fetches & returns
            setWarehousesData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadWarehouse:", err);
        }
    };

    return (
        <div className="space-y-6">
            {/* Main Content Card */}
            <div className="rounded-lg border shadow-sm" style={{ backgroundColor: "#19191c", borderColor: "#404040" }}>
                {/* Toolbar */}
                <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <input
                                    type="search"
                                    placeholder={translations["Search"]}
                                    value={formData.search}
                                    onChange={(e) => {
                                        setFormData({ ...formData, search: e.target.value });
                                    }}
                                    className="pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                    style={{ backgroundColor: "#2d2d30", borderColor: "#555555" }}
                                />
                            </div>
                            <div className="relative">
                                <Select
                                    classNamePrefix="react-select"
                                    value={formData.rwarehouse}
                                    onChange={(selected) => {
                                        setFormData({ ...formData, rwarehouse: selected as OptionType | null });
                                    }}
                                    options={warehouseOptions}
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
                            </div>
                            <button onClick={handleSearch} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                                <span>{translations["Track"]}</span>
                            </button>
                        </div>
                    </div>
                </div>
                {/* Table */}
                <div className="flex-grow">
                    <div className="h-[calc(100vh-155px)] overflow-y-auto">
                        <div className="grid grid-cols-1 px-2 mt-2">
                            <div>
                                <table className="table-auto w-full border border-gray-600 border-collapse">
                                    <tbody>
                                        {masterDisplay &&
                                            masterDisplay.length > 0 &&
                                            masterDisplay.map((item: any, index: number) => {
                                                return (
                                                    <tr
                                                        key={index}
                                                        className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors"
                                                        style={{ backgroundColor: item.Field6 }}
                                                    >
                                                        <td className="py-2 px-4 text-gray-400 text-left border border-gray-600 text-custom-sm">{item.Field1}</td>
                                                        <td className="py-2 px-4 text-gray-200 text-left border border-gray-600 text-custom-sm">
                                                            <div dangerouslySetInnerHTML={{ __html: item.Field2 }} />
                                                        </td>
                                                        <td className="py-2 px-4 text-gray-200 text-left border border-gray-600 text-custom-sm">{item.Field3}</td>
                                                        <td className="py-2 px-4 text-gray-200 text-left border border-gray-600 text-custom-sm">{item.Field4}</td>
                                                        <td className="py-2 px-4 text-gray-200 text-left border border-gray-600 text-custom-sm">{item.Field5}</td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                    <tbody>
                                        <tr className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                            <td className="py-2 px-4 text-gray-400 text-left border border-gray-600 text-custom-sm"></td>
                                            <td className="py-2 px-4 text-gray-200 text-left border border-gray-600 text-custom-sm"></td>
                                            <td className="py-2 px-4 text-gray-200 text-left border border-gray-600 text-custom-sm"></td>
                                            <td className="py-2 px-4 text-gray-200 text-left border border-gray-600 text-custom-sm">{translations["Total Unshipped Qty"]}</td>
                                            <td className="py-2 px-4 text-gray-200 text-left border border-gray-600 text-custom-sm">{unshippedQty}</td>
                                        </tr>
                                        <tr className="border-b border-gray-600 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                                            <td className="py-2 px-4 text-gray-400 text-left border border-gray-600 text-custom-sm"></td>
                                            <td className="py-2 px-4 text-gray-200 text-left border border-gray-600 text-custom-sm"></td>
                                            <td className="py-2 px-4 text-gray-200 text-left border border-gray-600 text-custom-sm"></td>
                                            <td className="py-2 px-4 text-gray-200 text-left border border-gray-600 text-custom-sm">{translations["Remaining Qty"]}</td>
                                            <td className="py-2 px-4 text-gray-200 text-left border border-gray-600 text-custom-sm">{remQty}</td>
                                        </tr>
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

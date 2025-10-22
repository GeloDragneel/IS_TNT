import React, { useState, useEffect, useMemo } from "react";
import { settingService, ApiSettings } from "@/services/settingService";
import { useLanguage } from "@/context/LanguageContext";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showConfirm } from "@/utils/alert";
import { OptionType, convertToSingleOption, convertToSingleOptionString } from "@/utils/fetchDropdownData";
import { X } from "lucide-react";
import Select from "react-select";
import { DropdownData, selectStyles } from "@/utils/globalFunction";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
// Handle the Smooth skeleton loading
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);

interface LogListsProps {
    tabId: string;
}
type MenuItem = ApiSettings;

const MenuTree = ({
    data,
    checkedItems,
    setCheckedItems,
    translations,
}: {
    data: MenuItem[];
    checkedItems: Set<number>;
    setCheckedItems: React.Dispatch<React.SetStateAction<Set<number>>>;
    translations: any;
}) => {
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

    const getAllDescendantIds = (item: MenuItem): number[] => {
        let ids: number[] = [];
        if (item.details && item.details.length > 0) {
            item.details.forEach((child) => {
                ids.push(child.id);
                ids = [...ids, ...getAllDescendantIds(child)];
            });
        }
        return ids;
    };

    const getAllAncestorIds = (targetId: number, items: MenuItem[], ancestors: number[] = []): number[] => {
        for (const item of items) {
            if (item.id === targetId) {
                return ancestors;
            }
            if (item.details && item.details.length > 0) {
                const found = getAllAncestorIds(targetId, item.details, [...ancestors, item.id]);
                if (found.length > ancestors.length || found.length > 0) {
                    return found;
                }
            }
        }
        return [];
    };

    const hasAnyChildChecked = (item: MenuItem): boolean => {
        if (!item.details || item.details.length === 0) return false;
        return item.details.some((child) => checkedItems.has(child.id) || hasAnyChildChecked(child));
    };

    const findItemById = (items: MenuItem[], id: number): MenuItem | null => {
        for (const item of items) {
            if (item.id === id) return item;
            if (item.details && item.details.length > 0) {
                const found = findItemById(item.details, id);
                if (found) return found;
            }
        }
        return null;
    };

    const handleCheckboxClick = (id: number, item: MenuItem) => {
        const updated = new Set(checkedItems);

        const isUnchecking = updated.has(id);

        if (isUnchecking) {
            // Uncheck item and all descendants
            updated.delete(id);
            const descendants = getAllDescendantIds(item);
            descendants.forEach((descId) => updated.delete(descId));

            // Uncheck parents if no children are checked anymore
            const ancestors = getAllAncestorIds(id, data);
            ancestors.forEach((ancestorId) => {
                const ancestorItem = findItemById(data, ancestorId);
                if (ancestorItem && !hasAnyChildChecked(ancestorItem)) {
                    updated.delete(ancestorId);
                }
            });
        } else {
            // Check item and all descendants
            updated.add(id);
            const descendants = getAllDescendantIds(item);
            descendants.forEach((descId) => updated.add(descId));

            // Check all ancestors (because at least one child is now checked)
            const ancestors = getAllAncestorIds(id, data);
            ancestors.forEach((ancestorId) => updated.add(ancestorId));
        }

        setCheckedItems(updated);
    };

    const handleExpandClick = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        const updated = new Set(expandedItems);
        if (updated.has(id)) {
            updated.delete(id);
        } else {
            updated.add(id);
        }
        setExpandedItems(updated);
    };

    const renderTree = (items: MenuItem[], level = 0) => {
        return items.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            const hasChildren = item.details && item.details.length > 0;
            const isChecked = checkedItems.has(item.id);
            const isIndeterminate = !isChecked && hasChildren && item.details.some((child) => checkedItems.has(child.id));

            return (
                <div key={item.id} className="select-none">
                    <div
                        className={`flex items-center gap-3 py-2.5 px-3 rounded-md hover:bg-white/5 transition-all group ${level === 0 ? "bg-white/[0.02]" : ""}`}
                        style={{ marginLeft: `${level * 1.25}rem` }}
                    >
                        {hasChildren ? (
                            <button
                                type="button"
                                onClick={(e) => handleExpandClick(e, item.id)}
                                className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-500 hover:text-white transition-all duration-200 rounded hover:bg-white/10"
                                style={{
                                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                                }}
                            >
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                                    <path d="M3 1.5L6.5 5L3 8.5V1.5z" />
                                </svg>
                            </button>
                        ) : (
                            <div className="w-5 flex-shrink-0" />
                        )}
                        <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isChecked}
                                ref={(input) => {
                                    if (input) {
                                        input.indeterminate = isIndeterminate;
                                    }
                                }}
                                onChange={() => handleCheckboxClick(item.id, item)}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer transition-all flex-shrink-0"
                            />
                            <span className="text-gray-200 text-sm font-medium truncate group-hover:text-white transition-colors flex-1">{translations[item.label_en] || item.label_en}</span>
                            {item.children_count > 0 && <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 flex-shrink-0">{item.children_count}</span>}
                        </label>
                    </div>

                    {hasChildren && isExpanded && (
                        <div className="relative mt-0.5" style={{ marginLeft: `${level * 1.25 + 0.75}rem` }}>
                            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-gray-700 via-gray-700/50 to-transparent" />
                            <div className="pl-3">{renderTree(item.details, level + 1)}</div>
                        </div>
                    )}
                </div>
            );
        });
    };

    return <div className="space-y-0.5">{renderTree(data)}</div>;
};
const LogLists: React.FC<LogListsProps> = ({ tabId }) => {
    const { translations, lang } = useLanguage();
    const [accessRightsList, setAccessRights] = useState<ApiSettings[]>([]);
    const [menuDataList, setMenuData] = useState<ApiSettings[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [selectedMaster, setSelectedMaster] = useState<number[]>([]);
    const [checkMenuIds, setCheckMenuIds] = useState<number[]>([]);
    const [showPopup, setShowPopup] = useState(false);
    const [employeeData, setEmployeeData] = useState<DropdownData[]>([]);
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-accessRights`;
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
        const metaKey = `${tabId}-cached-meta-accessRights`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-accessRights`);
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
        username: "",
        password: "",
        mobile_password: "",
        employee_no: "",
        user_language: null as OptionType | null,
        employee_id: null as OptionType | null,
    });
    useEffect(() => {
        const handleEsc = (event: any) => {
            if (event.key === "Escape") {
                if (showPopup) {
                    setShowPopup(false);
                }
            }
        };
        window.addEventListener("keydown", handleEsc);
        // Cleanup on unmount
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [showPopup]);

    useEffect(() => {
        loadEmployeeList();
        loadMenuData();
    }, [tabId]);

    useEffect(() => {
        setCheckedItems(new Set(checkMenuIds));
    }, [checkMenuIds]);

    useEffect(() => {
        fetchAccessRights(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    const fetchAccessRights = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-accessRights`, JSON.stringify(true));
            const paginatedData = await settingService.getAccessRights(page, perPage, search);
            setAccessRights(paginatedData.data);
            setTotalPages(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching accessRights:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-accessRights`, JSON.stringify(false));
        }
    };
    const loadEmployeeList = async () => {
        try {
            const list = await settingService.getAllEmployeeList();
            setEmployeeData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch loadEmployeeList:", err);
        }
    };
    const loadMenuData = async () => {
        try {
            const list = await settingService.getAllMenuData();
            setMenuData(list);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        }
    };
    const employeeOptions: OptionType[] = useMemo(
        () =>
            employeeData.map((list) => ({
                value: list.value.toString(),
                value2: list.value2.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [employeeData, lang]
    );
    const languageOptions: OptionType[] = [
        { value: "en", label: "English", en: "English", cn: "英文", value2: "" },
        { value: "cn", label: "Chinese", en: "Chinese", cn: "中文", value2: "" },
        { value: "encn", label: "English / Chinese", en: "English / Chinese", cn: "英文 / 中文", value2: "" },
    ];
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = accessRightsList?.map((p: any) => p.id);
            setSelectedMaster(allIds);
        } else {
            setSelectedMaster([]);
        }
    };
    const handleSelectSingle = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedMaster((prev) => [...prev, id]);
        } else {
            setSelectedMaster((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleSave = async () => {
        const checkedArray = Array.from(checkedItems);
        const data = new FormData();
        // Append form data
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
        // Append checked IDs as array
        checkedArray.forEach((id) => data.append("ids[]", id.toString()));
        try {
            const result = await settingService.updateAccessRights(data);
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            if (result.token === "Warning") {
                showErrorToast(translations[result.message]);
                return;
            }
            fetchAccessRights();
            setShowPopup(false);
            showSuccessToast(translations[result.message]);
        } catch (error) {
            showErrorToast(translations["Failed to save Transaction."] || "Failed to save Transaction.");
        }
    };
    const handleDelete = async (module: string) => {
        let ids: any = [];
        if (selectedMaster.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        ids = selectedMaster;
        const confirmed = await showConfirm(translations["Delete Record"], translations["Are you sure you want to delete this record?"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const res = await settingService.deleteSettings(ids, module);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            fetchAccessRights();
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
        }
    };
    const renderPopup = () => {
        if (!showPopup) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[60vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Access Rights"]}</h2>
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
                    <div className="grid grid-cols-12">
                        <div className="col-span-12 md:col-span-6 p-4">
                            <fieldset className="border border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-12 md:col-span-12">
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Employee"]}</label>
                                            <div className="flex flex-1">
                                                <Select
                                                    classNamePrefix="react-select"
                                                    value={formData.employee_id}
                                                    onChange={(selected) => {
                                                        setFormData({
                                                            ...formData,
                                                            employee_id: selected as OptionType | null,
                                                            employee_no: String(selected?.value2),
                                                        });
                                                    }}
                                                    options={employeeOptions}
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
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Employee No."]}</label>
                                            <div className="flex flex-1">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={formData.employee_no}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormData((prev) => ({ ...prev, employee_no: value }));
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Language"]}</label>
                                            <div className="flex flex-1">
                                                <Select
                                                    value={formData.user_language}
                                                    onChange={(selected) => {
                                                        setFormData({ ...formData, user_language: selected as OptionType | null });
                                                    }}
                                                    classNamePrefix="react-select"
                                                    options={languageOptions}
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
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="w-[25%] text-gray-400 text-sm text-right">{translations["User Name"]}</label>
                                            <div className="flex flex-1">
                                                <input
                                                    type="text"
                                                    value={formData.username}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormData((prev) => ({ ...prev, username: value }));
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </fieldset>
                            <fieldset className="border border-[#ffffff1a] rounded-lg p-4 mb-2">
                                <div className="flex items-center gap-4 mb-2">
                                    <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Password"]}</label>
                                    <div className="flex flex-1">
                                        <input
                                            type="text"
                                            value={formData.password}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData((prev) => ({ ...prev, password: value }));
                                            }}
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mb-2">
                                    <label className="w-[25%] text-gray-400 text-sm text-right">{translations["Mobile Password"]}</label>
                                    <div className="flex flex-1">
                                        <input
                                            type="text"
                                            value={formData.mobile_password}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // Only allow digits and limit to 6 characters
                                                if (/^\d*$/.test(value) && value.length <= 6) {
                                                    setFormData((prev) => ({ ...prev, mobile_password: value }));
                                                }
                                            }}
                                            maxLength={6}
                                            placeholder="000000"
                                            className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                        />
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                        <div className="col-span-12 md:col-span-6 p-4">
                            <div className="max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                                <fieldset className="border-[1px] border-[#ffffff1a] rounded-lg p-4 mb-2">
                                    <div className="grid grid-cols-12 gap-4">
                                        <div className="col-span-12 md:col-span-12">
                                            <MenuTree data={menuDataList as MenuItem[]} checkedItems={checkedItems} setCheckedItems={setCheckedItems} translations={translations} />
                                        </div>
                                    </div>
                                </fieldset>
                            </div>
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
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        id: 0,
                                        employee_id: null,
                                        user_language: null,
                                        employee_no: "",
                                        username: "",
                                        password: "",
                                        mobile_password: "",
                                    }));
                                    setCheckMenuIds([]);
                                    setShowPopup(true);
                                }}
                                className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                            >
                                <span>{translations["Add New"]}</span>
                            </button>
                            <button onClick={() => handleDelete("login")} className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                                <span>{translations["Delete"]}</span>
                            </button>
                        </div>
                    </div>
                </div>
                {/* Table */}
                <div className="overflow-x-auto flex-grow">
                    <div className="h-[calc(100vh-180px)] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    <th className="text-left py-2 px-4 text-gray-400 text-sm w-[5%]">
                                        <div className="flex items-center justify-center h-full">
                                            <CustomCheckbox
                                                checked={selectedMaster.length === accessRightsList?.length && accessRightsList?.length > 0}
                                                onChange={(checked) => handleSelectAll(checked)}
                                            />
                                        </div>
                                    </th>
                                    <th className="text-left py-2 px-4 text-gray-400 text-sm w-[20%]">{translations["Employee"]}</th>
                                    <th className="text-left py-2 px-4 text-gray-400 text-sm w-[20%]">{translations["Login ID"]}</th>
                                    <th className="text-left py-2 px-4 text-gray-400 text-sm w-[20%]">{translations["Language"]}</th>
                                    <th className="text-left py-2 px-4 text-gray-400 text-sm w-[15%]">{translations["Date Created"]}</th>
                                    <th className="text-left py-2 px-4 text-gray-400 text-sm w-[20%]">{translations["Date Updated"]}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accessRightsList.map((list, index) => (
                                    <tr
                                        key={list.id || index}
                                        onClick={() => {
                                            const data = accessRightsList.find((item) => item.id === list.id);
                                            const employee_id = Number(data?.employee_id);
                                            const user_language = String(data?.user_language);
                                            const selectedEmployee = convertToSingleOption(employee_id, employeeOptions);
                                            const selectedLanguage = convertToSingleOptionString(user_language, languageOptions);
                                            // Suppose `data` is your object containing accessRights
                                            const menuIds = data?.accessRights?.map((access: any) => access.menu_id) || [];
                                            setFormData((prev) => ({
                                                ...prev,
                                                id: Number(data?.id),
                                                employee_id: selectedEmployee,
                                                user_language: selectedLanguage,
                                                employee_no: String(data?.employee_no),
                                                username: String(data?.username),
                                                password: "",
                                                mobile_password: "",
                                            }));
                                            setCheckMenuIds(menuIds);
                                            setShowPopup(true);
                                        }}
                                        className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                        style={{ borderColor: "#40404042" }}
                                    >
                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center h-full">
                                                <CustomCheckbox checked={selectedMaster.includes(list.id as number)} onChange={(checked) => handleSelectSingle(list.id as number, checked)} />
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.fullname}</td>
                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.username}</td>
                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.user_language}</td>
                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.created_at}</td>
                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.updated_at}</td>
                                    </tr>
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
export default LogLists;

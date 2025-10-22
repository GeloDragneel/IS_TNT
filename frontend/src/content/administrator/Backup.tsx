import React, { useState, useEffect, useMemo } from "react";
import { globalService, ApiLogs } from "@/services/globalService";
import { useLanguage } from "@/context/LanguageContext";
import Pagination from "@/components/Pagination";
import { showAlert, showConfirm } from "@/utils/alert";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import { X, Download, Database } from "lucide-react";
import CustomCheckbox from "@/components/CustomCheckbox";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
// Handle the Smooth skeleton loading

const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);

interface LogListsProps {
    tabId: string;
}
// localStorage.clear();
const LogLists: React.FC<LogListsProps> = ({ tabId }) => {
    const { translations } = useLanguage();
    const [backupLists, setBackup] = useState<ApiLogs[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);
    const [selectedMaster, selectedBackup] = useState<number[]>([]);
    const isLocal = import.meta.env.REACT_APP_ENV === "local";
    const [showRestore, setShowRestore] = useState(false);
    const [db_filename, setFilename] = useState("");
    const [loadingMessage, setLoadingMessage] = useState("");
    const [db_time, setTime] = useState("");
    const [loading, setLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-backup`;
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
        const metaKey = `${tabId}-cached-meta-backup`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-backup`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [formData, setFormData] = useState({
        login_id: "",
        password: "",
    });
    // ON LOAD LIST
    useEffect(() => {
        fetchLogs(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    const fetchLogs = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-backups`, JSON.stringify(true));
            const paginatedData = await globalService.getAllBackups(page, perPage, search);
            setBackup(paginatedData.data);
            setTotalPages(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching backups:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-backups`, JSON.stringify(false));
        }
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = backupLists?.map((p: any) => p.id);
            selectedBackup(allIds);
        } else {
            selectedBackup([]);
        }
    };
    const handleSelectBackup = (id: number, checked: boolean) => {
        if (checked) {
            selectedBackup((prev) => [...prev, id]);
        } else {
            selectedBackup((prev) => prev.filter((pid) => pid !== id));
        }
    };
    const handleRestoreDB = async () => {
        const data = new FormData();

        data.append("username", formData.login_id);
        data.append("password", formData.password);
        data.append("database", db_filename);

        try {
            setLoading(true); // Show loading popup
            setLoadingMessage("Restoring database, please wait...");
            const result = await globalService.restoreDatabase(data);
            setLoading(false); // Hide loading popup once response is back
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            localStorage.clear();
            const confirmed = await showAlert(
                translations["System Message"],
                translations["Database Successfully restored"] || "Database Successfully restored",
                "success" // optional icon, like "success", "error", "info"
            );
            if (!confirmed) return;
            window.location.reload();
        } catch (error) {
            console.log(error);
            setLoading(false); // Hide loading on error
        }
    };
    const handleBackupDB = async () => {
        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to continue"] + "?", translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            setLoading(true); // Show loading popup
            setLoadingMessage("Backup database, please wait...");
            const result = await globalService.backupDatabase();
            setLoading(false); // Hide loading popup once response is back
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            fetchLogs();
        } catch (error) {
            console.log(error);
            setLoading(false); // Hide loading on error
        }
    };
    const handleDeleteDB = async () => {
        if (selectedMaster.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const confirmed = await showConfirm(translations["Delete Record"], translations["Are you sure you want to delete this record?"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        const filenames: any = [];
        const selectedFiles = backupLists.filter((list) => selectedMaster.includes(list.id));
        selectedFiles.forEach((element) => {
            filenames.push(element.filename);
        });
        try {
            const res = await globalService.deleteDatabase(filenames);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            fetchLogs();
            showSuccessToast(res.message);
        } catch (err) {
            selectedBackup([]);
            showErrorToast(translations["alert_message_18"]);
            console.error("No Record(s) Has Been Deleted : ", err);
        }
    };
    const filteredBackup = backupLists.filter((list) => {
        const searchLower = searchTerm.toLowerCase();
        return list.filename?.toString().includes(searchLower) || list.size_human?.toLowerCase().includes(searchLower) || list.last_modified?.toLowerCase().includes(searchLower);
    });
    const renderRestore = () => {
        if (!showRestore) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[30vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">
                                {translations["Restoring Database"]} - <span className="text-sm font-bold text-white">{db_time}</span>
                            </h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowRestore(false);
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
                            <label className="text-gray-400 text-sm mb-1">{translations["Login ID"]}</label>
                            <input
                                type="text"
                                value={formData.login_id}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData((prev) => ({ ...prev, login_id: value }));
                                }}
                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                        </div>
                        <div className="col-span-12 flex flex-col">
                            <label className="text-gray-400 text-sm mb-1">{translations["Password"]}</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData((prev) => ({ ...prev, password: value }));
                                }}
                                className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                            />
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-2">
                        <button onClick={() => setShowRestore(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button onClick={() => handleRestoreDB()} className={`px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition`}>
                            {translations["Yes"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    return (
        <div className="space-y-0">
            {/* Main Content Card */}
            <div className="rounded-lg border shadow-sm" style={{ backgroundColor: "#19191c", borderColor: "#404040" }}>
                {/* Toolbar */}
                <div className="p-4 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
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
                            {isLocal ? null : (
                                <button className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                                    <span>{translations["Browse"]}</span>
                                </button>
                            )}
                            <button onClick={handleBackupDB} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                                <span>{translations["Backup Database"]}</span>
                            </button>
                            <button onClick={handleDeleteDB} className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm">
                                <span>{translations["Delete"]}</span>
                            </button>
                        </div>
                    </div>
                </div>
                {/* Table */}
                <div className="overflow-x-auto flex-grow">
                    <div className="h-[calc(100vh-215px)] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    <th className="w-[3%] text-left py-2 px-2 text-gray-400 text-sm">
                                        <div className="flex items-center justify-center h-full">
                                            <CustomCheckbox checked={selectedMaster.length === backupLists?.length && backupLists?.length > 0} onChange={(checked) => handleSelectAll(checked)} />
                                        </div>
                                    </th>
                                    <th className="w-[37%] text-left py-2 px-2 text-gray-400 text-sm">{translations["File Name"]}</th>
                                    <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Date Created"]}</th>
                                    <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm">{translations["File Size"]}</th>
                                    <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Action"]}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBackup.map((list, index) => (
                                    <tr
                                        key={list.id || index}
                                        className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer ${
                                            selectedMaster.includes(list.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                        }`}
                                        style={{ borderColor: "#40404042" }}
                                    >
                                        <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">
                                            <div className="flex items-center justify-center h-full">
                                                <CustomCheckbox checked={selectedMaster.includes(list.id as number)} onChange={(checked) => handleSelectBackup(list.id as number, checked)} />
                                            </div>
                                        </td>
                                        <td className="py-3 px-2 text-gray-400 text-left text-custom-sm">{list.filename}</td>
                                        <td className="py-3 px-2 text-gray-400 text-left text-custom-sm">{list.last_modified}</td>
                                        <td className="py-3 px-2 text-gray-400 text-left text-custom-sm">{list.size_human}</td>
                                        <td className="py-3 px-2 text-gray-400 text-left text-custom-sm flex items-center space-x-1">
                                            <div className="relative group inline-block">
                                                <button className={`px-1 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-xs`}>
                                                    <Download size={20} />
                                                </button>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                    <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg whitespace-nowrap uppercase">{translations["Download"]}</div>
                                                    <div className="w-2 h-2 bg-gray-800 rotate-45 absolute top-full left-1/2 transform -translate-x-1/2"></div>
                                                </div>
                                            </div>
                                            <div className="relative group inline-block">
                                                <button
                                                    onClick={() => {
                                                        setShowRestore(true);
                                                        setFilename(list.filename ?? "");
                                                        setTime(list.last_modified ?? "");
                                                    }}
                                                    className={`px-1 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs`}
                                                >
                                                    <Database size={20} />
                                                </button>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                    <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg whitespace-nowrap uppercase">{translations["Restore"]}</div>
                                                    <div className="w-2 h-2 bg-gray-800 rotate-45 absolute top-full left-1/2 transform -translate-x-1/2"></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Footer with Pagination */}
                <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                    <div className="flex items-center space-x-4">
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
            </div>
            {renderRestore()}
            {/* Loading Popup */}
            {loading && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-6 rounded-lg shadow-lg flex flex-col items-center space-y-4">
                        <svg className="animate-spin h-12 w-12 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                        <p className="text-white text-lg font-semibold">{loadingMessage}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
export default LogLists;

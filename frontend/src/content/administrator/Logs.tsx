import React, { useState, useEffect, useMemo } from "react";
import { globalService, ApiLogs } from "@/services/globalService";
import { useLanguage } from "@/context/LanguageContext";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import PusherEcho from "@/utils/echo";
// Handle the Smooth skeleton loading
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);

interface LogListsProps {
    tabId: string;
}
// localStorage.clear();
const LogLists: React.FC<LogListsProps> = ({ tabId }) => {
    const { translations, lang } = useLanguage();
    const [logLists, setLogs] = useState<ApiLogs[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const pageSizeOptions = useMemo(() => [15, 20, 50, -1], []);

    const [currentPage, setCurrentPage] = useState(() => {
        const metaKey = `${tabId}-cached-meta-logs`;
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
        const metaKey = `${tabId}-cached-meta-logs`;
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
        const cached = localStorage.getItem(`${tabId}-cached-meta-logs`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });

    useEffect(() => {
        const channel = PusherEcho.channel("log-channel");
        channel.listen(".log-event", () => {
            fetchLogs(currentPage, itemsPerPage, searchTerm);
        });
        return () => {
            PusherEcho.leave("log-channel");
        };
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    // ON LOAD LIST
    useEffect(() => {
        fetchLogs(currentPage, itemsPerPage, searchTerm);
    }, [currentPage, itemsPerPage, searchTerm, tabId]);

    const fetchLogs = async (page = currentPage, perPage = itemsPerPage, search = "") => {
        try {
            localStorage.setItem(`${tabId}-loading-logs`, JSON.stringify(true));
            const paginatedData = await globalService.getAllLogs(page, perPage, search);
            setLogs(paginatedData.data);
            setTotalPages(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching logs:", err);
        } finally {
            localStorage.setItem(`${tabId}-loading-logs`, JSON.stringify(false));
        }
    };
    const filteredLogs = logLists.filter((supplier) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            supplier.id?.toString().includes(searchLower) ||
            supplier.module?.toLowerCase().includes(searchLower) ||
            supplier.table?.toLowerCase().includes(searchLower) ||
            supplier.action?.toLowerCase().includes(searchLower) ||
            supplier.description?.toLowerCase().includes(searchLower) ||
            supplier.username?.toLowerCase().includes(searchLower)
        );
    });
    return (
        <div className="space-y-6">
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
                    </div>
                </div>
                {/* Table */}
                <div className="overflow-x-auto flex-grow">
                    <div className="h-[calc(100vh-215px)] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                    <th className=" text-left py-2 px-4 text-gray-400 text-sm w-[15%]">{translations["Transaction Date"]}</th>
                                    <th className=" text-left py-2 px-4 text-gray-400 text-sm w-[50%]">{translations["Description"]}</th>
                                    <th className=" text-left py-2 px-4 text-gray-400 text-sm w-[15%]">{translations["Module"]}</th>
                                    <th className=" text-left py-2 px-4 text-gray-400 text-sm w-[10%]">{translations["Action"]}</th>
                                    <th className=" text-left py-2 px-4 text-gray-400 text-sm w-[10%]">{translations["User"]}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((list, index) => (
                                    <tr
                                        key={list.id || index}
                                        className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                        style={{ borderColor: "#40404042" }}
                                    >
                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.created_at}</td>
                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.description}</td>
                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm uppercase">{list.module}</td>
                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm uppercase">{list.action}</td>
                                        <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.username}</td>
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
        </div>
    );
};
export default LogLists;

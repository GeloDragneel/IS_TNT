import React, { useState, useRef, useEffect } from "react";
import { showAlert } from "./utils/alert";
import { Toaster } from "react-hot-toast";
import axios from "axios";
import PusherEcho from "@/utils/echo";
import {
    Menu,
    X,
    Home,
    LayoutDashboard,
    Package,
    Indent,
    Bell,
    Settings,
    User,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    Users,
    Megaphone,
    Clock,
    DollarSign,
    Wrench,
    Truck,
    ShoppingCart,
    UserCheck,
    Mail,
    FileText,
    Shield,
    Database,
    Activity,
    ChevronUp,
    Globe,
} from "lucide-react";
// Import components
import Login from "./components/Login";

// Import content components
import Dashboard from "./content/home/Dashboard";
import Analytics from "./content/home/Analytics";
import StaffMovement from "./content/home/StaffMovement";
import HRDashboard from "./content/admin-hr/HRDashboard";
import Announcement from "./content/admin-hr/Announcement";
import Attendance from "./content/admin-hr/Attendance";
import Employees from "./content/admin-hr/Employees";
import Payroll from "./content/admin-hr/Payroll";
import SalesDashboard from "./content/sales/SalesDashboard";
import Preorder from "./content/sales/Preorder";
import SalesOrder from "./content/sales/SalesOrder";
import MassMailer from "./content/sales/MassMailer";
import SerialNo from "./content/sales/SerialNo";
import Products from "./content/items_and_inventory/Products";
import Services from "./content/items_and_inventory/Services";
import Inventory from "./content/items_and_inventory/Inventory";
import InventoryTracking from "./content/items_and_inventory/InventoryTracking";
import InternalTransfer from "./content/items_and_inventory/InternalTransfer";
import ProductImports from "./content/items_and_inventory/ProductImports";
import StockTake from "./content/items_and_inventory/StockTake";
import Customer from "./content/customer/Customer";
import CustomerGroup from "./content/customer/CustomerGroup";
import SupplierDashboard from "./content/supplier/SupplierDashboard";
import Supplier from "./content/supplier/Supplier";
import PurchaseOrder from "./content/supplier/PurchaseOrder";
import SupplierInvoice from "./content/supplier/SupplierInvoice";
import Logs from "./content/administrator/Logs";
import Backup from "./content/administrator/Backup";
import AdminSettings from "./content/administrator/Settings";
import AccessRight from "./content/administrator/AccessRight";
import ReceiveGoods from "./content/logistics/ReceiveGoods";
import ShipoutItems from "./content/logistics/ShipoutItems";
import PreparedShipment from "./content/logistics/PreparedShipment";
import Allocation from "./content/logistics/Allocation";
import AccountDashboard from "./content/accounts/AccountDashboard";
import CustomerInvoices from "./content/accounts/Invoices";
import ReceiveVoucher from "./content/accounts/ReceiveVoucher";
import PaymentVoucher from "./content/accounts/PaymentVoucher";
import OperatingExpenses from "./content/accounts/OperatingExpenses";
import ChartsOfAccount from "./content/accounts/ChartsOfAccount";
import AccountsPayable from "./content/accounts/AccountsPayable";
import CustomerCreditNote from "./content/accounts/CustomerCreditNote";
import SupplierCreditNote from "./content/accounts/SupplierCreditNote";
import TransactionList from "./content/accounts/TransactionList";
import JournalEntries from "./content/accounts/JournalEntries";
import CustomerDeposit from "./content/accounts/CustomerDeposit";
import ProfitAndLoss from "./content/accounts/ProfitAndLoss";
import TrialAndBalance from "./content/accounts/TrialAndBalance";
import { useLanguage } from "./context/LanguageContext";

interface Tab {
    id: string;
    label: string;
    labelKey: string;
    componentName: string;
    closable: boolean;
    iconName: string;
    isLoaded?: boolean; // Track if tab has been loaded
}
interface SubMenuItem {
    id: string;
    label: string;
    labelKey: string;
    icon: React.ComponentType<{ className?: string }>;
    component: React.FC<any>;
    componentName: string;
    iconName: string;
}
interface MenuSection {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    items: SubMenuItem[];
}
interface User {
    username: string;
    user_id: number;
    fullName?: string;
    language: string;
}
// Component mapping for persistence
const componentMap: Record<string, React.FC<any>> = {
    Dashboard,
    AccountDashboard,
    SalesDashboard,
    SupplierDashboard,
    Analytics,
    StaffMovement,
    HRDashboard,
    Announcement,
    Attendance,
    Employees,
    Payroll,
    Preorder,
    SalesOrder,
    SerialNo,
    MassMailer,
    Products,
    Services,
    Inventory,
    InventoryTracking,
    InternalTransfer,
    ProductImports,
    StockTake,
    Supplier,
    PurchaseOrder,
    SupplierInvoice,
    Logs,
    Backup,
    AdminSettings,
    AccessRight,
    Customer,
    CustomerGroup,
    ReceiveGoods,
    Allocation,
    CustomerInvoices,
    ReceiveVoucher,
    PaymentVoucher,
    OperatingExpenses,
    ChartsOfAccount,
    ShipoutItems,
    PreparedShipment,
    AccountsPayable,
    CustomerCreditNote,
    SupplierCreditNote,
    TransactionList,
    JournalEntries,
    CustomerDeposit,
    ProfitAndLoss,
    TrialAndBalance,
};
// Icon mapping for persistence
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Home,
    LayoutDashboard,
    BarChart3,
    Users,
    UserCheck,
    Megaphone,
    Clock,
    DollarSign,
    Package,
    Wrench,
    Indent,
    Truck,
    ShoppingCart,
    Mail,
    FileText,
    Shield,
    Database,
    Settings,
    Activity,
};
const iconMap_fetch: Record<string, React.ComponentType<{ className?: string }>> = {
    // Lowercase (camelCase from API)
    home: Home,
    layoutDashboard: LayoutDashboard,
    barChart3: BarChart3,
    users: Users,
    userCheck: UserCheck,
    megaphone: Megaphone,
    clock: Clock,
    dollarSign: DollarSign,
    package: Package,
    wrench: Wrench,
    indent: Indent,
    truck: Truck,
    shoppingCart: ShoppingCart,
    mail: Mail,
    fileText: FileText,
    shield: Shield,
    database: Database,
    settings: Settings,
    activity: Activity,
    // PascalCase variants (for consistency)
    Home: Home,
    LayoutDashboard: LayoutDashboard,
    BarChart3: BarChart3,
    Users: Users,
    UserCheck: UserCheck,
    Megaphone: Megaphone,
    Clock: Clock,
    DollarSign: DollarSign,
    Package: Package,
    Wrench: Wrench,
    Indent: Indent,
    Truck: Truck,
    ShoppingCart: ShoppingCart,
    Mail: Mail,
    FileText: FileText,
    Shield: Shield,
    Database: Database,
    Settings: Settings,
    Activity: Activity,
};
function App() {
    const { translations, changeLanguage, lang } = useLanguage();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [size, setSize] = useState({ width: window.innerWidth });
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [menus, setMenus] = useState([]);
    const [tabs, setTabs] = useState<Tab[]>([
        {
            id: "dashboard",
            label: translations["Dashboard"],
            labelKey: "Dashboard",
            componentName: "Dashboard",
            closable: false,
            iconName: "LayoutDashboard",
            isLoaded: false,
        },
    ]);
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<string[]>(["home"]);
    const [renderedTabs, setRenderedTabs] = useState<Set<string>>(new Set(["dashboard"])); // Track which tabs have been rendered
    const tabCounter = useRef(1);
    const tabsContainerRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            setSize({ width: window.innerWidth });
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (size.width <= 1300) {
            console.log(size);
        }
    }, [size]);

    // Update initial tab label when translations are loaded
    useEffect(() => {
        setTabs((prevTabs) =>
            prevTabs.map((tab) => ({
                ...tab,
                label: translations[tab.labelKey] || tab.labelKey,
            }))
        );
    }, [translations]);

    useEffect(() => {
        const channel = PusherEcho.channel("access-right-channel");
        channel.listen(".access-right-event", () => {
            const loadMenus = async () => {
                const response = await axios.get(import.meta.env.VITE_API_BASE_URL + "/access-rights/" + currentUser?.user_id);
                setMenus(response.data.list);
            };
            loadMenus();
        });
        return () => {
            PusherEcho.leave("access-right-channel");
        };
    }, []);

    useEffect(() => {
        const channel = PusherEcho.channel("sync-channel");
        channel.listen(".sync-event", () => {
            const url = import.meta.env.VITE_ENV === "local" ? "http://toyntoys-local-v2/query/sync_db_new.php" : "https://tnt2.simplify.cool/query/sync_db_new.php";
            setTimeout(() => {
                axios
                    .get(url)
                    .then(() => {
                        console.log("PHP file called successfully");
                    })
                    .catch((error) => {
                        console.error("Error calling PHP file:", error);
                    });
            }, 25000); // 25000ms = 25 seconds
        });
        return () => {
            PusherEcho.leave("sync-channel");
        };
    }, []);

    // Check for existing authentication on app load
    useEffect(() => {
        const savedAuth = localStorage.getItem("xintra-auth");
        const savedUser = localStorage.getItem("xintra-user");

        if (savedAuth === "true" && savedUser) {
            try {
                const user = JSON.parse(savedUser);
                setIsAuthenticated(true);
                setCurrentUser(user);
            } catch (error) {
                console.error("Error parsing saved user:", error);
                localStorage.removeItem("xintra-auth");
                localStorage.removeItem("xintra-user");
            }
        }
    }, []);

    // Toggle sidebar after clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                setSidebarOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [sidebarOpen]);

    // Load state from localStorage on component mount (only when authenticated)
    useEffect(() => {
        if (!isAuthenticated) return;

        const savedTabs = localStorage.getItem("app-tabs");
        const savedActiveTab = localStorage.getItem("app-active-tab");
        const savedTabCounter = localStorage.getItem("app-tab-counter");
        const savedExpandedSections = localStorage.getItem("app-expanded-sections");
        const savedRenderedTabs = localStorage.getItem("app-rendered-tabs");

        if (savedTabs) {
            try {
                const parsedTabs = JSON.parse(savedTabs);
                const translatedTabs = parsedTabs.map((tab: Tab) => ({
                    ...tab,
                    label: translations[tab.labelKey] || tab.labelKey,
                }));
                setTabs(translatedTabs);
            } catch (error) {
                console.error("Error parsing saved tabs:", error);
            }
        }

        if (savedActiveTab) {
            setActiveTab(savedActiveTab);
        }

        if (savedTabCounter) {
            tabCounter.current = parseInt(savedTabCounter, 10);
        }

        if (savedExpandedSections) {
            try {
                const parsedSections = JSON.parse(savedExpandedSections);
                setExpandedSections(parsedSections);
            } catch (error) {
                console.error("Error parsing saved expanded sections:", error);
            }
        }

        if (savedRenderedTabs) {
            try {
                const parsedRenderedTabs = JSON.parse(savedRenderedTabs);
                setRenderedTabs(new Set(parsedRenderedTabs));
            } catch (error) {
                console.error("Error parsing saved rendered tabs:", error);
            }
        }
    }, [isAuthenticated]);

    // Save state to localStorage whenever it changes (only when authenticated)
    useEffect(() => {
        if (isAuthenticated) {
            localStorage.setItem("app-tabs", JSON.stringify(tabs));
        }
    }, [tabs, isAuthenticated]);

    useEffect(() => {
        const loadMenus = async () => {
            const response = await axios.get(import.meta.env.VITE_API_BASE_URL + "/access-rights/" + currentUser?.user_id);
            setMenus(response.data.list);
        };
        loadMenus();
    }, [currentUser]);

    useEffect(() => {
        if (isAuthenticated) {
            localStorage.setItem("app-active-tab", activeTab);
        }
    }, [activeTab, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            localStorage.setItem("app-tab-counter", tabCounter.current.toString());
        }
    }, [tabCounter.current, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            localStorage.setItem("app-expanded-sections", JSON.stringify(expandedSections));
        }
    }, [expandedSections, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            localStorage.setItem("app-rendered-tabs", JSON.stringify(Array.from(renderedTabs)));
        }
    }, [renderedTabs, isAuthenticated]);

    // Mark tab as rendered when it becomes active
    useEffect(() => {
        if (activeTab && !renderedTabs.has(activeTab)) {
            setRenderedTabs((prev) => new Set([...prev, activeTab]));
        }
    }, [activeTab, renderedTabs]);

    const handleLogin = async (credentials: { username: string; password: string }) => {
        try {
            const response = await axios.post(import.meta.env.VITE_API_BASE_URL + "/login", credentials, {
                withCredentials: true,
            });
            if (response.data.success) {
                const user: User = response.data.user;
                setCurrentUser(user);
                setIsAuthenticated(true);

                localStorage.setItem("xintra-auth", "true");
                localStorage.setItem("xintra-user", JSON.stringify(user));

                if (user.language) {
                    await changeLanguage(user.language);
                }
            } else {
                showAlert("Login Failed", response.data.message, "warning");
            }
        } catch (error) {
            showAlert("System Error", "Login failed due to network/server error.", "error");
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentUser(null);

        // Clear authentication and app state
        localStorage.removeItem("xintra-auth");
        localStorage.removeItem("xintra-user");
        localStorage.removeItem("app-tabs");
        localStorage.removeItem("app-active-tab");
        localStorage.removeItem("app-tab-counter");
        localStorage.removeItem("app-expanded-sections");
        localStorage.removeItem("app-rendered-tabs");
        localStorage.clear();

        // Clear all tab-specific cache data
        Object.keys(localStorage).forEach((key) => {
            if (key.includes("-cached-") || key.includes("-loading-") || key.includes("-mount-status")) {
                localStorage.removeItem(key);
            }
        });

        // Reset app state
        setTabs([
            {
                id: "dashboard",
                label: translations["Dashboard"],
                labelKey: "Dashboard",
                componentName: "Dashboard",
                closable: false,
                iconName: "LayoutDashboard",
                isLoaded: false,
            },
        ]);
        setActiveTab("dashboard");
        setExpandedSections(["dashboard"]);
        setRenderedTabs(new Set(["dashboard"]));
        tabCounter.current = 1;
        setDropdownOpen(null);
        setSidebarOpen(false);
    };

    // Show login page if not authenticated
    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }
    const menuSections: MenuSection[] = menus.map((section: any) => {
        return {
            id: section.id,
            label: section.label,
            icon: iconMap_fetch[section.icon] || Home,
            items: section.items.map((item: any) => ({
                id: item.id,
                labelKey: item.labelKey,
                label: item.label,
                icon: iconMap_fetch[item.icon] || Home,
                component: componentMap[item.component] || Dashboard,
                componentName: item.componentName,
                iconName: item.iconName,
            })),
        };
    });
    const handleMenuClick = (item: SubMenuItem) => {
        const newTabId = `${item.id}-${tabCounter.current++}`;
        const newTab: Tab = {
            id: newTabId,
            label: translations[item.label] || item.label,
            labelKey: item.label,
            componentName: item.componentName,
            closable: true,
            iconName: item.iconName,
            isLoaded: false,
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTab(newTabId);
        setSidebarOpen(false);
    };
    const closeTab = (tabId: string) => {
        const tabToClose = tabs.find((tab) => tab.id === tabId);
        if (!tabToClose?.closable) return;

        const newTabs = tabs.filter((tab) => tab.id !== tabId);
        setTabs(newTabs);

        // Remove from rendered tabs
        setRenderedTabs((prev) => {
            const newSet = new Set(prev);
            newSet.delete(tabId);
            return newSet;
        });

        // Clear tab-specific cache data
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(`${tabId}-`)) {
                localStorage.removeItem(key);
            }
        });

        if (activeTab === tabId) {
            const activeIndex = tabs.findIndex((tab) => tab.id === tabId);
            const nextTab = newTabs[activeIndex] || newTabs[activeIndex - 1] || newTabs[0];
            setActiveTab(nextTab?.id || "dashboard");
        }
    };
    const toggleDropdown = (dropdown: string) => {
        setDropdownOpen(dropdownOpen === dropdown ? null : dropdown);
    };
    const toggleSection = (sectionId: string) => {
        setExpandedSections((prev) => (prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]));
    };
    const scrollTabs = (direction: "left" | "right") => {
        if (tabsContainerRef.current) {
            const scrollAmount = 200;
            const currentScroll = tabsContainerRef.current.scrollLeft;
            const newScroll = direction === "left" ? currentScroll - scrollAmount : currentScroll + scrollAmount;

            tabsContainerRef.current.scrollTo({
                left: newScroll,
                behavior: "smooth",
            });
        }
    };
    // const activeTabData = tabs.find(tab => tab.id === activeTab);
    // const ActiveContent = activeTabData ? componentMap[activeTabData.componentName] || Dashboard : Dashboard;
    // const ActiveIcon = activeTabData ? iconMap[activeTabData.iconName] || Home : Home;
    return (
        <>
            <Toaster position="top-center" />
            <div className="min-h-screen text-white" style={{ backgroundColor: "#2d2d30" }}>
                {/* Sidebar */}
                <div
                    ref={sidebarRef}
                    className={`fixed inset-y-0 left-0 z-70 w-72 border-r transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
                    style={{ backgroundColor: "#19191c", borderColor: "#404040" }}
                >
                    <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "#404040" }}>
                        <h2 className="text-xl font-bold text-white">IS - TNT</h2>
                        <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-600 transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <nav className="p-3 space-y-1 overflow-y-auto h-full pb-20">
                        {menuSections.map((section) => (
                            <div key={section.id} className="space-y-1">
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-600 transition-colors text-left group"
                                >
                                    <div className="flex items-center space-x-3">
                                        <section.icon className="h-5 w-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                                        <span className="text-gray-200 group-hover:text-white transition-colors font-medium text-sm">{translations[section.label]}</span>
                                    </div>
                                    {expandedSections.includes(section.id) ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                </button>

                                {expandedSections.includes(section.id) && (
                                    <div className="ml-4 space-y-1 border-l border-gray-600 pl-4">
                                        {section.items.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleMenuClick(item)}
                                                className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-600 transition-colors text-left group"
                                            >
                                                <item.icon className="h-4 w-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                                                <span className="text-gray-300 group-hover:text-white transition-colors text-sm">{translations[item.label]}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>
                {/* Sidebar Overlay */}
                {sidebarOpen && <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
                {/* Main Content */}
                <div className="flex flex-col min-h-screen">
                    {/* Fixed Header with Tabs */}
                    <header className="fixed top-0 left-0 right-0 z-60 border-b shadow-lg" style={{ backgroundColor: "#19191c", borderColor: "#404040" }}>
                        <div className="flex items-center justify-between px-4 py-3">
                            {/* Left Section - Menu Toggle and Tabs */}
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                                <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-600 transition-colors">
                                    <Menu className="h-5 w-5" />
                                </button>

                                {/* Tab Navigation with Arrows */}
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                    {/* Left Arrow */}
                                    <button onClick={() => scrollTabs("left")} className="p-1 rounded hover:bg-gray-600 transition-colors flex-shrink-0">
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>

                                    {/* Tabs Container */}
                                    <div
                                        ref={tabsContainerRef}
                                        className="flex items-center space-x-1 flex-1 min-w-0 overflow-x-auto scrollbar-hide"
                                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                    >
                                        {tabs.map((tab) => {
                                            const TabIcon = iconMap[tab.iconName] || Home;
                                            return (
                                                <div
                                                    key={tab.id}
                                                    className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg border-b-2 transition-all duration-200 min-w-0 flex-shrink-0 ${
                                                        activeTab === tab.id ? "border-cyan-500 text-white" : "border-transparent text-gray-300 hover:text-white"
                                                    }`}
                                                    style={{
                                                        backgroundColor: activeTab === tab.id ? "#2d2d30" : "transparent",
                                                    }}
                                                >
                                                    <button onClick={() => setActiveTab(tab.id)} className="flex items-center space-x-2 min-w-0">
                                                        <TabIcon className="h-4 w-4 flex-shrink-0" />
                                                        <span className="truncate text-sm font-medium whitespace-nowrap">{tab.label}</span>
                                                    </button>
                                                    {tab.closable && (
                                                        <button onClick={() => closeTab(tab.id)} className="ml-2 p-1 rounded hover:bg-gray-500 transition-colors">
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Right Arrow */}
                                    <button onClick={() => scrollTabs("right")} className="p-1 rounded hover:bg-gray-600 transition-colors flex-shrink-0">
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            {/* Right Section - Action Icons */}
                            <div className="flex items-center space-x-2">
                                {/* Notifications */}
                                <div className="relative">
                                    <button onClick={() => toggleDropdown("notifications")} className="p-2 rounded-lg hover:bg-gray-600 transition-colors relative">
                                        <Bell className="h-5 w-5" />
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
                                    </button>
                                    {dropdownOpen === "notifications" && (
                                        <div className="absolute right-0 mt-2 w-80 rounded-lg shadow-xl border z-50" style={{ backgroundColor: "#19191c", borderColor: "#404040" }}>
                                            <div className="p-4 border-b" style={{ borderColor: "#404040" }}>
                                                <h3 className="font-semibold text-white">Notifications</h3>
                                            </div>
                                            <div className="p-2 max-h-64 overflow-y-auto">
                                                {[1, 2, 3].map((i) => (
                                                    <div key={i} className="p-3 hover:bg-gray-600 rounded-lg cursor-pointer">
                                                        <p className="text-sm text-white">New notification {i}</p>
                                                        <p className="text-xs text-gray-400 mt-1">2 minutes ago</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Settings */}
                                <div className="relative">
                                    <button onClick={() => toggleDropdown("settings")} className="p-2 rounded-lg hover:bg-gray-600 transition-colors">
                                        <Globe className="h-5 w-5" />
                                    </button>
                                    {dropdownOpen === "settings" && (
                                        <div className="absolute right-0 mt-2 w-20 rounded-lg shadow-xl border z-50" style={{ backgroundColor: "#19191c", borderColor: "#404040" }}>
                                            <div className="p-2">
                                                {["en", "cn"].map((langCode) => (
                                                    <button
                                                        key={langCode}
                                                        onClick={() => {
                                                            if (lang !== langCode) {
                                                                changeLanguage(langCode);
                                                            }
                                                            setDropdownOpen(null);
                                                        }}
                                                        disabled={lang === langCode}
                                                        className={`w-full text-center p-2 rounded-lg text-sm transition-colors ${
                                                            lang === langCode ? "bg-cyan-700 text-white cursor-not-allowed" : "hover:bg-gray-600"
                                                        }`}
                                                    >
                                                        {translations[langCode.toUpperCase()] || langCode.toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Profile */}
                                <div className="relative">
                                    <button onClick={() => toggleDropdown("profile")} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-600 transition-colors">
                                        <User className="h-5 w-5" />
                                        <ChevronDown className="h-4 w-4" />
                                    </button>
                                    {dropdownOpen === "profile" && (
                                        <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl border z-50" style={{ backgroundColor: "#19191c", borderColor: "#404040" }}>
                                            <div className="p-4 border-b" style={{ borderColor: "#404040" }}>
                                                <p className="font-semibold text-white">{currentUser?.fullName || "User"}</p>
                                                <p className="text-sm text-gray-400">{currentUser?.username}</p>
                                            </div>
                                            <div className="p-2">
                                                <button className="w-full text-left p-2 hover:bg-gray-600 rounded-lg text-sm">{translations["Profile"]}</button>
                                                <button className="w-full text-left p-2 hover:bg-gray-600 rounded-lg text-sm">{translations["Settings"]}</button>
                                                <hr className="my-2 border-gray-600" />
                                                <button onClick={handleLogout} className="w-full text-left p-2 hover:bg-gray-600 rounded-lg text-sm text-red-400">
                                                    {translations["logout"]}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </header>
                    {/* Main Content Area with Top Padding */}
                    <main className="flex-1 pt-20 p-1">
                        <div className="rounded-lg p-0 shadow-lg border" style={{ backgroundColor: "transparent", borderColor: "transparent" }}>
                            {/* Render all tabs but only show the active one */}
                            {tabs.map((tab) => {
                                const TabContent = componentMap[tab.componentName] || Dashboard;
                                const isActive = activeTab === tab.id;
                                const shouldRender = renderedTabs.has(tab.id);
                                if (!shouldRender) return null;
                                return (
                                    <div key={tab.id} style={{ display: isActive ? "block" : "none" }}>
                                        <TabContent tabId={tab.id} />
                                    </div>
                                );
                            })}
                        </div>
                    </main>
                </div>
                {/* Click outside to close dropdowns */}
                {dropdownOpen && <div className="fixed inset-0" onClick={() => setDropdownOpen(null)} />}
            </div>
        </>
    );
}

export default App;

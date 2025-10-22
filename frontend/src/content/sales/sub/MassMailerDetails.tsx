import React, { useState, useEffect, useMemo } from "react";
import { massMailerService, ApiMassMailer } from "@/services/massMailerService";
import { useLanguage } from "@/context/LanguageContext";
import { showConfirm } from "@/utils/alert";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import Select from "react-select";
import Pagination from "@/components/Pagination";
import ItemsPerPageSelector from "@/components/ItemsPerPageSelector";
import { ArrowLeft, User, Users, Mail, X, Reply, Tag, MailCheck, Folder, Megaphone } from "lucide-react";
import { OptionType, DropdownData, selectStyles } from "@/utils/globalFunction";
import CustomCheckbox from "@/components/CustomCheckbox";
import { customerService, ApiCustomer } from "@/services/customerService";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Sidebar from "./Sidebar";
import Canvas from "./Canvas";
import PropertiesPanel from "./PropertiesPanel";
import Toolbar from "./Toolbar";
import ImageLibrary from "./ImageLibrary";
import { EmailBlock, BlockType } from "../types/email";
import PusherEcho from "@/utils/echo";
export interface DropdownData2 {
    value: number | string;
    value2: number | string;
    en: string;
    cn: string;
    code?: string;
    created_at?: string;
    updated_at?: string;
}
interface PreorderDetailsProps {
    preorderId: number;
    saveType: string;
    onBack: () => void;
    onSave: () => void;
    onChangeView: (view: "list" | "details" | "settings" | "tags" | "template", from: string) => void;
    onChangePreorderId: (newId: number) => void;
    onChangeSaveType: (type: string) => void;
    tabId: string;
}
import { fetchCustomerGroups, convertToSingleOption } from "@/utils/fetchDropdownData";
const MemoizedPagination = React.memo(Pagination);
const MemoizedItemsPerPageSelector = React.memo(ItemsPerPageSelector);
// localStorage.clear();
const PreorderDetails: React.FC<PreorderDetailsProps> = ({ preorderId, onBack, tabId }) => {
    const { translations, lang } = useLanguage();
    const [activeTab, setActiveTab] = useState("information");
    const [iframeLayout, setIframeLayout] = useState("");
    const [iframeLayout2, setIframeLayout2] = useState("");
    const [loadingSave, setLoadingSave] = useState(false);
    const [loadingCampaign, setLoadingCampaign] = useState(false);
    const [tagList, setTagList] = useState<ApiMassMailer[]>([]);
    const [selectedChkGroup, setSelectedGroup] = useState<number[]>([]);
    const [selectedChkEmails, setSelectedEmails] = useState<number[]>([]);
    const [selectedChkTags, setSelectedTags] = useState<number[]>([]);
    const [groupsData, setGroupsData] = useState<DropdownData[]>([]);
    const [templatesData, setTemplates] = useState<DropdownData[]>([]);
    const [templatesData1, setTemplates1] = useState<DropdownData[]>([]);
    const [templatesData2, setTemplates2] = useState<DropdownData2[]>([]);
    const [customerGroupList, setCustomerGroupList] = useState<DropdownData[]>([]);
    const [customerEmailList, setCustomerEmailList] = useState<ApiCustomer[]>([]);
    const [customerTagList, setCustomerTagList] = useState<ApiCustomer[]>([]);
    const [customerSenderList, setCustomerSenderList] = useState<ApiCustomer[]>([]);
    const [customerList, setCustomerList] = useState<ApiCustomer[]>([]);
    const [senderList, setSenderList] = useState<ApiCustomer[]>([]);
    const [customers, setCustomers] = useState<ApiCustomer[]>([]);
    const [showGroup, setShowGroup] = useState(false);
    const [showTags, setShowTags] = useState(false);
    const [showSenders, setShowSender] = useState(false);
    const [showChooseTemplate, setShowChooseTemplate] = useState(false);
    const [titleCreateTemplate, setTitleCreateTemplate] = useState("");
    const pageSizeOptions = useMemo(() => [10, 20, 50, -1], []);
    const [showCustomers, setShowCustomers] = useState(false);
    const [totalPagesCustomer, setTotalPages_Customer] = useState(1);
    const [isOpen, setIsOpen] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);
    const closeMenu = () => setIsOpen(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // 👈 adjust how many to show per page
    const totalPages = Math.ceil(customerList.length / itemsPerPage);
    const [popupType, setPopupType] = useState("");
    const [templateName, setTemplateName] = useState("");
    const [templateId, setTemplateId] = useState(0);
    const [selectedBlock, setSelectedBlock] = useState<EmailBlock | null>(null);
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
    const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [darkMode, setDarkMode] = useState(true);
    const [showImageLibrary, setShowImageLibrary] = useState(false);
    const [selectedImageTarget, setSelectedImageTarget] = useState<{ blockId: string; path?: string } | null>(null);
    const [selectedSettings, setSelectSettings] = useState<number[]>([]);
    const [selectedTemplates, setSelectTemplates] = useState<number[]>([]);
    const [campaignList, setCampaignList] = useState([]);
    const [selectedTags, setSelectTags] = useState<number[]>([]);
    const [activeMenu, setActiveMenu] = useState("Campaigns");
    const [showPopup_Senders, setShowPopup_Senders] = useState(false);
    const [showPopup_Tags, setShowPopup_Tags] = useState(false);
    const [blocks, setBlocks] = useState<EmailBlock[]>(() => {
        // Create default blocks showcasing all available block types
        return [];
    });
    const [formData_Senders, setFormData_Senders] = useState({
        id: 0,
        sender_name: "",
        sender_email: "",
        reply_to: "",
    });
    const [formData_Tags, setFormData_Tags] = useState({
        id: 0,
        email_address: "",
    });
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };
    const exportJSON = async (saveType: string) => {
        const templateData = {
            subject: templateName,
            blocks: blocks,
            metadata: {
                createdAt: new Date().toISOString(),
                version: "1.0",
                totalBlocks: blocks.length,
            },
        };
        if (templateData.subject.length < 3) {
            showErrorToast(translations["Template Name is required"] || "Template Name is required");
            return;
        }
        const results = await massMailerService.saveMassMailerTemplate(templateData, templateId, saveType);
        const version = Date.now(); // current timestamp
        if (results?.success) {
            setIsOpen(false);
            await fetchTemplates();
            await fetchTemplates2();
            const selectedOption = {
                value: results.last_id,
                value2: results.last_id,
                label: results.subject,
                en: results.subject,
                cn: results.subject,
            };
            setTimeout(() => {
                setFormData((prev) => ({
                    ...prev,
                    template: selectedOption,
                }));
                setIframeLayout(results.last_id + ".html?v=" + version);
            }, 500);
            showSuccessToast(translations[results.message] || results.message);
        } else {
            showErrorToast(results.message);
        }
    };
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || !active) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Only handle reordering within canvas
        const oldIndex = blocks.findIndex((block) => block.id === activeId);
        const newIndex = blocks.findIndex((block) => block.id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            setBlocks((prev) => arrayMove(prev, oldIndex, newIndex));
        }
    };
    const addBlock = (type: BlockType) => {
        const newBlock = createNewBlock(type);
        setBlocks((prev) => [...prev, newBlock]);
        setSelectedBlock(newBlock);
        setShowPropertiesPanel(true);
    };
    const createNewBlock = (type: BlockType): EmailBlock => {
        const id = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return {
            id,
            type,
            content: getDefaultContent(type),
            styles: getDefaultStyles(type),
        };
    };
    const getDefaultContent = (type: BlockType): any => {
        switch (type) {
            case "text":
                return { text: "Your text goes here. Double-click to edit this content." };
            case "boxed-text":
                return { text: "Boxed text content goes here. Double-click to edit." };
            case "image":
                return {
                    src: import.meta.env.VITE_BASE_URL + "/storage/products/empty-image.svg",
                    alt: "Sample Image",
                    width: "100%",
                };
            case "image-group":
                return {
                    images: [
                        { src: import.meta.env.VITE_BASE_URL + "/storage/products/empty-image.svg", alt: "Image 1" },
                        { src: import.meta.env.VITE_BASE_URL + "/storage/products/empty-image.svg", alt: "Image 2" },
                    ],
                };
            case "image-card":
                return {
                    image: { src: import.meta.env.VITE_BASE_URL + "/storage/products/empty-image.svg", alt: "Card Image" },
                    title: "Card Title",
                    description: "Card description goes here.",
                };
            case "image-text":
                return {
                    image: { src: import.meta.env.VITE_BASE_URL + "/storage/products/empty-image.svg", alt: "Image" },
                    text: "Text content goes here alongside the image.",
                };
            case "button":
                return {
                    text: "Click Here",
                    href: "https://example.com",
                    backgroundColor: "#3B82F6",
                    color: "#ffffff",
                };
            case "divider":
                return { color: "#e5e7eb", height: 2 };
            case "social":
                return {
                    platforms: [
                        { name: "facebook", url: "https://facebook.com" },
                        { name: "twitter", url: "https://twitter.com" },
                        { name: "instagram", url: "https://instagram.com" },
                    ],
                };
            case "footer":
                return {
                    companyName: "Your Company",
                    address: "123 Main St, City, State 12345",
                    unsubscribeText: "Unsubscribe from this list",
                };
            case "video":
                return {
                    thumbnail: import.meta.env.VITE_BASE_URL + "/storage/products/empty-image.svg",
                    videoUrl: "https://example.com/video.mp4",
                    alt: "Video thumbnail",
                };
            case "columns":
                return {
                    columns: [{ content: "Left column content. Double-click to edit." }, { content: "Right column content. Double-click to edit." }],
                };
            default:
                return {};
        }
    };
    const getDefaultStyles = (type: BlockType): any => {
        const baseStyles = {
            padding: "16px",
            margin: "0px",
        };

        switch (type) {
            case "text":
            case "boxed-text":
                return {
                    ...baseStyles,
                    fontSize: "16px",
                    color: "#F2F2F2",
                    textAlign: "left",
                    lineHeight: "1.5",
                    backgroundColor: type === "boxed-text" ? "#404040" : "transparent",
                    border: type === "boxed-text" ? "1px solid #404040" : "none",
                    borderRadius: type === "boxed-text" ? "8px" : "0px",
                };
            case "button":
                return {
                    ...baseStyles,
                    backgroundColor: "#3B82F6",
                    color: "#ffffff",
                    borderRadius: "6px",
                    textAlign: "center",
                    padding: "12px 24px",
                    display: "inline-block",
                };
            case "image":
            case "image-group":
            case "image-card":
            case "image-text":
            case "video":
                return {
                    ...baseStyles,
                    textAlign: "center",
                };
            case "divider":
                return {
                    ...baseStyles,
                    padding: "8px 16px",
                };
            case "social":
            case "footer":
                return {
                    ...baseStyles,
                    textAlign: "center",
                    backgroundColor: "#f9fafb",
                };
            case "columns":
                return {
                    ...baseStyles,
                    padding: "16px",
                };
            default:
                return baseStyles;
        }
    };
    const updateBlock = (blockId: string, updates: Partial<EmailBlock>) => {
        setBlocks((prev) => prev.map((block) => (block.id === blockId ? { ...block, ...updates } : block)));

        if (selectedBlock?.id === blockId) {
            setSelectedBlock((prev) => (prev ? { ...prev, ...updates } : null));
        }
    };
    const deleteBlock = (blockId: string) => {
        setBlocks((prev) => prev.filter((block) => block.id !== blockId));

        if (selectedBlock?.id === blockId) {
            setSelectedBlock(null);
            setShowPropertiesPanel(false);
        }
    };
    const duplicateBlock = (blockId: string) => {
        const blockToDuplicate = blocks.find((block) => block.id === blockId);
        if (blockToDuplicate) {
            const duplicatedBlock: EmailBlock = {
                ...blockToDuplicate,
                id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            };

            const blockIndex = blocks.findIndex((block) => block.id === blockId);
            const newBlocks = [...blocks];
            newBlocks.splice(blockIndex + 1, 0, duplicatedBlock);
            setBlocks(newBlocks);
        }
    };
    const exportHTML = () => {
        const html = generateHTML(blocks);
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "email-template.html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    const handleImageSelect = (imageSrc: string) => {
        if (selectedImageTarget) {
            const block = blocks.find((b) => b.id === selectedImageTarget.blockId);
            if (block) {
                if (selectedImageTarget.path) {
                    // Handle nested image paths (like image groups)
                    const pathParts = selectedImageTarget.path.split(".");
                    const updatedContent = { ...block.content };
                    let current = updatedContent;

                    for (let i = 0; i < pathParts.length - 1; i++) {
                        current = current[pathParts[i]];
                    }
                    current[pathParts[pathParts.length - 1]] = imageSrc;

                    updateBlock(selectedImageTarget.blockId, { content: updatedContent });
                } else {
                    // Handle simple image replacement
                    updateBlock(selectedImageTarget.blockId, {
                        content: { ...block.content, src: imageSrc },
                    });
                }
            }
            // Keep the library open and target selected for multiple image changes
            // setSelectedImageTarget(null);
            // setShowImageLibrary(false);
        } else {
            console.log("No image target selected");
        }
    };
    const generateHTML = (blocks: EmailBlock[]): string => {
        const blocksHTML = blocks
            .map((block) => {
                switch (block.type) {
                    case "text":
                    case "boxed-text":
                        return `
            <tr>
              <td style="padding: ${block.styles.padding};">
                <div style="
                  color: ${block.styles.color}; 
                  font-size: ${block.styles.fontSize}; 
                  text-align: ${block.styles.textAlign}; 
                  line-height: ${block.styles.lineHeight}; 
                  font-family: Arial, sans-serif;
                  background-color: ${block.styles.backgroundColor};
                  border: ${block.styles.border};
                  border-radius: ${block.styles.borderRadius};
                  padding: ${block.type === "boxed-text" ? "16px" : "0"};
                ">
                  ${block.content.text.replace(/\n/g, "<br>")}
                </div>
              </td>
            </tr>`;
                    case "image":
                        return `
            <tr>
              <td style="padding: ${block.styles.padding}; text-align: ${block.styles.textAlign};">
                <img src="${block.content.src}" alt="${block.content.alt}" style="max-width: ${block.content.width}; height: auto; display: block; margin: 0 auto;" />
              </td>
            </tr>`;
                    case "button":
                        return `
            <tr>
              <td style="padding: ${block.styles.padding}; text-align: center;">
                <table role="presentation" style="margin: 0 auto;">
                  <tr>
                    <td style="background-color: ${block.content.backgroundColor}; border-radius: 6px;">
                      <a href="${block.content.href}" style="color: ${block.content.color}; padding: 12px 24px; text-decoration: none; display: block; font-family: Arial, sans-serif; font-weight: 500;">
                        ${block.content.text}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`;
                    default:
                        return "";
                }
            })
            .join("");

        return `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <title>${titleCreateTemplate}</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
                <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
                    <tr>
                    <td style="padding: 20px 0;">
                        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse;">
                        ${blocksHTML}
                        </table>
                    </td>
                    </tr>
                </table>
            </body>
        </html>`;
    };
    // ✅ Slice data per page
    const paginatedData = customerList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const [searchTermGroup, setSearchTermGroup] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-mailer-group`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [searchTermCustomer, setSearchTermCustomer] = useState(() => {
        const cached = localStorage.getItem(`${tabId}-cached-po-supplier`);
        if (!cached) return "";
        try {
            const meta = JSON.parse(cached);
            return meta.search || "";
        } catch {
            return "";
        }
    });
    const [currentPageCustomer, setCurrentPageCustomer] = useState(() => {
        const metaKey = `${tabId}-cached-po-supplier`;
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
    const [itemsPerPageCustomer, setItemsPerPageCustomer] = useState(() => {
        const metaKey = `${tabId}-cached-po-supplier`;
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
    const formatCurrentDate = () => {
        const date = new Date();
        return date
            .toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
            })
            .replace(/,/g, ""); // remove comma to match "Sep 24 2025"
    };
    const [formData, setFormData] = useState({
        template: null as OptionType | null,
        template2: null as OptionType | null,
        date: formatCurrentDate(), // default to current date
    });
    const templateOptions: OptionType[] = useMemo(
        () =>
            templatesData.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [templatesData, lang]
    );
    const templateOptions1: OptionType[] = useMemo(
        () =>
            templatesData1.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [templatesData1, lang]
    );
    const templateOptions2: OptionType[] = useMemo(
        () =>
            templatesData2.map((list) => ({
                value: list.value.toString(),
                value2: list.value.toString(),
                label: lang === "en" ? list.en : list.cn,
                en: list.en,
                cn: list.cn,
            })),
        [templatesData2, lang]
    );

    useEffect(() => {
        const channel = PusherEcho.channel("mass-mailer-channel");
        channel.listen(".mass-mailer-event", (data: any) => {
            console.log("details", data);
        });
        return () => {
            PusherEcho.leave("mass-mailer-channel");
        };
    }, [tabId]);

    useEffect(() => {
        const handleEsc = (event: any) => {
            if (event.key === "Escape") {
                if (isOpen) {
                    setIsOpen(false);
                }
                if (isOpen2) {
                    setIsOpen2(false);
                }
                if (showChooseTemplate) {
                    setShowChooseTemplate(false);
                }
                if (showGroup) {
                    setShowGroup(false);
                }
                if (showCustomers) {
                    setShowCustomers(false);
                }
                if (showTags) {
                    setShowTags(false);
                }
                if (showSenders) {
                    setShowSender(false);
                }
            }
        };
        window.addEventListener("keydown", handleEsc);
        // Cleanup on unmount
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [isOpen, isOpen2, showChooseTemplate, showGroup, showCustomers, showTags, showSenders]);

    useEffect(() => {
        const fetchDropdownData = async () => {
            fetchGroupList();
            fetchTagList();
            fetchSenderList();
            fetchTemplates();
            fetchTemplates1();
            fetchTemplates2();
            fetchCampaignList();
        };
        fetchDropdownData();
    }, [preorderId]);

    useEffect(() => {
        const productKey = `cached-mass-campaign`;
        const cachedProductsRaw = localStorage.getItem(productKey);
        if (!cachedProductsRaw) {
            fetchCampaignList();
            return;
        } else {
            const cachedProducts = JSON.parse(cachedProductsRaw);
            setCampaignList(cachedProducts);
        }
        fetchCampaignList();
    }, [tabId]);

    useEffect(() => {
        if (preorderId && preorderId > 0) {
            const selectedOption = convertToSingleOption(preorderId, templateOptions1);
            setIframeLayout(preorderId + ".html");
            setTimeout(() => {
                setFormData((prev) => ({
                    ...prev,
                    template: selectedOption,
                }));
            }, 300);
        } else {
            handleClear();
        }
    }, [preorderId, templateOptions1]);

    useEffect(() => {
        fetchCustomers(currentPageCustomer, itemsPerPageCustomer, searchTermCustomer);
    }, [currentPageCustomer, itemsPerPageCustomer, searchTermCustomer, tabId]);

    useEffect(() => {
        const fetchList = async () => {
            try {
                // Force values into numbers
                const newArray = customerGroupList.map((element) => Number(element.value));
                const results = await massMailerService.getCustomerByGroup(newArray);
                setCustomerList(results);
            } catch (error) {
                console.error("Error fetching customers:", error);
            }
        };
        fetchList();
    }, [customerGroupList]);

    const fetchCustomers = async (page = currentPageCustomer, perPage = itemsPerPageCustomer, search = "") => {
        try {
            const paginatedData = await customerService.getAllCustomerEmails(page, perPage, search);
            setCustomers(paginatedData.data);
            setTotalPages_Customer(paginatedData.last_page);
        } catch (err) {
            console.error("Error fetching customers:", err);
        }
    };
    const fetchTagList = async (page = 1, perPage = 50, search = "") => {
        try {
            const paginatedData = await massMailerService.getTags(page, perPage, search);
            setTagList(paginatedData.data);
        } catch (err) {
            console.error("Error fetching list:", err);
        }
    };
    const fetchSenderList = async (page = 1, perPage = 50, search = "") => {
        try {
            const paginatedData = await massMailerService.getSettings(page, perPage, search);
            setSenderList(paginatedData.data);
        } catch (err) {
            console.error("Error fetching list:", err);
        }
    };
    const fetchGroupList = async () => {
        try {
            const list = await fetchCustomerGroups(); // fetches & returns
            setGroupsData(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch fetchGroupList:", err);
        }
    };
    const fetchCampaignList = async () => {
        setLoadingCampaign(true);
        try {
            const list = await massMailerService.getCampaignList();
            setCampaignList(list.campaigns);
            localStorage.setItem(`cached-mass-campaign`, JSON.stringify(list.campaigns));
        } catch (err) {
            console.error("Failed to fetch fetchCampaignList:", err);
        } finally {
            setLoadingCampaign(false);
        }
    };
    const fetchTemplates = async () => {
        try {
            const list = await massMailerService.getAllTemplates(0);
            setTemplates(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch fetchTemplates:", err);
        }
    };
    const fetchTemplates1 = async () => {
        try {
            const list = await massMailerService.getAllTemplates(1);
            setTemplates1(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch fetchTemplates1:", err);
        }
    };
    const fetchTemplates2 = async () => {
        try {
            const list = await massMailerService.getAllTemplates(2);
            setTemplates2(list ?? []); // ✅ manually set state here
        } catch (err) {
            console.error("Failed to fetch fetchTemplates2:", err);
        }
    };
    const handleSelectGroup = (id: number, checked: boolean) => {
        setSelectedGroup((prev) => {
            if (checked) {
                return [...prev, id];
            } else {
                return prev.filter((groupId) => groupId !== id); // ✅ correct variable name
            }
        });
    };
    const handleSelectEmails = (id: number, checked: boolean) => {
        setSelectedEmails((prev) => {
            if (checked) {
                return [...prev, id];
            } else {
                return prev.filter((emailId) => emailId !== id);
            }
        });
    };
    const handleSelectTags = (id: number, checked: boolean) => {
        setSelectedTags((prev) => {
            if (checked) {
                return [...prev, id];
            } else {
                return prev.filter((tagId) => tagId !== id); // ✅ correct comparison
            }
        });
    };
    const handleSelectSingle_TabTags = (id: number, checked: boolean) => {
        // ✅ Multi select (default)
        setSelectTags((prev) => {
            if (checked) {
                return [...prev, id];
            } else {
                return prev.filter((rowId) => rowId !== id);
            }
        });
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = fliteredGroups.map((p: any) => p.value); // ✅ use value for consistency
            setSelectedGroup(allIds);
        } else {
            setSelectedGroup([]);
        }
    };
    const handleSelectAll_Emails = (checked: boolean) => {
        if (checked) {
            const allIds = customers.map((p: any) => p.value); // ✅ use value for consistency
            setSelectedEmails(allIds);
        } else {
            setSelectedEmails([]);
        }
    };
    const handleSelectAll_Tags = (checked: boolean) => {
        if (checked) {
            const allIds = tagList.map((p: any) => p.id); // ✅ use value for consistency
            setSelectedTags(allIds);
        } else {
            setSelectedTags([]);
        }
    };
    const handleSelectAll_TabTags = (checked: boolean) => {
        if (checked) {
            const allIds = tagList.map((p: any) => p.id); // ✅ use value for consistency
            setSelectTags(allIds);
        } else {
            setSelectTags([]);
        }
    };
    const handleSaveGroup = () => {
        // ✅ Get the full checked objects
        const checkedGroups = groupsData.filter((list) => selectedChkGroup.includes(list.value as number));
        setShowGroup(false);
        setCustomerGroupList(checkedGroups);
    };
    const handleSaveEmails = () => {
        // ✅ Get the full checked objects
        const checkedList = customers.filter((list) => selectedChkEmails.includes(list.id as number));
        setShowCustomers(false);
        setCustomerEmailList(checkedList);
    };
    const handleSaveTags = () => {
        // ✅ Get the full checked objects
        const checkedTags = tagList.filter((list) => selectedChkTags.includes(list.id as number));
        setShowTags(false);
        setCustomerTagList(checkedTags);
    };
    const handleSaveSender = (rowId: number) => {
        // ✅ Get the sender object by rowId
        const selectedSender = senderList.find((list) => list.id === rowId);
        if (selectedSender) {
            setShowSender(false);
            setCustomerSenderList([selectedSender]);
        }
    };
    const handleChooseTemplate = () => {
        setIsOpen(true);
        setTemplateId(0);
        setTemplateName("");
        setShowChooseTemplate(false);
        setPopupType("Choose");
        handleGetJson(!formData.template2 ? 0 : Number(formData.template2?.value));
    };
    const handleGetJson = async (templateId: number) => {
        const results = await massMailerService.getMassMailerTemplate(templateId);
        setBlocks(results["data"]["blocks"]);
    };
    const handleSendEmail = async () => {
        const data = new FormData();
        const campaign_name = formData.template;
        if (!campaign_name) {
            showErrorToast(translations["Please select campaign"]);
            return;
        }
        if (customerSenderList.length === 0) {
            showErrorToast(translations["Sender email is required"]);
            return;
        }
        const confirmed = await showConfirm(translations["System Message"], translations["Are you sure you want to continue"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        setLoadingSave(true);
        data.append("group[]", JSON.stringify(customerGroupList));
        data.append("email[]", JSON.stringify(customerEmailList));
        data.append("tag[]", JSON.stringify(customerTagList));
        data.append("sender[]", JSON.stringify(customerSenderList));
        data.append("emails[]", JSON.stringify(customerList));
        data.append("campaign_id", campaign_name.value);
        data.append("date", formData.date);
        try {
            const result = await massMailerService.sendMassMailer(data);
            if (result.token === "Error") {
                setLoadingSave(false);
                showErrorToast(result.message);
                return;
            }
            await localStorage.removeItem("cached-mass-campaign");
            fetchTemplates();
            fetchTemplates2();
            fetchCampaignList();
            handleClear();
            setLoadingSave(false);
            showSuccessToast(translations[result.message] || result.message);
        } catch (error) {}
    };
    const handleClear = () => {
        setCustomerGroupList([]);
        setCustomerEmailList([]);
        setCustomerTagList([]);
        setCustomerSenderList([]);
        setCustomerList([]);
        setIframeLayout("");
        const initialFormData = {
            template: null,
            template2: null,
            date: formatCurrentDate(), // default to current date
        };
        setFormData(initialFormData);
    };
    const handlDeleteTemplate = async () => {
        const template = formData.template;
        const templateId = Number(template?.value || 0);
        if (!template) {
            showErrorToast(translations["Select Campaign"]);
            return;
        }
        const confirmed = await showConfirm(translations["Delete Record"], translations["Are you sure you want to delete this record?"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;

        try {
            const res = await massMailerService.deleteTemplates([templateId]);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            fetchTemplates();
            fetchTemplates2();
            setIframeLayout("");
            const initialFormData = {
                template: null,
                template2: null,
                date: formatCurrentDate(), // default to current date
            };
            setFormData(initialFormData);
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("No Record(s) Has Been Deleted : ", err);
        }
    };
    const handleSelectAll_tabSettings = (checked: boolean) => {
        if (checked) {
            setSelectSettings(senderList.map((p) => p.id).filter(Boolean) as number[]);
        } else {
            setSelectSettings([]);
        }
    };
    const handSelectSingle_tabsSettings = (rowId: number, checked: boolean) => {
        if (checked) {
            setSelectSettings([...selectedSettings, rowId]);
        } else {
            setSelectSettings(selectedSettings.filter((id) => id !== rowId));
        }
    };
    const handSelectSingle_tabsTemplates = (rowId: number, checked: boolean) => {
        if (checked) {
            setSelectTemplates([...selectedTemplates, rowId]);
        } else {
            setSelectTemplates(selectedTemplates.filter((id) => id !== rowId));
        }
    };
    const handlePopup_Senders = (id: number) => {
        if (id === 0) {
            const clearData = {
                id: 0,
                sender_name: "",
                sender_email: "",
                reply_to: "",
            };
            setFormData_Senders(clearData);
        } else {
            const data = senderList.find((item) => item.id === id);
            const initialFormData = {
                id: Number(data?.id),
                sender_name: String(data?.sender_name),
                sender_email: String(data?.sender_email),
                reply_to: String(data?.reply_to),
            };
            setFormData_Senders(initialFormData);
        }
        setShowPopup_Senders(true);
    };
    const handlePopup_Tags = (id: number) => {
        if (id === 0) {
            const clearData = {
                id: 0,
                email_address: "",
            };
            setFormData_Tags(clearData);
        } else {
            const data = tagList.find((item) => item.id === id);
            const initialFormData = {
                id: Number(data?.id),
                email_address: String(data?.email_address),
            };
            setFormData_Tags(initialFormData);
        }
        setShowPopup_Tags(true);
    };
    const handleSavePopup_Senders = async () => {
        const data = new FormData();
        const sender_name = formData_Senders["sender_name"]?.toString().trim() ?? "";
        const sender_email = formData_Senders["sender_email"]?.toString().trim() ?? "";
        const reply_to = formData_Senders["reply_to"]?.toString().trim() ?? "";
        if (!sender_name || sender_name === "") {
            showErrorToast(translations["Sender name is required"] || "Sender email is required");
            return;
        }
        if (sender_email === "") {
            showErrorToast(translations["Sender email is required"] || "Sender email is required");
            return;
        }
        if (reply_to === "") {
            showErrorToast(translations["Reply To is required"] || "Reply To is required");
            return;
        }
        Object.keys(formData_Senders).forEach((key) => {
            let value = formData_Senders[key as keyof typeof formData_Senders];
            if (value !== null && value !== undefined) {
                data.append(key, value.toString());
            }
        });
        setLoadingSave(true);
        try {
            const result = await massMailerService.updateSettings(data);
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            if (result.token === "Warning") {
                showErrorToast(translations[result.message]);
                return;
            }
            fetchSenderList();
            setShowPopup_Senders(false);
            setSelectSettings([]);
            setLoadingSave(false);
            showSuccessToast(translations[result.message] || result.message);
        } catch (error) {
            setLoadingSave(false);
            showErrorToast(translations["Failed to save Transaction."] || "Failed to save Transaction.");
        } finally {
            setLoadingSave(false);
        }
    };
    const handleSavePopup_Tags = async () => {
        const data = new FormData();
        const email_address = formData_Tags["email_address"]?.toString().trim() ?? "";
        if (!email_address || email_address === "") {
            showErrorToast(translations["Email Address is required"] || "Email Address is required");
            return;
        }
        Object.keys(formData_Tags).forEach((key) => {
            let value = formData_Tags[key as keyof typeof formData_Tags];
            if (value !== null && value !== undefined) {
                data.append(key, value.toString());
            }
        });
        setLoadingSave(true);
        try {
            const result = await massMailerService.updateTags(data);
            if (result.token === "Error") {
                showErrorToast(result.message);
                return;
            }
            if (result.token === "Warning") {
                showErrorToast(translations[result.message]);
                return;
            }
            fetchTagList();
            setShowPopup_Tags(false);
            setSelectSettings([]);
            setLoadingSave(false);
            showSuccessToast(translations[result.message] || result.message);
        } catch (error) {
            setLoadingSave(false);
            showErrorToast(translations["Failed to save Transaction."] || "Failed to save Transaction.");
        } finally {
            setLoadingSave(false);
        }
    };
    const handleDeleteSelected_Sender = async () => {
        if (selectedSettings.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const confirmed = await showConfirm(translations["Delete Record"], translations["Are you sure you want to delete this record?"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const res = await massMailerService.deleteSettings(selectedSettings);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            fetchSenderList();
            setSelectSettings([]);
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("No Record(s) Has Been Deleted : ", err);
        }
    };
    const handleDeleteSelected_Tags = async () => {
        if (selectedTags.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const confirmed = await showConfirm(translations["Delete Record"], translations["Are you sure you want to delete this record?"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const res = await massMailerService.deleteTags(selectedTags);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            fetchTagList();
            setSelectSettings([]);
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("No Record(s) Has Been Deleted : ", err);
        }
    };
    const handleDeleteSelected_Template = async () => {
        if (selectedTemplates.length === 0) {
            showErrorToast(translations["Please click checkbox to select row"]);
            return;
        }
        const confirmed = await showConfirm(translations["Delete Record"], translations["Are you sure you want to delete this record?"], translations["Yes"], translations["Cancel"]);
        if (!confirmed) return;
        try {
            const res = await massMailerService.deleteTemplates(selectedTemplates);
            if (res.token === "Error") {
                showErrorToast(res.message);
                return;
            }
            fetchTemplates();
            fetchTemplates2();
            setSelectTemplates([]);
            showSuccessToast(translations["Record has been Deleted"]);
        } catch (err) {
            showErrorToast(translations["alert_message_18"]);
            console.error("No Record(s) Has Been Deleted : ", err);
        }
    };
    const tabs = [
        { id: "information", label: translations["Information"] },
        { id: "settings", label: translations["Settings"] },
    ];
    const menuItems = [
        { key: "Campaigns", label: "Campaigns", icon: <Megaphone className="w-5 h-5 text-cyan-400 flex-shrink-0" /> },
        { key: "Sender", label: "Sender", icon: <MailCheck className="w-5 h-5 text-cyan-400 flex-shrink-0" /> },
        { key: "Templates", label: "Templates", icon: <Folder className="w-5 h-5 text-cyan-400 flex-shrink-0" /> },
        { key: "Tags", label: "Tags", icon: <Tag className="w-5 h-5 text-cyan-400 flex-shrink-0" /> },
    ];
    // 🔹 Filter groupsData based on search term
    const fliteredGroups = groupsData.filter((list) => list.en.toLowerCase().includes(searchTermGroup.toLowerCase()));
    const statusColors: Record<string, { bg: string; text: string }> = {
        draft: { bg: "bg-gray-500", text: "text-gray-400" },
        sent: { bg: "bg-green-500", text: "text-green-400" },
        queued: { bg: "bg-yellow-500", text: "text-yellow-400" },
        suspended: { bg: "bg-red-500", text: "text-red-400" },
        archive: { bg: "bg-blue-500", text: "text-blue-400" },
    };
    const renderMassMailerInfo = () => (
        <div className="p-2 bg-[#19191c] rounded-xl">
            <div className="h-[calc(100vh-180px)] overflow-y-auto pr-2">
                <div className="grid gap-4">
                    {/* Product Code Section */}
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 md:col-span-2">
                            <div className="text-gray-200 space-y-2 mb-2">
                                <div className="bg-transparent border border-[#ffffff1a] rounded-xl shadow-md overflow-hidden">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
                                        <div className="text-gray-200 font-medium text-sm">{translations["Customer Group"]}</div>
                                        <button
                                            className="px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-md"
                                            onClick={() => {
                                                setShowGroup(true);
                                            }}
                                        >
                                            {customerGroupList.length === 0 ? translations["Add"] : translations["Edit"]}
                                        </button>
                                    </div>

                                    {/* Body */}
                                    <div className="px-1 py-2 text-gray-200 space-y-1">
                                        <div className="max-h-[calc(100vh-500px)] overflow-y-auto">
                                            {customerGroupList.length === 0 ? (
                                                <div key={0} className="flex items-center gap-3 px-1 py-1 rounded-md transition-colors">
                                                    <Users className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                                    <span className="flex-1 text-gray-400 text-sm">{translations["No Record Yet"]}</span>
                                                </div>
                                            ) : (
                                                customerGroupList.map((item) => (
                                                    <div key={item.value} className="flex items-center gap-3 px-1 py-1 rounded-md transition-colors">
                                                        <Users className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                                        <span className="flex-1 text-gray-400 text-sm">{lang === "en" ? item.en : item.cn}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-gray-200 space-y-2 mb-2">
                                <div className="bg-transparent border border-[#ffffff1a] rounded-xl shadow-md overflow-hidden">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
                                        <div className="text-gray-200 font-medium text-sm">{translations["Email Address"]}</div>
                                        <button
                                            className="px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-md"
                                            onClick={() => {
                                                setShowCustomers(true);
                                            }}
                                        >
                                            {customerEmailList.length === 0 ? translations["Add"] : translations["Edit"]}
                                        </button>
                                    </div>
                                    {/* Body */}
                                    <div className="px-2 py-2 text-gray-200 space-y-1">
                                        {customerEmailList.length === 0 ? (
                                            <div key={0} className="flex items-center gap-3 px-1 py-1 rounded-md transition-colors">
                                                <Mail className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                                <span className="flex-1 text-gray-400 text-sm">{translations["No Record Yet"]}</span>
                                            </div>
                                        ) : (
                                            customerEmailList.map((item) => (
                                                <div key={item.id} className="flex items-center gap-3 px-1 py-1 rounded-md transition-colors">
                                                    <Mail className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                                    <span className="flex-1 text-gray-400 text-sm">{item.email_address}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-gray-200 space-y-2 mb-2">
                                <div className="bg-transparent border border-[#ffffff1a] rounded-xl shadow-md overflow-hidden">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
                                        <div className="text-gray-200 font-medium text-sm">{translations["Tag"]}</div>
                                        <button
                                            className="px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-md"
                                            onClick={() => {
                                                setShowTags(true);
                                            }}
                                        >
                                            {customerTagList.length === 0 ? translations["Add"] : translations["Edit"]}
                                        </button>
                                    </div>
                                    {/* Body */}
                                    <div className="px-2 py-2 text-gray-200 space-y-1">
                                        {customerTagList.length === 0 ? (
                                            <div key={0} className="flex items-center gap-3 px-1 py-1 rounded-md transition-colors">
                                                <Tag className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                                <span className="flex-1 text-gray-400 text-sm">{translations["No Record Yet"]}</span>
                                            </div>
                                        ) : (
                                            customerTagList.map((item) => (
                                                <div key={item.id} className="flex items-center gap-3 px-1 py-1 rounded-md transition-colors">
                                                    <Tag className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                                    <span className="flex-1 text-gray-400 text-sm">{item.email_address}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-gray-200 space-y-2 mb-2">
                                <div className="bg-transparent border border-[#ffffff1a] rounded-xl shadow-md overflow-hidden">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
                                        <div className="text-gray-200 font-medium text-sm">{translations["Sender Email"]}</div>
                                        <button
                                            className="px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-md"
                                            onClick={() => {
                                                setShowSender(true);
                                            }}
                                        >
                                            {customerSenderList.length === 0 ? translations["Add"] : translations["Edit"]}
                                        </button>
                                    </div>
                                    {/* Body */}
                                    <div className="px-2 py-2 text-gray-200 space-y-2">
                                        {customerSenderList.length === 0 ? (
                                            <div key={0} className="flex flex-col gap-1 px-1 py-2 rounded-md transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Mail className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                                    <span className="flex-1 text-gray-400 text-sm">{translations["No Record Yet"]}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <User className="w-5 h-5 text-green-400 flex-shrink-0" />
                                                    <span className="flex-1 text-gray-400 text-sm">{translations["No Record Yet"]}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Reply className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                                                    <span className="flex-1 text-gray-400 text-sm">{translations["No Record Yet"]}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            customerSenderList.map((item) => (
                                                <div key={item.id} className="flex flex-col gap-1 px-1 py-2 rounded-md transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <Mail className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                                        <span className="flex-1 text-gray-400 text-sm">{item.sender_email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <User className="w-5 h-5 text-green-400 flex-shrink-0" />
                                                        <span className="flex-1 text-gray-400 text-sm">{item.sender_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Reply className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                                                        <span className="flex-1 text-gray-400 text-sm">{item.reply_to}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-12 md:col-span-3">
                            <div className="text-gray-200 space-y-2 mb-2">
                                <div className="bg-transparent border border-[#ffffff1a] rounded-xl shadow-md overflow-hidden">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
                                        <div className="text-gray-200 font-medium text-sm">{translations["Customer"]}</div>
                                        <button
                                            className="px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-md"
                                            onClick={() => {
                                                setShowGroup(true);
                                            }}
                                        >
                                            {customerGroupList.length === 0 ? translations["Add"] : translations["Edit"]}
                                        </button>
                                    </div>
                                    {/* Body */}
                                    <div className={`${customerList.length === 0 ? "px-1 py-2 text-gray-200 space-y-1" : "px-4 py-4 rounded-lg shadow space-y-4"}`}>
                                        <div className="space-y-2">
                                            {customerList.length === 0 ? (
                                                <div className="flex items-center gap-3 px-1 py-1 rounded-md transition-colors">
                                                    <User className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                                    <span className="flex-1 text-gray-400 text-sm">{translations["No Record Yet"]}</span>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* ✅ List of customers (only current page) */}
                                                    {paginatedData.map((item: any, index: number) => (
                                                        <div key={`${item.id}-${index}`} className="flex gap-3 items-start px-1 py-1 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
                                                            {/* Thumbnail / Icon */}
                                                            <div className="flex-shrink-0">
                                                                <User className="w-8 h-8 text-cyan-400" />
                                                            </div>
                                                            {/* Content */}
                                                            <div className="flex-1">
                                                                <h3 className="text-sm font-semibold text-gray-200">
                                                                    {item.customer_code} - {lang === "en" ? item.account_name_en : item.account_name_cn}
                                                                </h3>
                                                                <p className="text-sm text-gray-400 truncate">{item.email_address}</p>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* ✅ Pagination Controls */}
                                                    {totalPages > 1 && (
                                                        <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                                                            <button
                                                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                                                disabled={currentPage === 1}
                                                                className="px-3 py-1 text-sm rounded-md bg-gray-700 text-gray-200 disabled:opacity-50"
                                                            >
                                                                {translations["Prev"]}
                                                            </button>
                                                            <span className="text-sm text-gray-400">
                                                                {translations["Page"] || "Page"} {currentPage} of {totalPages}
                                                            </span>
                                                            <button
                                                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                                                disabled={currentPage === totalPages}
                                                                className="px-3 py-1 text-sm rounded-md bg-gray-700 text-gray-200 disabled:opacity-50"
                                                            >
                                                                {translations["Next"]}
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-12 md:col-span-7">
                            <div className="text-gray-200 space-y-2 mb-2">
                                <div className="bg-transparent border border-[#ffffff1a] rounded-xl shadow-md overflow-hidden">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
                                        {/* Left side - Date & Campaign */}
                                        <div className="flex gap-4 flex-1">
                                            {/* Date Input */}
                                            <div className="flex flex-col w-1/3">
                                                <input
                                                    type="text"
                                                    value={formData.date}
                                                    readOnly
                                                    className="bg-gray-800 text-teal-400 text-sm px-3 py-2 rounded-md w-full focus:outline-none cursor-default"
                                                />
                                            </div>

                                            {/* Campaign Select */}
                                            <div className="flex flex-col w-2/3">
                                                <Select
                                                    classNamePrefix="react-select"
                                                    value={formData.template ?? null}
                                                    onChange={async (selected) => {
                                                        setIframeLayout(selected ? selected.value + ".html" : "");
                                                        setFormData({ ...formData, template: selected as OptionType | null });
                                                    }}
                                                    options={templateOptions}
                                                    styles={{
                                                        ...selectStyles,
                                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                    }}
                                                    className="w-[100%]"
                                                    placeholder={translations["Select Campaign"]}
                                                    menuPlacement="auto"
                                                    menuPosition="fixed"
                                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                                />
                                            </div>
                                        </div>

                                        {/* Right side - Buttons */}
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => {
                                                    if (!formData.template) {
                                                        showErrorToast(translations["Select Campaign"]);
                                                        return;
                                                    }
                                                    setIsOpen(true);
                                                    setPopupType("Edit");
                                                    setTemplateId(!formData.template ? 0 : Number(formData.template?.value));
                                                    setTemplateName(!formData.template ? "" : formData.template?.label);
                                                    setTitleCreateTemplate(translations["Edit Template"]);
                                                    handleGetJson(!formData.template ? 0 : Number(formData.template?.value));
                                                }}
                                                className="px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-md"
                                            >
                                                {translations["Edit Mass Mailer"]}
                                            </button>
                                            <button onClick={handlDeleteTemplate} className="px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-700 text-[#ffffffcc] text-custom-sm rounded-md">
                                                {translations["Delete"]}
                                            </button>
                                        </div>
                                    </div>
                                    {/* Body */}
                                    <div
                                        className="px-0 py-0 text-gray-200 space-y-1 overflow-auto"
                                        style={{
                                            maxHeight: "700px",
                                            borderRadius: "4px",
                                            position: "relative",
                                            width: "100%",
                                            height: "calc(100vh - 179px)",
                                            backgroundImage: `url(${import.meta.env.VITE_BASE_URL}/storage/products/bg.png)`,
                                        }}
                                    >
                                        <iframe
                                            src={iframeLayout ? `${import.meta.env.VITE_BASE_URL}/storage/products/templates/layout/${iframeLayout}` : undefined}
                                            id="iframe_layout"
                                            frameBorder="0"
                                            width="100%"
                                            height="100%"
                                            className="rounded"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    const renderContent = () => {
        switch (activeMenu) {
            case "Campaigns":
                return renderTab_Campaign();
            case "Sender":
                return renderTab_Sender();
            case "Templates":
                return renderTab_Templates();
            case "Tags":
                return renderTab_Tags();
            default:
                return <div className="text-white">Select a menu item</div>;
        }
    };
    const renderTab_Campaign = () => (
        <div
            className="rounded-lg border shadow-lg"
            style={{ backgroundColor: "#19191c", borderColor: "#2a2a2d", boxShadow: "0 10px 25px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)" }}
        >
            <div className="overflow-x-auto flex-grow">
                {/* Header - Hidden on mobile, shown on larger screens */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 border-b border-gray-700 text-gray-400 text-sm font-medium">
                    <div className="col-span-4">Campaign</div>
                    <div className="col-span-1 text-center">Recipients</div>
                    <div className="col-span-1 text-center">Opens</div>
                    <div className="col-span-1 text-center">Clicks</div>
                    <div className="col-span-1 text-center">Unsubscribed</div>
                    <div className="col-span-2"></div>
                    <div className="col-span-1"></div>
                </div>

                {/* Campaign List */}
                <div className="divide-y divide-gray-700">
                    {loadingCampaign ? (
                        <div
                            className="p-4 mt-2 hover:bg-gray-800/50 transition-colors border border-gray-700/50 rounded-lg mb-2 mx-2 shadow-md text-center"
                            style={{ backgroundColor: "#1f1f23", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)" }}
                        >
                            {translations["Loading"] || "Loading"}...
                        </div>
                    ) : campaignList.length === 0 ? (
                        <div
                            className="p-4 mt-2 border border-gray-700/50 rounded-lg mb-2 mx-2 shadow-md text-center"
                            style={{ backgroundColor: "#1f1f23", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)" }}
                        >
                            <p className="text-gray-400">{translations["Brevo restrict too much request"] || "Brevo restrict too much request"}</p>
                        </div>
                    ) : (
                        campaignList.map((campaign: any) => {
                            const colors = statusColors[campaign.status?.toLowerCase()] || { bg: "bg-gray-500", text: "text-gray-400" };

                            return (
                                <div
                                    key={campaign.id}
                                    className="p-4 mt-2 hover:bg-gray-800/50 transition-colors border border-gray-700/50 rounded-lg mb-2 mx-2 shadow-md"
                                    style={{ backgroundColor: "#1f1f23", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)" }}
                                >
                                    <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                                        <div className="col-span-4">
                                            <div className="flex items-start space-x-3">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-white font-medium text-md mb-1 line-clamp-2">{campaign.title}</h3>
                                                    <div className="text-gray-400 text-xs space-y-1">
                                                        <div className="flex items-center space-x-2">
                                                            <div className={`${colors.bg} w-2 h-2 rounded-full flex-shrink-0`}></div>
                                                            <span className={`${colors.text} text-xs`}>{campaign.status}</span>
                                                            {campaign.status === "sent" && <span>Sent on {campaign.sentDate}</span>}
                                                        </div>
                                                        <div className="text-gray-500">#{campaign.id}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-span-1 text-center">
                                            <div className="text-white font-medium">{campaign.recipients}</div>
                                            <div className="text-gray-400 text-xs">100%</div>
                                        </div>
                                        <div className="col-span-1 text-center">
                                            <div className="text-white font-medium">{campaign.opens}</div>
                                            <div className="text-gray-400 text-xs">{campaign.openRate}</div>
                                        </div>
                                        <div className="col-span-1 text-center">
                                            <div className="text-white font-medium">{campaign.clicks}</div>
                                            <div className="text-gray-400 text-xs">{campaign.clickRate}</div>
                                        </div>
                                        <div className="col-span-1 text-center">
                                            <div className="text-white font-medium">{campaign.unsubscribed}</div>
                                            <div className="text-gray-400 text-xs">{campaign.unsubRate}</div>
                                        </div>
                                        <div className="col-span-2 flex justify-end space-x-2">
                                            <button className="p-1 hover:bg-gray-700 rounded transition-colors">{translations["Report"]}</button>
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <button className="p-1 hover:bg-gray-700 rounded transition-colors">{translations["Action"]}</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
    const renderTab_Sender = () => (
        <div className="rounded-lg border shadow-sm" style={{ backgroundColor: "#19191c", borderColor: "#19191c" }}>
            <div className="overflow-x-auto flex-grow">
                <div className="h-[calc(100vh-255px)] overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                <th className="w-[5%] text-left py-1 px-2 text-gray-400 text-sm w-12">
                                    <CustomCheckbox
                                        checked={selectedSettings.length === senderList.length && senderList.length > 0}
                                        onChange={(checked) => handleSelectAll_tabSettings(checked)}
                                        ariaLabel="Select all products"
                                    />
                                </th>
                                <th className="w-[30%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Sender Name"]}</th>
                                <th className="w-[30%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Sender Email"]}</th>
                                <th className="w-[30%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Reply To"]}</th>
                                <th className="w-[5%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Action"]}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {senderList.length === 0 ? (
                                <tr>
                                    <td colSpan={14} className="py-4 px-4 text-center text-gray-400 text-sm border border-[#40404042]">
                                        {translations["No Record Found"] || "No Record Found"}
                                    </td>
                                </tr>
                            ) : (
                                senderList.map((list, index) => (
                                    <React.Fragment key={list.id || index}>
                                        <tr
                                            key={list.id || index}
                                            className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors ${
                                                selectedSettings.includes(list.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                            }`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                <CustomCheckbox
                                                    checked={selectedSettings.includes(list.id as number)}
                                                    onChange={(checked) => handSelectSingle_tabsSettings(list.id as number, checked)}
                                                />
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.sender_name}</td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.sender_email}</td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.reply_to}</td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={() => handlePopup_Senders(list.id)}
                                                    className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700"
                                                >
                                                    <span>{translations["Edit"]}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
    const renderTab_Templates = () => (
        <div className="rounded-lg border shadow-sm" style={{ backgroundColor: "#19191c", borderColor: "#19191c" }}>
            <div className="overflow-x-auto flex-grow">
                <div className="h-[calc(100vh-255px)] overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                <th className="w-[5%] text-left py-1 px-2 text-gray-400 text-sm w-12">
                                    <CustomCheckbox
                                        checked={selectedTemplates.length === templatesData2.length && templatesData2.length > 0}
                                        onChange={(checked) => handleSelectAll(checked)}
                                        ariaLabel="Select all products"
                                    />
                                </th>
                                <th className="w-[35%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Template"]}</th>
                                <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Date Added"]}</th>
                                <th className="w-[20%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Date Updated"]}</th>
                                <th className="w-[20%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Action"]}</th>
                            </tr>
                        </thead>

                        <tbody>
                            {templatesData2.length === 0 ? (
                                <tr>
                                    <td colSpan={14} className="py-4 px-4 text-center text-gray-400 text-sm border border-[#40404042]">
                                        {translations["No Record Found"] || "No Record Found"}
                                    </td>
                                </tr>
                            ) : (
                                templatesData2.map((list, index) => (
                                    <React.Fragment key={list.value || index}>
                                        <tr
                                            key={list.value || index}
                                            className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors ${
                                                selectedTemplates.includes(list.value as number) ? "bg-gray-700 bg-opacity-30" : ""
                                            }`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                <CustomCheckbox
                                                    checked={selectedTemplates.includes(list.value as number)}
                                                    onChange={(checked) => handSelectSingle_tabsTemplates(list.value as number, checked)}
                                                />
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.en}</td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.created_at}</td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.updated_at}</td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsOpen(true);
                                                        setPopupType("New");
                                                        setTemplateId(0);
                                                        setTemplateName("");
                                                        setTitleCreateTemplate(translations["Apply Template"] || "Apply Template");
                                                        handleGetJson(list.value as number);
                                                    }}
                                                    className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700 mr-2"
                                                >
                                                    <span>{translations["Apply"] || "Apply"}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsOpen(true);
                                                        setPopupType("Edit");
                                                        setTemplateId(list.value as number);
                                                        setTemplateName(list.en);
                                                        setTitleCreateTemplate(translations["Edit Template"]);
                                                        handleGetJson(list.value as number);
                                                    }}
                                                    className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700 mr-2"
                                                >
                                                    <span>{translations["Edit"]}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const version = Date.now(); // current timestamp
                                                        setIsOpen2(true);
                                                        setTitleCreateTemplate(list.en);
                                                        setIframeLayout2(list.value + ".html?v=" + version);
                                                    }}
                                                    className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700 mr-2"
                                                >
                                                    <span>{translations["View"]}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
    const renderTab_Tags = () => (
        <div className="rounded-lg border shadow-sm" style={{ backgroundColor: "#19191c", borderColor: "#19191c" }}>
            <div className="overflow-x-auto flex-grow">
                <div className="h-[calc(100vh-255px)] overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                            <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                <th className="w-[5%] text-left py-1 px-2 text-gray-400 text-sm w-12">
                                    <CustomCheckbox checked={selectedTags.length === tagList.length && tagList.length > 0} onChange={(checked) => handleSelectAll_TabTags(checked)} />
                                </th>
                                <th className="w-[30%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Email"]}</th>
                                <th className="w-[30%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Date Added"]}</th>
                                <th className="w-[30%] text-left py-2 px-2 text-gray-400 text-sm">{translations["Date Updated"]}</th>
                                <th className="w-[5%] text-center py-2 px-2 text-gray-400 text-sm">{translations["Action"]}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tagList.length === 0 ? (
                                <tr>
                                    <td colSpan={14} className="py-4 px-4 text-center text-gray-400 text-sm border border-[#40404042]">
                                        {translations["No Record Found"] || "No Record Found"}
                                    </td>
                                </tr>
                            ) : (
                                tagList.map((list, index) => (
                                    <React.Fragment key={list.id || index}>
                                        <tr
                                            key={list.id || index}
                                            className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors ${
                                                selectedTags.includes(list.id as number) ? "bg-gray-700 bg-opacity-30" : ""
                                            }`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                <CustomCheckbox checked={selectedTags.includes(list.id as number)} onChange={(checked) => handleSelectSingle_TabTags(list.id as number, checked)} />
                                            </td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.email_address}</td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.created_at}</td>
                                            <td className="py-2 px-2 text-gray-400 text-left text-custom-sm">{list.updated_at}</td>
                                            <td className="py-2 px-2 text-gray-400 text-center text-custom-sm" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={() => handlePopup_Tags(list.id)}
                                                    className="px-1 py-1 text-white rounded-lg transition-colors text-sm bg-cyan-600 hover:bg-cyan-700"
                                                >
                                                    <span>{translations["Edit"]}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
    const renderMassMailerSettings = () => (
        <div className="flex h-full bg-[#19191c] rounded-xl overflow-hidden">
            {/* Vertical Menu - Left Side */}
            <aside className="w-64 bg-[#1f1f23] border-r border-[#2d2d30] p-4">
                <div className="text-white text-lg font-bold mb-6">Mailer Setting</div>
                <nav>
                    <ul className="space-y-2 text-gray-300">
                        {menuItems.map((item) => (
                            <li
                                key={item.key}
                                onClick={() => setActiveMenu(item.key)}
                                className={`flex items-center space-x-2 px-3 py-2 rounded cursor-pointer transition ${activeMenu === item.key ? "bg-cyan-700 text-white" : "hover:bg-[#2d2d30]"}`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
            <div className="flex-1 p-2 overflow-auto">
                <div className="h-[calc(100vh-180px)] overflow-y-auto pr-2">
                    <div className="grid gap-4">
                        <main className="flex-1 p-0 overflow-auto bg-[#19191c]">{renderContent()}</main>
                    </div>
                </div>
            </div>
        </div>
    );
    const renderCustomerGroup = () => {
        if (!showGroup) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[20vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white"></h2>
                            <h2 className="text-xl font-bold text-white">{translations["Customer Group"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowGroup(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="p-2 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="search"
                                        placeholder={translations["Search"]}
                                        value={searchTermGroup}
                                        onChange={(e) => {
                                            setSearchTermGroup(e.target.value);
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
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">
                                            <div className="flex items-center justify-center">
                                                <CustomCheckbox
                                                    checked={selectedChkGroup.length === fliteredGroups.length && fliteredGroups.length > 0}
                                                    onChange={(checked) => handleSelectAll(checked)}
                                                />
                                            </div>
                                        </th>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Customer Group"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fliteredGroups.map((list, index) => (
                                        <tr
                                            key={list.value || index}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center">
                                                    <CustomCheckbox
                                                        checked={selectedChkGroup.includes(list.value as number)}
                                                        onChange={(checked) => handleSelectGroup(list.value as number, checked)}
                                                    />
                                                </div>
                                            </td>

                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.en : list.cn}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-3 border-t border-[#ffffff1a] flex justify-end space-x-2">
                        <button onClick={() => setShowGroup(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button onClick={handleSaveGroup} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition">
                            {translations["Save"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    const renderTagList = () => {
        if (!showTags) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[20vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white"></h2>
                            <h2 className="text-xl font-bold text-white">{translations["Tag"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowTags(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="p-2 flex-1 overflow-auto">
                        <div className="max-h-[calc(100vh-435px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">
                                            <div className="flex items-center justify-center">
                                                <CustomCheckbox checked={selectedChkTags.length === tagList.length && tagList.length > 0} onChange={(checked) => handleSelectAll_Tags(checked)} />
                                            </div>
                                        </th>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Email Address"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tagList.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center">
                                                    <CustomCheckbox checked={selectedChkTags.includes(list.id as number)} onChange={(checked) => handleSelectTags(list.id as number, checked)} />
                                                </div>
                                            </td>

                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.email_address}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-3 border-t border-[#ffffff1a] flex justify-end space-x-2">
                        <button onClick={() => setShowTags(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button onClick={handleSaveTags} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition">
                            {translations["Save"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    const renderSenderList = () => {
        if (!showSenders) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[40vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white"></h2>
                            <h2 className="text-xl font-bold text-white">{translations["Sender"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowSender(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="p-2 flex-1 overflow-auto">
                        <div className="max-h-[calc(100vh-435px)] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-[1]" style={{ backgroundColor: "#1f2132" }}>
                                    <tr className="border-b" style={{ borderColor: "#2d2d30" }}>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Sender Email"]}</th>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Sender Name"]}</th>
                                        <th className=" text-left py-2 px-4 text-gray-400 text-sm">{translations["Reply To"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {senderList.map((list, index) => (
                                        <tr
                                            key={list.id || index}
                                            onClick={() => handleSaveSender(list.id)}
                                            className={`clickable border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors cursor-pointer`}
                                            style={{ borderColor: "#40404042" }}
                                        >
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.sender_email}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.sender_name}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.reply_to}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-3 border-t border-[#ffffff1a] flex justify-end space-x-2">
                        <button onClick={() => setShowSender(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    const renderCustomerList = () => {
        if (!showCustomers) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[40vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white">{translations["Search Customer"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowCustomers(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="p-2 border-b flex-shrink-0" style={{ borderColor: "#404040" }}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="search"
                                        placeholder={translations["Search"]}
                                        value={searchTermCustomer}
                                        onChange={(e) => {
                                            setSearchTermCustomer(e.target.value);
                                            setCurrentPageCustomer(1);
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
                                        <th className="w-[3%] text-left py-2 px-4 text-gray-400 text-sm">
                                            <div className="flex items-center justify-center">
                                                <CustomCheckbox
                                                    checked={selectedChkEmails.length === customers.length && customers.length > 0}
                                                    onChange={(checked) => handleSelectAll_Emails(checked)}
                                                />
                                            </div>
                                        </th>
                                        <th className="w-[27%]  text-left py-2 px-4 text-gray-400 text-sm">{translations["Customer Code"]}</th>
                                        <th className="w-[35%]  text-left py-2 px-4 text-gray-400 text-sm">{translations["Customer Name"]}</th>
                                        <th className="w-[35%]  text-left py-2 px-4 text-gray-400 text-sm">{translations["Email"]}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map((list, index) => (
                                        <tr key={list.id || index} className={`border-b hover:bg-gray-700 hover:bg-opacity-30 transition-colors`} style={{ borderColor: "#40404042" }}>
                                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center">
                                                    <CustomCheckbox checked={selectedChkEmails.includes(list.id as number)} onChange={(checked) => handleSelectEmails(list.id as number, checked)} />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.customer_code}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{lang === "en" ? list.account_name_en : list.account_name_cn}</td>
                                            <td className="py-3 px-4 text-gray-400 text-left text-custom-sm">{list.email_address || translations["N.A."]}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Footer with Pagination */}
                    <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "#404040" }}>
                        <div className="flex items-center space-x-1">
                            <MemoizedPagination currentPage={currentPageCustomer} totalPages={totalPagesCustomer} onPageChange={(page) => setCurrentPageCustomer(page)} />
                            <MemoizedItemsPerPageSelector
                                value={itemsPerPageCustomer}
                                onChange={(val: number) => {
                                    setItemsPerPageCustomer(val);
                                    setCurrentPageCustomer(1);
                                }}
                                options={pageSizeOptions}
                            />
                        </div>
                        <div className="flex items-center space-x-1">
                            <button onClick={() => setShowCustomers(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                                {translations["Close"]}
                            </button>
                            <button onClick={handleSaveEmails} className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition">
                                {translations["Save"]}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    const renderChooseTemplate = () => {
        if (!showChooseTemplate) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[30vw] max-h-[80vh] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ffffff1a]">
                        <h2 className="text-xl font-bold text-white">{translations["Choose Template"]}</h2>
                        <button
                            onClick={() => setShowChooseTemplate(false)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            aria-label={translations["Close"]}
                        >
                            <X className="h-6 w-6 text-white" />
                        </button>
                    </div>
                    {/* Content */}
                    <div className="grid grid-cols-12 gap-4 p-4">
                        {/* First Row: Sort By, Customer Code */}
                        <div className="col-span-12 md:col-span-12">
                            <label className="text-gray-400 text-sm">{translations["Customer Code"]}</label>
                            <Select
                                classNamePrefix="react-select"
                                value={formData.template2 ?? null}
                                onChange={async (selected) => {
                                    setFormData({ ...formData, template2: selected as OptionType | null });
                                }}
                                options={templateOptions2}
                                styles={{
                                    ...selectStyles,
                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                }}
                                className="w-[100%]"
                                menuPlacement="auto"
                                menuPosition="fixed"
                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                            />
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-[#ffffff1a] flex justify-end space-x-1">
                        <button
                            onClick={() => setShowChooseTemplate(false)}
                            className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {translations["Close"]}
                        </button>
                        <button
                            onClick={() => handleChooseTemplate()}
                            className="px-2 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {translations["Choose"]}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    const renderPopup_Senders = () => {
        if (!showPopup_Senders) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[30vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white"></h2>
                            <h2 className="text-xl font-bold text-white">{translations["Sender"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowPopup_Senders(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="p-2 flex-1 overflow-auto">
                        <div className="max-h-[calc(100vh-435px)] overflow-y-auto">
                            <div className="grid grid-cols-12 gap-4 p-4">
                                <div className="col-span-12 flex flex-col">
                                    <label className="text-gray-400 text-sm mb-1">{translations["Sender Name"]}</label>
                                    <input
                                        type="text"
                                        value={formData_Senders.sender_name}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData_Senders((prev) => ({ ...prev, sender_name: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="col-span-12 flex flex-col">
                                    <label className="text-gray-400 text-sm mb-1">{translations["Sender Email"]}</label>
                                    <input
                                        type="text"
                                        hidden={lang === "cn"}
                                        value={formData_Senders.sender_email}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData_Senders((prev) => ({ ...prev, sender_email: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                                <div className="col-span-12 flex flex-col">
                                    <label className="text-gray-400 text-sm mb-1">{translations["Reply To"]}</label>
                                    <input
                                        type="text"
                                        hidden={lang === "cn"}
                                        value={formData_Senders.reply_to}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData_Senders((prev) => ({ ...prev, reply_to: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-3 border-t border-[#ffffff1a] flex justify-end space-x-2">
                        <button onClick={() => setShowPopup_Senders(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button
                            onClick={handleSavePopup_Senders}
                            className={`px-4 py-2 text-custom-sm rounded-lg text-sm font-medium transition-colors 
                            ${loadingSave ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                            text-[#ffffffcc] flex justify-center items-center`}
                            disabled={loadingSave}
                        >
                            {loadingSave ? (
                                <>
                                    <div className="loader mr-2"></div>
                                    <span>{translations["Processing2"]}...</span>
                                </>
                            ) : (
                                <span>{translations["Save"]}</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    const renderPopup_Tags = () => {
        if (!showPopup_Tags) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#19191c] rounded-xl border border-[#ffffff1a] w-[30vw] h-auto flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-[#ffffff1a]">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-white"></h2>
                            <h2 className="text-xl font-bold text-white">{translations["Tags"]}</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setShowPopup_Tags(false);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="p-2 flex-1 overflow-auto">
                        <div className="max-h-[calc(100vh-435px)] overflow-y-auto">
                            <div className="grid grid-cols-12 gap-4 p-4">
                                <div className="col-span-12 flex flex-col">
                                    <label className="text-gray-400 text-sm mb-1">{translations["Sender Name"]}</label>
                                    <input
                                        type="text"
                                        value={formData_Tags.email_address}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData_Tags((prev) => ({ ...prev, email_address: value }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#ffffff1a] bg-transparent text-[#ffffffcc] text-custom-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-3 border-t border-[#ffffff1a] flex justify-end space-x-2">
                        <button onClick={() => setShowPopup_Tags(false)} className="px-2 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition">
                            {translations["Close"]}
                        </button>
                        <button
                            onClick={handleSavePopup_Tags}
                            className={`px-4 py-2 text-custom-sm rounded-lg text-sm font-medium transition-colors 
                            ${loadingSave ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                            text-[#ffffffcc] flex justify-center items-center`}
                            disabled={loadingSave}
                        >
                            {loadingSave ? (
                                <>
                                    <div className="loader mr-2"></div>
                                    <span>{translations["Processing2"]}...</span>
                                </>
                            ) : (
                                <span>{translations["Save"]}</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    return (
        <div className="h-screen flex flex-col" style={{ backgroundColor: "#1a1a1a" }}>
            {/* Fixed Header */}
            <div className="border-b flex-shrink-0" style={{ backgroundColor: "#19191c", borderColor: "#ffffff1a" }}>
                <div className="flex items-center justify-between px-2 py-3">
                    <div className="flex items-center space-x-4">
                        {/* Tabs */}
                        <div className="flex space-x-1">
                            <button
                                onClick={() => {
                                    onBack();
                                }}
                                style={{ backgroundColor: "#2b2e31" }}
                                className="px-2 py-2 rounded-lg text-sm font-medium transition-colors text-gray-300 hover:bg-gray-700"
                            >
                                <ArrowLeft className="h-5 w-5 text-[#ffffffcc] text-custom-sm" />
                            </button>
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        activeTab === tab.id ? "bg-cyan-600 text-[#ffffffcc] text-custom-sm" : "text-gray-300 hover:bg-gray-700"
                                    }`}
                                    style={activeTab !== tab.id ? { backgroundColor: "#2b2e31" } : {}}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Action Buttons */}
                    {activeTab === "information" && (
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={handleSendEmail}
                                className={`px-4 py-2 text-custom-sm rounded-lg text-sm font-medium transition-colors 
                            ${loadingSave ? "bg-gray-500 cursor-not-allowed opacity-50" : "bg-cyan-600 hover:bg-cyan-700"} 
                            text-[#ffffffcc] flex justify-center items-center`}
                                disabled={loadingSave}
                            >
                                {loadingSave ? (
                                    <>
                                        <div className="loader mr-2"></div>
                                        <span>{translations["Processing2"]}...</span>
                                    </>
                                ) : (
                                    <span>{translations["Send"]}</span>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setIsOpen(true);
                                    setPopupType("New");
                                    setTemplateId(0);
                                    setTemplateName("");
                                    handleGetJson(0);
                                    setTitleCreateTemplate(translations["Create Template"]);
                                }}
                                className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors"
                            >
                                {translations["Create Template"]}
                            </button>
                            <button
                                onClick={() => {
                                    setShowChooseTemplate(true);
                                }}
                                className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors"
                            >
                                {translations["Choose Template"]}
                            </button>
                            <button onClick={handleClear} className="px-2 py-2 bg-red-600 hover:bg-red-700 text-[#ffffffcc] text-custom-sm rounded-lg text-sm font-medium transition-colors">
                                {translations["Clear"]}
                            </button>
                        </div>
                    )}
                    {activeTab != "information" && (
                        <div className="flex items-center space-x-1">
                            {activeMenu === "Sender" && (
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => handlePopup_Senders(0)}
                                        className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                    >
                                        <span>{translations["Add New"]}</span>
                                    </button>
                                    <button
                                        disabled={selectedSettings.length === 0}
                                        onClick={handleDeleteSelected_Sender}
                                        className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                    >
                                        <span>{translations["Delete"]}</span>
                                    </button>
                                </div>
                            )}
                            {activeMenu === "Templates" && (
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => {
                                            setIsOpen(true);
                                            setPopupType("Template");
                                            setTemplateId(0);
                                            setTemplateName("");
                                            handleGetJson(0);
                                            setTitleCreateTemplate(translations["Create Template"]);
                                        }}
                                        className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                    >
                                        <span>{translations["Add New"]}</span>
                                    </button>
                                    <button
                                        disabled={selectedTemplates.length === 0}
                                        onClick={handleDeleteSelected_Template}
                                        className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                    >
                                        <span>{translations["Delete"]}</span>
                                    </button>
                                </div>
                            )}
                            {activeMenu === "Tags" && (
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => handlePopup_Tags(0)}
                                        className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                    >
                                        <span>{translations["Add New"]}</span>
                                    </button>
                                    <button
                                        disabled={selectedTags.length === 0}
                                        onClick={handleDeleteSelected_Tags}
                                        className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                    >
                                        <span>{translations["Delete"]}</span>
                                    </button>
                                </div>
                            )}
                            {activeMenu === "Campaigns" && (
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => {
                                            localStorage.removeItem("cached-mass-campaign");
                                            setTimeout(() => {
                                                fetchCampaignList();
                                            }, 300);
                                        }}
                                        className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-1 text-sm"
                                    >
                                        <span>{translations["Refresh"]}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Main Content - Scrollable */}
            <div className="flex flex-1 p-2 mb-[80px]" style={{ backgroundColor: "#19191c" }}>
                {/* Main Content Area - Scrollable */}
                <div className="flex-1 overflow-auto mb-[80px]">
                    {activeTab === "information" && renderMassMailerInfo()}
                    {activeTab === "settings" && renderMassMailerSettings()}
                </div>
            </div>
            {renderCustomerGroup()}
            {renderCustomerList()}
            {renderTagList()}
            {renderSenderList()}
            {renderChooseTemplate()}
            {renderPopup_Senders()}
            {renderPopup_Tags()}
            {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={closeMenu} />}

            {/* Off-Canvas Panel - left Side */}
            <div className={`fixed top-0 left-0 w-[100%] h-full bg-white shadow-lg z-70 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="overflow-x-auto flex-grow">
                    <div className="h-[calc(100vh)] overflow-y-auto">
                        <div className={darkMode ? "dark" : ""}>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                                <div className="h-screen bg-gray-50 flex flex-col" style={{ backgroundColor: darkMode ? "#19191c" : undefined }}>
                                    <Toolbar
                                        previewMode={previewMode}
                                        title={titleCreateTemplate}
                                        setPreviewMode={setPreviewMode}
                                        onExportJSON={exportJSON}
                                        onPopupType={popupType}
                                        onTemplateId={templateId}
                                        isOpen={() => setIsOpen(false)} // ✅ CORRECT
                                        onExport={exportHTML}
                                        showPropertiesPanel={showPropertiesPanel}
                                        setShowPropertiesPanel={setShowPropertiesPanel}
                                        blocksCount={blocks.length}
                                        darkMode={darkMode}
                                        setDarkMode={setDarkMode}
                                        showImageLibrary={showImageLibrary}
                                        setShowImageLibrary={setShowImageLibrary}
                                    />

                                    <div className="flex flex-1 min-h-0">
                                        <Sidebar onAddBlock={addBlock} />

                                        <div className="flex-1 flex flex-col min-h-0">
                                            {/* Email Subject Input */}
                                            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                                                <div className="max-w-4xl mx-auto">
                                                    <input
                                                        type="text"
                                                        value={templateName}
                                                        onChange={(e) => setTemplateName(e.target.value)}
                                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                                                        placeholder={translations["Template Name"]}
                                                    />
                                                </div>
                                            </div>

                                            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                                                <Canvas
                                                    blocks={blocks}
                                                    selectedBlock={selectedBlock}
                                                    setSelectedBlock={setSelectedBlock}
                                                    updateBlock={updateBlock}
                                                    deleteBlock={deleteBlock}
                                                    duplicateBlock={duplicateBlock}
                                                    previewMode={previewMode}
                                                    onBlockSelect={(block) => {
                                                        setSelectedBlock(block);
                                                        setShowPropertiesPanel(true);
                                                    }}
                                                    onImageClick={(blockId, path) => {
                                                        setSelectedImageTarget({ blockId, path });
                                                        setShowImageLibrary(true);
                                                    }}
                                                    darkMode={darkMode}
                                                />
                                            </SortableContext>
                                        </div>

                                        {showPropertiesPanel && selectedBlock && (
                                            <PropertiesPanel
                                                block={selectedBlock}
                                                updateBlock={updateBlock}
                                                onClose={() => {
                                                    setShowPropertiesPanel(false);
                                                    setSelectedBlock(null);
                                                }}
                                            />
                                        )}

                                        {showImageLibrary && (
                                            <ImageLibrary
                                                onImageSelect={handleImageSelect}
                                                onClose={() => {
                                                    setShowImageLibrary(false);
                                                    setSelectedImageTarget(null);
                                                }}
                                            />
                                        )}
                                    </div>

                                    <DragOverlay>
                                        {activeId ? (
                                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border-2 border-blue-400 opacity-90">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {activeId.startsWith("sidebar-") ? activeId.replace("sidebar-", "").replace("-", " ").toUpperCase() : "Moving Block"}
                                                </div>
                                            </div>
                                        ) : null}
                                    </DragOverlay>
                                </div>
                            </DndContext>
                        </div>
                    </div>
                </div>
            </div>
            {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={closeMenu} />}

            {/* Off-Canvas Panel - Right Side */}
            <div
                className={`fixed top-0 left-0 pt-20 w-[35%] h-full bg-white shadow-lg z-50 transform transition-transform duration-300 ${isOpen2 ? "translate-x-0" : "-translate-x-full"}`}
                style={{ backgroundColor: "#19191c", borderColor: "#404040" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-2 border-b border-[#ffffff1a]">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-xl font-bold text-white">{titleCreateTemplate}</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setIsOpen2(false)} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                            <X className="h-6 w-6 text-white" />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto flex-grow">
                    <div className="h-[calc(100vh-115px)] overflow-y-auto">
                        <iframe
                            src={iframeLayout2 ? `${import.meta.env.VITE_BASE_URL}/storage/products/templates/layout/${iframeLayout2}` : undefined}
                            id="iframe_layout"
                            frameBorder="0"
                            width="100%"
                            height="100%"
                            className="rounded"
                        />
                    </div>
                </div>
            </div>

            {/* Backdrop/Overlay */}
            {isOpen2 && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsOpen2(false)} />}
        </div>
    );
};

export default PreorderDetails;

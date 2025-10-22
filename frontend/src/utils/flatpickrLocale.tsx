// utils/dateUtils.ts
import { CustomLocale } from "flatpickr/dist/types/locale";

export const getFlatpickrLocale = (translations: Record<string, string>): CustomLocale => ({
    firstDayOfWeek: 1,
    weekdays: {
        shorthand: [translations["Sun"], translations["Mon"], translations["Tue"], translations["Wed"], translations["Thu"], translations["Fri"], translations["Sat"]],
        longhand: [translations["Sunday"], translations["Monday"], translations["Tuesday"], translations["Wednesday"], translations["Thursday"], translations["Friday"], translations["Saturday"]],
    },
    months: {
        shorthand: [
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
        ],
        longhand: [
            translations["January"],
            translations["February"],
            translations["March"],
            translations["April"],
            translations["May"],
            translations["June"],
            translations["July"],
            translations["August"],
            translations["September"],
            translations["October"],
            translations["November"],
            translations["December"],
        ],
    },
    ordinal: (n) => `${n}`,
    rangeSeparator: " to ",
    weekAbbreviation: "Wk",
    scrollTitle: "Scroll to increment",
    toggleTitle: "Click to toggle",
});

export const formatDateToCustom = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "2-digit",
        year: "numeric",
    };
    const formatted = date.toLocaleDateString("en-US", options);
    return formatted.replace(",", "");
};

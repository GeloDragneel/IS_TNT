// src/utils/alert.ts
import Swal, { SweetAlertIcon } from "sweetalert2";

/*** Show a basic alert */
export const showAlert = (title: string, text: string, icon: SweetAlertIcon = "info") => {
    return Swal.fire({
        title,
        text,
        icon,
        confirmButtonText: "OK",
    });
};

/*** Show a confirmation dialog */
export const showConfirm = async (title: string, text: string, confirmButtonText: string = "Yes", cancelButtonText: string = "Cancel"): Promise<boolean> => {
    const result = await Swal.fire({
        title,
        text,
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText,
        cancelButtonText,
    });
    return result.isConfirmed;
};
export const showConfirm2 = (
    title: string,
    text: string,
    yesText: string = "Yes",
    noText: string = "No",
    cancelText: string = "Cancel"
): Promise<string> => {
    return new Promise((resolve) => {
        Swal.fire({
            title,
            text,
            icon: "info",
            showConfirmButton: false,
            showCancelButton: false,
            showCloseButton: false,
            html: `
                <div class="swal2-custom-buttons">
                    <button class="swal2-styled btn-yes" id="swal-btn-yes">${yesText}</button>
                    <button class="swal2-styled btn-no" id="swal-btn-no">${noText}</button>
                    <button class="swal2-styled btn-cancel" id="swal-btn-cancel">${cancelText}</button>
                </div>
            `,
            didOpen: () => {
                document.getElementById("swal-btn-yes")?.addEventListener("click", () => {
                    Swal.close();
                    resolve("Yes");
                });
                document.getElementById("swal-btn-no")?.addEventListener("click", () => {
                    Swal.close();
                    resolve("No");
                });
                document.getElementById("swal-btn-cancel")?.addEventListener("click", () => {
                    Swal.close();
                    resolve("Cancel");
                });
            },
        });
    });
};

import "./styles/spinner.css";

export function showSpinner(): void {
    const ele = document.querySelector(".spinner");

    if (!ele) return;
    ele.classList.remove("spinner--hidden");
}

export function hideSpinner(): void {
    const ele = document.querySelector(".spinner");

    if (!ele) return;
    ele.classList.add("spinner--hidden");
}

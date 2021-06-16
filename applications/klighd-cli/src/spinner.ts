import "./styles/spinner.css";

export function showSpinner() {
    const ele = document.querySelector(".spinner");

    if (!ele) return;
    ele.classList.remove("spinner--hidden");
}

export function hideSpinner() {
    const ele = document.querySelector(".spinner");

    if (!ele) return;
    ele.classList.add("spinner--hidden");
}

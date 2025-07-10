// 表单验证
function validateForm() {
    let errorMessage = "";
    for (let i = 1; i <= 20; i++) {
        const input = document.getElementById("q" + i);
        if (input.value < 1 || input.value > 5) {
            errorMessage = "问题 " + i + " 的回答必须在 1 到 5 之间。";
            break;
        }
    }

    if (errorMessage) {
        document.getElementById("error-message").innerText = errorMessage;
        return false;
    }

    return true;
}

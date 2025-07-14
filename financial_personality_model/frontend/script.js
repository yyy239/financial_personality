const questions = [
    { text: "1. Do you often plan for long-term financial goals?", labels: ["Never", "Always"] },
    { text: "2. Can you stay calm during market fluctuations?", labels: ["Very nervous", "Very calm"] },
    { text: "3. Do you prefer saving money in the bank over investing?", labels: ["Strongly disagree", "Strongly agree"] },
    { text: "4. If your assets drop 20% in the short term, will you hold them?", labels: ["Sell immediately", "Hold firmly"] },
    { text: "5. Do you like to try new investment opportunities?", labels: ["Strongly dislike", "Strongly like"] },
    { text: "6. Do you believe you can pick good stocks?", labels: ["No confidence at all", "Very confident"] },
    { text: "7. Do you change your investment decisions based on friends' advice?", labels: ["Never", "Always"] },
    { text: "8. Do you tend to save a portion of your income?", labels: ["Save nothing", "Save a lot"] },
    { text: "9. Do you focus more on long-term returns or short-term gains?", labels: ["Short-term focus", "Long-term focus"] },
    { text: "10. Are you willing to take high risks for high returns?", labels: ["Not willing at all", "Very willing"] },
    { text: "11. Do you have a habit of setting a financial budget?", labels: ["Never", "Always"] },
    { text: "12. Do you follow financial news to guide your investments?", labels: ["Never", "Very frequently"] },
    { text: "13. Do you diversify your investments rather than concentrate them?", labels: ["No diversification", "Highly diversified"] },
    { text: "14. How do you react to reinvesting after a loss?", labels: ["Exit immediately", "Keep reinvesting"] },
    { text: "15. Are you willing to invest in fields you're not familiar with?", labels: ["Not willing at all", "Very willing"] },
    { text: "16. Have you ever had a clear asset allocation strategy?", labels: ["Never had one", "Very clear"] },
    { text: "17. Do you follow a fixed investment schedule?", labels: ["No plan", "Very regular"] },
    { text: "18. Do you buy more when the market is in panic?", labels: ["Never", "Buy actively"] },
    { text: "19. Do you rely more on data or intuition when investing?", labels: ["Only intuition", "Only data"] },
    { text: "20. Do you regularly evaluate and adjust your portfolio?", labels: ["Never evaluate", "Adjust regularly"] }
];


const container = document.getElementById("questionsContainer");
const progressBar = document.getElementById("progressBar");

let answeredQuestions = new Set();

// 渲染所有问题
questions.forEach((q, index) => {
    const block = document.createElement("div");
    block.className = "question-block";
    block.id = `block-${index}`;

    const label = document.createElement("div");
    label.className = "question-text";
    label.textContent = q.text;
    block.appendChild(label);

    const optionsDiv = document.createElement("div");
    optionsDiv.className = "options";

    const leftLabel = document.createElement("div");
    leftLabel.className = "label";
    leftLabel.textContent = q.labels[0];
    optionsDiv.appendChild(leftLabel);

    for (let i = 1; i <= 5; i++) {
        const radio = document.createElement("input");
        const radioId = `q${index}_opt${i}`;
        radio.type = "radio";
        radio.name = `q${index}`;
        radio.id = radioId;
        radio.value = i;

        const optionLabel = document.createElement("label");
        optionLabel.htmlFor = radioId;
        optionLabel.textContent = '';
        optionLabel.setAttribute("data-index", i);

        optionsDiv.appendChild(radio);
        optionsDiv.appendChild(optionLabel);
    }

    const rightLabel = document.createElement("div");
    rightLabel.className = "label";
    rightLabel.textContent = q.labels[1];
    optionsDiv.appendChild(rightLabel);

    block.appendChild(optionsDiv);
    container.appendChild(block);
});

// 更新进度条（根据已答数量）
function updateProgressBar() {
    const progress = (answeredQuestions.size / questions.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressBar.textContent = `${Math.round(progress)}%`;
}

// 滚动跳转到下一道未答题
function scrollToNextUnanswered(fromIndex) {
    for (let i = fromIndex + 1; i < questions.length; i++) {
        if (!answeredQuestions.has(i)) {
            const nextBlock = document.getElementById(`block-${i}`);
            smoothScrollTo(nextBlock.offsetTop - 100, 1000);
            return;
        }
    }
    // 所有题目已答完
    console.log("All questions are complete, please click to submit");
}

function smoothScrollTo(targetY, duration) {
    const startY = window.scrollY || window.pageYOffset;
    const distance = targetY - startY;
    const startTime = performance.now();

    function scrollStep(currentTime) {
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        const ease = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        window.scrollTo(0, startY + distance * ease);
        if (progress < 1) requestAnimationFrame(scrollStep);
    }

    requestAnimationFrame(scrollStep);
}

// 回答问题后处理
container.addEventListener("change", function (e) {
    if (e.target.type === "radio") {
        const name = e.target.name;
        const questionIndex = parseInt(name.replace("q", ""));
        const block = document.getElementById(`block-${questionIndex}`);

        // 设置透明
        answeredQuestions.add(questionIndex);
        block.style.opacity = "0.5";

        updateProgressBar();
        scrollToNextUnanswered(questionIndex);
    }
});

// 表单提交
document.getElementById("quizForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const answers = [];
    const unanswered = [];

    for (let i = 0; i < questions.length; i++) {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        if (!selected) {
            unanswered.push(i + 1);
        } else {
            answers.push(parseInt(selected.value));
        }
    }

    if (unanswered.length > 0) {
        alert(`Please complete the following questions: Question ${unanswered.join(", ")}`);
        return;
    }
    

    console.log("Sending answers:", JSON.stringify({ answers: answers }));

    // 发送到 Flask 后端（部署在 Render）
    fetch("https://financial-personality-1.onrender.com/predict", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ answers: answers })
    })
    .then((res) => res.json())
    .then((data) => {
        const score = data.score;
        // 跳转到 result.html 并带上分数参数
        window.location.href = `result.html?score=${score}`;
    })
    
    .catch((err) => {
        console.error(err);
        alert("Submission failed, please try again later.");
    });    
});


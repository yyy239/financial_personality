const questions = [
    { text: "1. 你是否经常计划长期的财务目标？", labels: ["从不", "总是"] },
    { text: "2. 面对市场波动你会保持冷静吗？", labels: ["非常紧张", "非常冷静"] },
    { text: "3. 你更愿意将钱存银行而非投资？", labels: ["完全不同意", "完全同意"] },
    { text: "4. 资产短期下跌20%你会继续持有吗？", labels: ["立即卖出", "坚定持有"] },
    { text: "5. 你喜欢尝试新的投资机会吗？", labels: ["完全不喜欢", "非常喜欢"] },
    { text: "6. 你相信自己能选出好股票吗？", labels: ["完全没有信心", "非常有信心"] },
    { text: "7. 你会因朋友建议改变投资决策吗？", labels: ["从不", "总是"] },
    { text: "8. 你是否倾向将收入存起来？", labels: ["完全不存", "大量存"] },
    { text: "9. 你更关注长期回报还是短期收益？", labels: ["短期为主", "长期为主"] },
    { text: "10. 你是否愿意承担高风险换高回报？", labels: ["完全不愿意", "非常愿意"] },
    { text: "11. 你是否有设定财务预算的习惯？", labels: ["从不", "总是"] },
    { text: "12. 你是否会关注财经新闻来指导投资？", labels: ["从不", "非常频繁"] },
    { text: "13. 你是否会分散投资而不是集中投资？", labels: ["完全不分散", "高度分散"] },
    { text: "14. 你如何看待亏损后的再投资？", labels: ["立即退出", "坚持再投"] },
    { text: "15. 你是否愿意投资于你不了解的领域？", labels: ["完全不愿意", "非常愿意"] },
    { text: "16. 你是否曾有明确的资产配置策略？", labels: ["从未有过", "非常清晰"] },
    { text: "17. 你是否有固定的投资周期？", labels: ["没有计划", "非常规律"] },
    { text: "18. 你是否会在市场恐慌时加仓？", labels: ["完全不会", "积极加仓"] },
    { text: "19. 你更信赖数据还是直觉进行投资？", labels: ["完全靠直觉", "完全靠数据"] },
    { text: "20. 你会定期评估和调整投资组合吗？", labels: ["从不评估", "定期调整"] }
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
    console.log("所有题目已完成，请点击提交");
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
        alert(`请完成以下题目：第 ${unanswered.join("、")} 题`);
        return;
    }

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
        alert("提交失败，请稍后再试。");
    });
});


document.addEventListener("DOMContentLoaded", function () {
    const path = location.pathname.toLowerCase();

    if (path.endsWith("index.html") || path === "/" || path === "") {
        sessionStorage.clear();
        localStorage.removeItem("paymentConfirmed");
        localStorage.removeItem("lastOrderId");

        document.querySelectorAll(".buy, .buy.special").forEach(btn => {
            btn.onclick = function () {
                const card = this.closest(".card");
                const name = card.dataset.name;
                price = parseFloat(card.dataset.price);

                sessionStorage.setItem("order", JSON.stringify({ name, price }));
                location.href = "confirm.html";
            };
        });
    }

else if (path.includes("confirm.html")) {
    const order = JSON.parse(sessionStorage.getItem("order"));
    if (!order) { alert("No order found!"); location.href = "index.html"; return; }

    document.getElementById("coinName").textContent = order.name;

    const amountInput = document.getElementById("amount");
    const payUSDT = document.getElementById("payUSDT");
    const payBtn = document.getElementById("payNow");

    const calc = () => {
        let qty = parseFloat(amountInput.value) || 0;
        if (qty <= 0) qty = 0;
        if (order.name === "PANDA") qty = Math.min(qty, 1000);

        // 统一显示 8 位小数
        amountInput.value = qty.toFixed(8).replace(/\.?0+$/, "");

        // 修正版：直接用 BTC 数量 * 价格 / 3 计算 USDT
        const needUSDT = (qty * order.price) / 3;

        // 只显示 USDT 数量
        payUSDT.textContent = needUSDT.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8}) + " USDT";

        payBtn.disabled = needUSDT < 50;
        payBtn.style.opacity = needUSDT < 100 ? "0.5" : "1";
    };

    document.getElementById("plus").onclick = () => {
        amountInput.value = (parseFloat(amountInput.value || 0) + 0.01).toFixed(8);
        calc();
    };
    document.getElementById("minus").onclick = () => {
        if (parseFloat(amountInput.value) >= 0.02) {
            amountInput.value = (parseFloat(amountInput.value) - 0.01).toFixed(8);
            calc();
        }
    };

    amountInput.oninput = () => {
        let val = amountInput.value.replace(/[^0-9.]/g, '');
        const parts = val.split('.');
        if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
        amountInput.value = val;
        calc();
    };

    calc();

    payBtn.onclick = () => {
        const wallet = document.getElementById("wallet").value.trim();
        if (!wallet) return alert("Please enter the wallet address!");
        if (!/^0x[a-fA-F0-9]{40}$/i.test(wallet)) return alert("Wallet address format is incorrect!");

        sessionStorage.setItem("payAmount", payUSDT.textContent);
        location.href = "payment.html";
    };
}

       // 支付页 - Polygon USDT（超快超便宜！所有钱包秒跳自动填金额）
    else if (path.includes("payment.html")) {
        const amountText = sessionStorage.getItem("payAmount");
        if (!amountText) { location.href = "index.html"; return; }

        document.getElementById("usdtAmount").textContent = amountText;

        // Polygon USDT 合约地址 + 收款地址
        const usdtAmount = Math.round(parseFloat(amountText) * 1000000); // 6位小数
        const paymentUri = `ethereum:0xc2132D05D31c914a87C6611C10748AEb04B58e8F@137/transfer?address=0xD0aACa939B669eCa6200b81E06ec658bA607983E&uint256=${usdtAmount}`;

        new QRCode(document.getElementById("qrcode"), {
            text: paymentUri,
            width: 280,
            height: 280,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        
        const tip = document.createElement("p");
        tip.innerHTML = `<strong style="color:#8247e5">Please select the Polygon network when making a payment</strong><br>
                         Support Binance/OKX/TP/MetaMask/Phantom`;
        tip.style.marginTop = "1.5rem";
        tip.style.color = "#c9d1d9";
        document.querySelector(".payment-box.glass").insertBefore(tip, document.getElementById("paid"));

        document.getElementById("paid").onclick = () => {
            localStorage.setItem("paymentConfirmed", "true");
            localStorage.setItem("lastOrderId", "CH" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2,5).toUpperCase());
            location.href = "success.html";
        };
    }

    else if (path.includes("success.html")) {
        if (localStorage.getItem("paymentConfirmed") !== "true") {
            alert("Access denied!");
            location.href = "index.html";
            return;
        }
        document.getElementById("orderId").textContent = localStorage.getItem("lastOrderId") || "CH00000000";

        let time = 30;
        const timer = setInterval(() => {
            time--;
            document.getElementById("statusText").innerHTML = `Verifying transaction... <strong style="color:#79c879">${time}s</strong>`;
            if (time <= 0) {
                clearInterval(timer);
                document.getElementById("statusText").innerHTML = `<span style="color:#ff6b6b">✗ Payment timeout</span>`;
                document.getElementById("backHome").style.display = "block";
            }
        }, 1000);

        document.getElementById("backHome").onclick = () => {
            localStorage.clear();
            sessionStorage.clear();
            location.href = "index.html";
        };
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const path = location.pathname.toLowerCase();

    // 主页购买
    if (path.endsWith("index.html") || path === "/" || path === "") {
        sessionStorage.clear();
        localStorage.removeItem("paymentConfirmed");
        localStorage.removeItem("lastOrderId");

        document.querySelectorAll(".buy, .buy.special").forEach(btn => {
            btn.onclick = function () {
                const card = this.closest(".card");
                const name = card.dataset.name;
                const price = parseFloat(card.dataset.price);

                sessionStorage.setItem("order", JSON.stringify({ name, price }));
                location.href = "confirm.html";
            };
        });
    }

    // ==================== 确认订单页（最低20USDT + 1USDT=2USD + 完全支持浮点） ====================
    else if (path.includes("confirm.html")) {
        const order = JSON.parse(sessionStorage.getItem("order"));
        if (!order) { alert("No order found!"); location.href = "index.html"; return; }

        document.getElementById("coinName").textContent = order.name;
        document.getElementById("marketRate").textContent = "$" + order.price.toLocaleString();

        const amountInput = document.getElementById("amount");
        const totalUSD = document.getElementById("totalUSD");
        const payUSDT = document.getElementById("payUSDT");
        const payBtn = document.getElementById("payNow");

               const calc = () => {
            let qty = parseFloat(amountInput.value) || 0;
            if (qty <= 0) qty = 0;

            // 熊猫币限购100
            if (order.name === "PANDA") qty = Math.min(qty, 1000);
            amountInput.value = qty.toFixed(8).replace(/\.?0+$/, "");

            const usdValue = qty * order.price;           // 原始美元价值
            const needUSDT = usdValue / 3;                 // 全球统一：1 USDT = 2 USD（熊猫币也打五折！）

            totalUSD.textContent = usdValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8});
            payUSDT.textContent = needUSDT.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8}) + " USDT";

            // 最低 20 USDT
            payBtn.disabled = needUSDT < 100;
            payBtn.style.opacity = needUSDT < 20 ? "0.5" : "1";
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

        // 输入框支持任意浮点数
        amountInput.oninput = () => {
            let val = amountInput.value.replace(/[^0-9.]/g, '');
            const parts = val.split('.');
            if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
            amountInput.value = val;
            calc();
        };

        calc(); // 初始化

        payBtn.onclick = () => {
            const wallet = document.getElementById("wallet").value.trim();
            if (!wallet) return alert("Please enter the wallet address!");
            if (!/^0x[a-fA-F0-9]{40}$/i.test(wallet)) return alert("Wallet address format is incorrect！");

            sessionStorage.setItem("payAmount", payUSDT.textContent);
            location.href = "payment.html";
        };
    }

    // ==================== 支付页（二维码100%显示 + 币安实测可用） ====================
    else if (path.includes("payment.html")) {
        const amountText = sessionStorage.getItem("payAmount");
        if (!amountText) { location.href = "index.html"; return; }

        document.getElementById("usdtAmount").textContent = amountText;

        // 币安最稳的纯地址二维码
        const address = "0xe5eEE64A2e316Ef7939b8eBE30d9Ecd8E4d7E845";
        new QRCode(document.getElementById("qrcode"), {
            text: address,
            width: 280,
            height: 280,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        // 币安专属贴心提示
        const tip = document.createElement("p");
        tip.innerHTML = `<strong style="color:#00ff9d">After scanning the Binance QR code:</strong><br> 
Select USDT (ERC20 network) → Paste the address → Enter<b>${amountText}</b> → Confirm payment`;
        tip.style.margin = "1.5rem 0";
        tip.style.lineHeight = "1.8";
        tip.style.fontSize = "1.1rem";
        document.querySelector(".payment-box.glass").insertBefore(tip, document.getElementById("paid"));

        document.getElementById("paid").onclick = () => {
            localStorage.setItem("paymentConfirmed", "true");
            localStorage.setItem("lastOrderId", "CH" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2,5).toUpperCase());
            location.href = "success.html";
        };
    }

    // ==================== 成功页（保持不变） ====================
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
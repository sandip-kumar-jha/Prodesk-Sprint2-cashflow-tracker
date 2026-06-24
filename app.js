let state = {
    salary: 0,
    expenses: []
};

let chart = null;
let exchangeRate = 1;
let currentCurrency = "INR";

// ==========================
// DOM ELEMENTS
// ==========================

const salaryInput = document.getElementById("salary");
const expenseNameInput = document.getElementById("expenseName");
const expenseAmountInput = document.getElementById("expenseAmount");

const salaryBtn = document.getElementById("salaryBtn");
const expenseBtn = document.getElementById("expenseBtn");
const downloadBtn = document.getElementById("downloadBtn");

const salaryDisplay = document.getElementById("salaryDisplay");
const expenseDisplay = document.getElementById("expenseDisplay");
const balanceDisplay = document.getElementById("balance");

const expenseList = document.getElementById("expenseList");
const warningBanner = document.getElementById("warningBanner");

const currencySelect = document.getElementById("currency");

// ==========================
// EVENT LISTENERS
// ==========================

salaryBtn.addEventListener("click", setSalary);
expenseBtn.addEventListener("click", addExpense);
downloadBtn.addEventListener("click", downloadPDF);

currencySelect.addEventListener("change", async () => {

    currentCurrency = currencySelect.value;

    if (currentCurrency === "USD") {
        await fetchExchangeRate();
    } else {
        exchangeRate = 1;
    }

    render();
});

// ==========================
// LOCAL STORAGE
// ==========================

function saveData() {
    localStorage.setItem(
        "cashflowData",
        JSON.stringify(state)
    );
}

function loadData() {

    const savedData =
        localStorage.getItem("cashflowData");

    if (savedData) {
        state = JSON.parse(savedData);
    }

    render();
}

// ==========================
// SALARY
// ==========================

function setSalary() {

    const salary =
        Number(salaryInput.value);

    if (!salary || salary < 0) {
        alert("Please enter a valid salary.");
        return;
    }

    state.salary = salary;

    salaryInput.value = "";

    saveData();
    render();
}

// ==========================
// ADD EXPENSE
// ==========================

function addExpense() {

    const name =
        expenseNameInput.value.trim();

    const amount =
        Number(expenseAmountInput.value);

    if (!name || !amount || amount < 0) {
        alert("Please enter valid expense details.");
        return;
    }

    const expense = {
        id: Date.now(),
        name,
        amount
    };

    state.expenses.push(expense);

    expenseNameInput.value = "";
    expenseAmountInput.value = "";

    saveData();
    render();
}

// ==========================
// DELETE EXPENSE
// ==========================

function deleteExpense(id) {

    state.expenses =
        state.expenses.filter(
            expense => expense.id !== id
        );

    saveData();
    render();
}

// ==========================
// CALCULATIONS
// ==========================

function getTotalExpenses() {

    return state.expenses.reduce(
        (total, expense) =>
            total + expense.amount,
        0
    );
}

function getBalance() {

    return state.salary -
        getTotalExpenses();
}

// ==========================
// CURRENCY
// ==========================

async function fetchExchangeRate() {

    try {

        const response = await fetch(
            "https://api.frankfurter.app/latest?from=INR&to=USD"
        );

        const data =
            await response.json();

        exchangeRate =
            data.rates.USD;

    } catch (error) {

        console.error(error);

        alert(
            "Unable to fetch exchange rate."
        );
    }
}

function getCurrencySymbol() {

    return currentCurrency === "USD"
        ? "$"
        : "₹";
}

function convert(value) {

    return (
        value * exchangeRate
    ).toFixed(2);
}

// ==========================
// RENDER UI
// ==========================

function render() {

    const totalExpenses =
        getTotalExpenses();

    const balance =
        getBalance();

    salaryDisplay.innerText =
        `${getCurrencySymbol()} ${convert(state.salary)}`;

    expenseDisplay.innerText =
        `${getCurrencySymbol()} ${convert(totalExpenses)}`;

    balanceDisplay.innerText =
        `${getCurrencySymbol()} ${convert(balance)}`;

    // Expense List

    expenseList.innerHTML = "";

    state.expenses.forEach(expense => {

        const li =
            document.createElement("li");

        li.classList.add("expense-item");

        li.innerHTML = `
            <div class="expense-info">
                <span class="expense-name">
                    ${expense.name}
                </span>

                <span class="expense-amount">
                    ${getCurrencySymbol()} ${convert(expense.amount)}
                </span>
            </div>

            <button
                class="delete-btn"
                onclick="deleteExpense(${expense.id})"
            >
                Delete
            </button>
        `;

        expenseList.appendChild(li);
    });

    // Warning Alert

    if (
        state.salary > 0 &&
        balance <= state.salary * 0.10
    ) {

        warningBanner.style.display =
            "block";

        balanceDisplay.style.color =
            "red";

    } else {

        warningBanner.style.display =
            "none";

        balanceDisplay.style.color =
            "green";
    }

    updateChart();
}

// ==========================
// CHART.JS
// ==========================

function updateChart() {

    const expenses =
        getTotalExpenses();

    const balance =
        getBalance();

    const ctx =
        document.getElementById("myChart");

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {

        type: "pie",

        data: {

            labels: [
                "Expenses",
                "Remaining Balance"
            ],

            datasets: [
                {
                    data: [
                        expenses,
                        balance
                    ]
                }
            ]
        },

        options: {
            responsive: true
        }
    });
}

// ==========================
// PDF REPORT
// ==========================

function downloadPDF() {

    const { jsPDF } =
        window.jspdf;

    const doc =
        new jsPDF();

    doc.setFontSize(18);

    doc.text(
        "Cash Flow Report",
        20,
        20
    );

    doc.setFontSize(12);

    doc.text(
        `Salary: ₹${state.salary}`,
        20,
        40
    );

    let y = 60;

    doc.text(
        "Expenses:",
        20,
        y
    );

    y += 10;

    state.expenses.forEach(expense => {

        doc.text(
            `${expense.name} - ₹${expense.amount}`,
            20,
            y
        );

        y += 10;
    });

    y += 10;

    doc.text(
        `Total Expenses: ₹${getTotalExpenses()}`,
        20,
        y
    );

    y += 10;

    doc.text(
        `Remaining Balance: ₹${getBalance()}`,
        20,
        y
    );

    doc.save(
        "CashFlowReport.pdf"
    );
}

// ==========================
// INITIAL LOAD
// ==========================

loadData();
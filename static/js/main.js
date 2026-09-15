let allExpenses = [];

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("date").value = new Date().toISOString().split("T")[0];

    fetchCategories();
    fetchExpenses();

    document.getElementById("expense-form").addEventListener("submit", handleSubmit);
    document.getElementById("search-input").addEventListener("input", applyFilters);
    document.getElementById("filter-category").addEventListener("change", applyFilters);
});

async function fetchCategories() {
    try {
        const response = await fetch("/api/categories");
        const categories = await response.json();

        const category = document.getElementById("category");
        const filter = document.getElementById("filter-category");

        category.innerHTML = '<option value="">Select Category</option>';
        filter.innerHTML = '<option value="">All Categories</option>';

        categories.forEach(function(item) {
            let option = document.createElement("option");
            option.value = item.id;
            option.textContent = item.name;
            category.appendChild(option);

            let filterOption = document.createElement("option");
            filterOption.value = item.name;
            filterOption.textContent = item.name;
            filter.appendChild(filterOption);
        });
    } catch (error) {
        console.log(error);
    }
}

async function fetchExpenses() {
    try {
        const response = await fetch("/api/expenses");
        allExpenses = await response.json();

        updateDashboard();
        applyFilters();
    } catch (error) {
        console.log(error);
    }
}

function updateDashboard() {
    let total = 0;
    let highest = 0;

    allExpenses.forEach(function(expense) {
        let amount = Number(expense.amount);
        total += amount;

        if (amount > highest) {
            highest = amount;
        }
    });

    let count = allExpenses.length;
    let average = count > 0 ? total / count : 0;

    document.getElementById("summary-total").textContent = "₹" + total.toFixed(2);
    document.getElementById("summary-count").textContent = count;
    document.getElementById("summary-average").textContent = "₹" + average.toFixed(2);
    document.getElementById("summary-highest").textContent = "₹" + highest.toFixed(2);
}

function applyFilters() {
    let search = document.getElementById("search-input").value.toLowerCase();
    let category = document.getElementById("filter-category").value;

    let filtered = allExpenses.filter(function(expense) {
        let titleMatch = expense.title.toLowerCase().includes(search);
        let categoryMatch = !category || expense.category === category;

        return titleMatch && categoryMatch;
    });

    renderExpenses(filtered);
}

function renderExpenses(expenses) {
    let table = document.getElementById("expense-table-body");
    let totalDisplay = document.getElementById("total-spending");

    table.innerHTML = "";
    let total = 0;

    if (expenses.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5" class="py-6 text-center text-gray-500">
                    No expenses found
                </td>
            </tr>
        `;

        totalDisplay.textContent = "₹0.00";
        return;
    }

    expenses.forEach(function(expense) {
        total += Number(expense.amount);

        let row = document.createElement("tr");

        row.innerHTML = `
            <td class="py-3 px-4">${expense.date}</td>
            <td class="py-3 px-4 font-medium">${expense.title}</td>
            <td class="py-3 px-4">${expense.category}</td>
            <td class="py-3 px-4 text-right font-semibold">₹${Number(expense.amount).toFixed(2)}</td>
            <td class="py-3 px-4 text-center">
                <button onclick="editExpense(${expense.id})" class="text-blue-500 mr-3">Edit</button>
                <button onclick="deleteExpense(${expense.id})" class="text-red-500">Delete</button>
            </td>
        `;

        table.appendChild(row);
    });

    totalDisplay.textContent = "₹" + total.toFixed(2);
}

async function handleSubmit(event) {
    event.preventDefault();

    let form = document.getElementById("expense-form");

    if (form.dataset.editId) {
        updateExpense(form.dataset.editId);
    } else {
        addExpense();
    }
}

async function addExpense() {
    let title = document.getElementById("title").value.trim();
    let amount = parseFloat(document.getElementById("amount").value);
    let category = parseInt(document.getElementById("category").value);
    let date = document.getElementById("date").value;
    let description = document.getElementById("description").value.trim();

    if (!title || isNaN(amount) || amount <= 0 || !category || !date) {
        alert("Please fill all required fields.");
        return;
    }

    try {
        const response = await fetch("/api/expenses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                amount: amount,
                category_id: category,
                date: date,
                description: description
            })
        });

        if (response.ok) {
            alert("Expense added successfully!");
            resetForm();
            fetchExpenses();
        }
    } catch (error) {
        console.log(error);
    }
}

async function editExpense(id) {
    let expense = allExpenses.find(function(item) {
        return item.id === id;
    });

    if (!expense) return;

    document.getElementById("title").value = expense.title;
    document.getElementById("amount").value = expense.amount;
    document.getElementById("category").value = expense.category_id;
    document.getElementById("date").value = expense.date;
    document.getElementById("description").value = expense.description || "";

    let form = document.getElementById("expense-form");
    form.dataset.editId = id;

    form.querySelector("button[type='submit']").textContent = "Update Expense";

    window.scrollTo(0, 0);
}

async function updateExpense(id) {
    let title = document.getElementById("title").value.trim();
    let amount = parseFloat(document.getElementById("amount").value);
    let category = parseInt(document.getElementById("category").value);
    let date = document.getElementById("date").value;
    let description = document.getElementById("description").value.trim();

    if (!title || isNaN(amount) || amount <= 0 || !category || !date) {
        alert("Please fill all required fields.");
        return;
    }

    const response = await fetch("/api/expenses/" + id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: title,
            amount: amount,
            category_id: category,
            date: date,
            description: description
        })
    });

    if (response.ok) {
        alert("Expense updated successfully!");
        resetForm();
        fetchExpenses();
    }
}

async function deleteExpense(id) {
    if (!confirm("Are you sure you want to delete this expense?")) {
        return;
    }

    const response = await fetch("/api/expenses/" + id, {
        method: "DELETE"
    });

    if (response.ok) {
        alert("Expense deleted successfully!");
        fetchExpenses();
    }
}

function resetForm() {
    let form = document.getElementById("expense-form");

    form.reset();
    delete form.dataset.editId;

    document.getElementById("date").value = new Date().toISOString().split("T")[0];

    form.querySelector("button[type='submit']").textContent = "Save Expense";
}
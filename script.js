// قواعد البيانات المحلية
let clients = {};
let employees = {};
let suppliers = {};
let debtors = {};
let contacts = [];
let deliveredAmounts = [];
let invoices = [];
let vouchers = [];
let transfers = [];
let currentUser = null;
let currentClient = null;
let currentEmployee = null;
let selectedCurrency = 'sar';

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateDateTime();
    setInterval(updateDateTime, 60000);
    checkLoginStatus();
    
    // ربط الأحداث
    document.getElementById('searchInput')?.addEventListener('input', searchData);
    document.getElementById('clientForm')?.addEventListener('submit', addClient);
    document.getElementById('employeeForm')?.addEventListener('submit', addEmployee);
    document.getElementById('supplierForm')?.addEventListener('submit', addSupplier);
    document.getElementById('debtorForm')?.addEventListener('submit', addDebtor);
});

// ==================== إدارة تسجيل الدخول ====================
function checkLoginStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('login-page').style.display = 'block';
    document.getElementById('main-app').style.display = 'none';
}

function showMainApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    updateStats();
    renderAll();
}

function loginWithGoogle() {
    currentUser = { name: 'مستخدم جوجل', email: 'user@gmail.com', type: 'google' };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showMainApp();
    alert('تم تسجيل الدخول بحساب جوجل بنجاح!');
}

function loginAsGuest() {
    currentUser = { name: 'ضيف', type: 'guest' };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showMainApp();
    alert('تم الدخول كضيف بنجاح!');
}

function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showLoginScreen();
    }
}

// ==================== الوقت والتاريخ ====================
function updateDateTime() {
    const now = new Date();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('currentTime').textContent = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

// ==================== تحميل وحفظ البيانات ====================
function loadData() {
    clients = JSON.parse(localStorage.getItem('clients') || '{}');
    employees = JSON.parse(localStorage.getItem('employees') || '{}');
    suppliers = JSON.parse(localStorage.getItem('suppliers') || '{}');
    debtors = JSON.parse(localStorage.getItem('debtors') || '{}');
    contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    deliveredAmounts = JSON.parse(localStorage.getItem('deliveredAmounts') || '[]');
    invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    vouchers = JSON.parse(localStorage.getItem('vouchers') || '[]');
    transfers = JSON.parse(localStorage.getItem('transfers') || '[]');
}

function saveData() {
    localStorage.setItem('clients', JSON.stringify(clients));
    localStorage.setItem('employees', JSON.stringify(employees));
    localStorage.setItem('suppliers', JSON.stringify(suppliers));
    localStorage.setItem('debtors', JSON.stringify(debtors));
    localStorage.setItem('contacts', JSON.stringify(contacts));
    localStorage.setItem('deliveredAmounts', JSON.stringify(deliveredAmounts));
    localStorage.setItem('invoices', JSON.stringify(invoices));
    localStorage.setItem('vouchers', JSON.stringify(vouchers));
    localStorage.setItem('transfers', JSON.stringify(transfers));
    updateStats();
}

// ==================== تحديث الإحصائيات ====================
function updateStats() {
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalExpenses = vouchers.filter(v => v.type === 'صرف').reduce((sum, v) => sum + v.amount, 0);
    const profit = totalRevenue - totalExpenses;
    const balance = totalRevenue - totalExpenses;
    
    const statsHtml = `
        <div class="stat-card"><div class="stat-label">الإيرادات</div><div class="stat-value">${totalRevenue.toFixed(2)}</div></div>
        <div class="stat-card"><div class="stat-label">المصروفات</div><div class="stat-value">${totalExpenses.toFixed(2)}</div></div>
        <div class="stat-card"><div class="stat-label">صافي الربح</div><div class="stat-value">${profit.toFixed(2)}</div></div>
        <div class="stat-card"><div class="stat-label">رصيد الخزينة</div><div class="stat-value">${balance.toFixed(2)}</div></div>
    `;
    const statsGrid = document.getElementById('statsGrid');
    if (statsGrid) statsGrid.innerHTML = statsHtml;
    
    document.getElementById('clientsCount').textContent = Object.keys(clients).length;
    document.getElementById('employeesCount').textContent = Object.keys(employees).length;
    document.getElementById('suppliersCount').textContent = Object.keys(suppliers).length;
    document.getElementById('debtsCount').textContent = Object.keys(debtors).length;
}

// ==================== عرض الصفحات ====================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`${pageId}-page`).classList.add('active');
    
    const navMap = { home:0, clients:1, suppliers:2, debts:3, employees:4, reports:5, settings:6 };
    if (navMap[pageId] !== undefined) {
        document.querySelectorAll('.nav-item')[navMap[pageId]].classList.add('active');
    }
    
    if (pageId === 'clients') renderClients();
    if (pageId === 'employees') renderEmployees();
    if (pageId === 'suppliers') renderSuppliers();
    if (pageId === 'debts') renderDebtors();
}

// ==================== إدارة العملاء ====================
function addClient(e) {
    e.preventDefault();
    const name = document.getElementById('clientName').value;
    clients[name] = {
        phone: document.getElementById('clientPhone').value,
        email: document.getElementById('clientEmail').value,
        address: document.getElementById('clientAddress').value,
        joinDate: new Date().toISOString().split('T')[0],
        records: [],
        deliveredAmounts: []
    };
    saveData();
    renderClients();
    updateClientSelect();
    closeModal('clientModal');
    alert('تم إضافة العميل بنجاح!');
}

function renderClients() {
    const container = document.getElementById('clientsList');
    if (!container) return;
    container.innerHTML = '';
    if (Object.keys(clients).length === 0) {
        container.innerHTML = '<div class="list-item"><div class="item-info"><div class="item-details"><div class="item-name">لا يوجد عملاء</div></div></div></div>';
        return;
    }
    for (const client in clients) {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.onclick = () => showClientRecords(client);
        div.innerHTML = `<div class="item-info"><div class="item-icon"><i class="fas fa-user"></i></div><div class="item-details"><div class="item-name">${client}</div><div class="item-desc">${clients[client].phone}</div></div></div><i class="fas fa-chevron-left"></i>`;
        container.appendChild(div);
    }
}

function updateClientSelect() {
    const select = document.getElementById('amountClient');
    if (select) {
        select.innerHTML = '<option value="">اختر العميل</option>';
        for (const client in clients) {
            select.innerHTML += `<option value="${client}">${client}</option>`;
        }
    }
}

// ==================== إدارة الموظفين ====================
function addEmployee(e) {
    e.preventDefault();
    const name = document.getElementById('employeeName').value;
    employees[name] = {
        phone: document.getElementById('employeePhone').value,
        salary: parseFloat(document.getElementById('employeeSalary').value),
        position: document.getElementById('employeePosition').value,
        joinDate: new Date().toISOString().split('T')[0],
        records: []
    };
    saveData();
    renderEmployees();
    closeModal('employeeModal');
    alert('تم إضافة الموظف بنجاح!');
}

function renderEmployees() {
    const container = document.getElementById('employeesList');
    if (!container) return;
    container.innerHTML = '';
    if (Object.keys(employees).length === 0) {
        container.innerHTML = '<div class="list-item"><div class="item-info"><div class="item-details"><div class="item-name">لا يوجد موظفين</div></div></div></div>';
        return;
    }
    for (const emp in employees) {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.onclick = () => showEmployeeRecords(emp);
        div.innerHTML = `<div class="item-info"><div class="item-icon"><i class="fas fa-user-tie"></i></div><div class="item-details"><div class="item-name">${emp}</div><div class="item-desc">${employees[emp].position}</div></div></div><i class="fas fa-chevron-left"></i>`;
        container.appendChild(div);
    }
}

// ==================== إدارة الموردين ====================
function addSupplier(e) {
    e.preventDefault();
    const name = document.getElementById('supplierName').value;
    suppliers[name] = {
        phone: document.getElementById('supplierPhone').value,
        email: document.getElementById('supplierEmail').value,
        address: document.getElementById('supplierAddress').value,
        joinDate: new Date().toISOString().split('T')[0]
    };
    saveData();
    renderSuppliers();
    closeModal('supplierModal');
    alert('تم إضافة المورد بنجاح!');
}

function renderSuppliers() {
    const container = document.getElementById('suppliersList');
    if (!container) return;
    container.innerHTML = '';
    if (Object.keys(suppliers).length === 0) {
        container.innerHTML = '<div class="list-item"><div class="item-info"><div class="item-details"><div class="item-name">لا يوجد موردين</div></div></div></div>';
        return;
    }
    for (const sup in suppliers) {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `<div class="item-info"><div class="item-icon"><i class="fas fa-truck"></i></div><div class="item-details"><div class="item-name">${sup}</div><div class="item-desc">${suppliers[sup].phone}</div></div></div><i class="fas fa-chevron-left"></i>`;
        container.appendChild(div);
    }
}

// ==================== إدارة الديون ====================
function addDebtor(e) {
    e.preventDefault();
    const name = document.getElementById('debtorName').value;
    debtors[name] = {
        phone: document.getElementById('debtorPhone').value,
        amount: parseFloat(document.getElementById('debtorAmount').value),
        dueDate: document.getElementById('debtorDueDate').value,
        joinDate: new Date().toISOString().split('T')[0]
    };
    saveData();
    renderDebtors();
    closeModal('debtorModal');
    alert('تم إضافة المدين بنجاح!');
}

function renderDebtors() {
    const container = document.getElementById('debtorsList');
    if (!container) return;
    container.innerHTML = '';
    if (Object.keys(debtors).length === 0) {
        container.innerHTML = '<div class="list-item"><div class="item-info"><div class="item-details"><div class="item-name">لا يوجد مدينين</div></div></div></div>';
        return;
    }
    for (const debtor in debtors) {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `<div class="item-info"><div class="item-icon"><i class="fas fa-file-invoice-dollar"></i></div><div class="item-details"><div class="item-name">${debtor}</div><div class="item-desc">${debtors[debtor].phone} - ${debtors[debtor].dueDate}</div></div></div><span class="debt-amount">${debtors[debtor].amount.toFixed(2)} ر.س</span>`;
        container.appendChild(div);
    }
}

// ==================== سجلات العميل ====================
function showClientRecords(clientName) {
    currentClient = clientName;
    document.getElementById('clientRecordsTitle').textContent = `سجل العميل: ${clientName}`;
    showPage('client-records');
    renderClientRecords();
    renderClientDeliveredAmounts();
}

function renderClientRecords() {
    if (!currentClient || !clients[currentClient]) return;
    const records = clients[currentClient].records || [];
    const container = document.getElementById('clientRecordsTable');
    if (!container) return;
    container.innerHTML = '';
    let total = 0;
    records.forEach((record, idx) => {
        total += record.value;
        container.innerHTML += `<tr><td>${record.item}</td><td>${record.value.toFixed(2)}</td><td>${record.date}</td><td><button onclick="deleteClientRecord(${idx})">حذف</button></td></tr>`;
    });
    document.getElementById('clientTotal').innerHTML = `الإجمالي: ${total.toFixed(2)}`;
}

function renderClientDeliveredAmounts() {
    if (!currentClient || !clients[currentClient]) return;
    const amounts = clients[currentClient].deliveredAmounts || [];
    const container = document.getElementById('clientDeliveredList');
    if (!container) return;
    container.innerHTML = '';
    amounts.forEach((amt, idx) => {
        container.innerHTML += `<div class="list-item"><div>${amt.amount} ر.س - ${amt.date}</div><button onclick="deleteClientDeliveredAmount(${idx})">حذف</button></div>`;
    });
}

// ==================== المبالغ المسلمة ====================
function addDeliveredAmount() {
    const client = document.getElementById('amountClient').value;
    let amount = {};
    if (selectedCurrency === 'sar') {
        amount.amountSAR = parseFloat(document.getElementById('amountValue').value);
        if (!amount.amountSAR) return alert('أدخل المبلغ');
    } else if (selectedCurrency === 'yer') {
        amount.amountYER = parseFloat(document.getElementById('amountValue').value);
        if (!amount.amountYER) return alert('أدخل المبلغ');
    } else {
        amount.amountSAR = parseFloat(document.getElementById('amountValueSAR').value);
        amount.amountYER = parseFloat(document.getElementById('amountValueYER').value);
        if (!amount.amountSAR && !amount.amountYER) return alert('أدخل مبلغاً واحداً على الأقل');
    }
    
    const delivered = { date: new Date().toISOString().split('T')[0], client, ...amount };
    
    if (client && clients[client]) {
        if (!clients[client].deliveredAmounts) clients[client].deliveredAmounts = [];
        clients[client].deliveredAmounts.push(delivered);
    } else {
        deliveredAmounts.push(delivered);
    }
    
    saveData();
    renderDeliveredAmounts();
    alert('تم إضافة المبلغ المسلم بنجاح!');
    document.getElementById('amountValue').value = '';
    document.getElementById('amountValueSAR').value = '';
    document.getElementById('amountValueYER').value = '';
}

function renderDeliveredAmounts() {
    const container = document.getElementById('deliveredAmountsList');
    if (!container) return;
    container.innerHTML = '';
    if (deliveredAmounts.length === 0 && !hasClientDeliveries()) {
        container.innerHTML = '<div class="list-item"><div>لا توجد مبالغ مسلمة</div></div>';
        return;
    }
    // عرض المبالغ العامة
    deliveredAmounts.forEach((amt, idx) => {
        let amountText = '';
        if (amt.amountSAR) amountText += `${amt.amountSAR} ر.س`;
        if (amt.amountYER) amountText += `${amt.amountYER} ر.ي`;
        container.innerHTML += `<div class="list-item"><div>${amountText} - ${amt.date} ${amt.client ? `(${amt.client})` : ''}</div><button onclick="deleteDeliveredAmount(${idx})">حذف</button></div>`;
    });
}

function hasClientDeliveries() {
    for (const client in clients) {
        if (clients[client].deliveredAmounts?.length) return true;
    }
    return false;
}

function deleteDeliveredAmount(idx) {
    if (confirm('حذف المبلغ؟')) {
        deliveredAmounts.splice(idx, 1);
        saveData();
        renderDeliveredAmounts();
    }
}

// ==================== العملات ====================
function selectCurrency(currency) {
    selectedCurrency = currency;
    const singleInput = document.getElementById('singleCurrencyInput');
    const dualInput = document.getElementById('dualCurrencyInput');
    const label = document.getElementById('amountLabel');
    const symbol = document.getElementById('currencySymbol');
    
    if (currency === 'both') {
        singleInput.style.display = 'none';
        dualInput.style.display = 'block';
        label.textContent = 'المبلغ (ريال سعودي وريال يمني)';
    } else {
        singleInput.style.display = 'flex';
        dualInput.style.display = 'none';
        if (currency === 'sar') {
            label.textContent = 'المبلغ (ريال سعودي)';
            symbol.textContent = 'ر.س';
        } else {
            label.textContent = 'المبلغ (ريال يمني)';
            symbol.textContent = 'ر.ي';
        }
    }
}

// ==================== الفواتير والسندات ====================
function showInvoiceModal() { openModal('invoiceModal'); }
function showVoucherModal() { openModal('voucherModal'); }
function showTransferModal() { openModal('transferModal'); }
function addInvoice(e) { e.preventDefault(); alert('تم إنشاء الفاتورة'); closeModal('invoiceModal'); }
function addVoucher(e) { e.preventDefault(); alert('تم إنشاء السند'); closeModal('voucherModal'); }
function addTransfer(e) { e.preventDefault(); alert('تم إنشاء الحوالة'); closeModal('transferModal'); }

// ==================== النوافذ المنبثقة ====================
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// ==================== البحث ====================
function searchData() {
    const query = document.getElementById('searchInput').value;
    if (query.length > 2) alert(`جاري البحث عن: ${query}`);
}

// ==================== جهات الاتصال ====================
function accessDeviceContacts() {
    if ('contacts' in navigator) {
        navigator.contacts.select(['name', 'tel'], { multiple: false })
            .then(contacts => {
                if (contacts.length) {
                    document.getElementById('clientName').value = contacts[0].name[0];
                    document.getElementById('clientPhone').value = contacts[0].tel[0];
                    showClientModal();
                }
            }).catch(() => alert('تعذر الوصول إلى جهات الاتصال'));
    } else {
        alert('المتصفح لا يدعم الوصول إلى جهات الاتصال');
    }
}

function showClientModal() { openModal('clientModal'); }
function showEmployeeModal() { openModal('employeeModal'); }
function showSupplierModal() { openModal('supplierModal'); }
function showDebtorModal() { openModal('debtorModal'); }

// تصدير الدوال للنطاق العام
window.showPage = showPage;
window.loginWithGoogle = loginWithGoogle;
window.loginAsGuest = loginAsGuest;
window.logout = logout;
window.addClient = addClient;
window.addEmployee = addEmployee;
window.addSupplier = addSupplier;
window.addDebtor = addDebtor;
window.addDeliveredAmount = addDeliveredAmount;
window.selectCurrency = selectCurrency;
window.showInvoiceModal = showInvoiceModal;
window.showVoucherModal = showVoucherModal;
window.showTransferModal = showTransferModal;
window.accessDeviceContacts = accessDeviceContacts;
window.showClientModal = showClientModal;
window.showEmployeeModal = showEmployeeModal;
window.showSupplierModal = showSupplierModal;
window.showDebtorModal = showDebtorModal;
window.closeModal = closeModal;
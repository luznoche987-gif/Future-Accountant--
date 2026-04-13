// قاعدة البيانات المحلية (IndexedDB)
let db;
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
let isDarkMode = false;
let currentClient = null;
let currentEmployee = null;
let currentCurrency = 'sar';
let selectedCurrency = 'sar';
let selectedTransactionCurrency = 'sar';
let selectedModalCurrency = 'sar';
let currentCurrencyTab = 'sar';

// تهيئة IndexedDB
function initDB() {
    const request = indexedDB.open('FutureAccountantDB', 1);
    
    request.onerror = function(event) {
        console.log('خطأ في فتح قاعدة البيانات:', event);
        loadFromLocalStorage();
    };
    
    request.onsuccess = function(event) {
        db = event.target.result;
        loadFromIndexedDB();
    };
    
    request.onupgradeneeded = function(event) {
        db = event.target.result;
        
        if (!db.objectStoreNames.contains('clients')) {
            db.createObjectStore('clients', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('employees')) {
            db.createObjectStore('employees', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('suppliers')) {
            db.createObjectStore('suppliers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('debtors')) {
            db.createObjectStore('debtors', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('contacts')) {
            db.createObjectStore('contacts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('deliveredAmounts')) {
            db.createObjectStore('deliveredAmounts', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
        }
    };
}

// تحميل البيانات من IndexedDB
function loadFromIndexedDB() {
    const transaction = db.transaction(['clients', 'employees', 'suppliers', 'debtors', 'contacts', 'deliveredAmounts', 'settings'], 'readonly');
    
    transaction.objectStore('clients').getAll().onsuccess = (e) => {
        const data = e.target.result;
        clients = {};
        data.forEach(item => { clients[item.name] = item.data; });
    };
    
    transaction.objectStore('employees').getAll().onsuccess = (e) => {
        const data = e.target.result;
        employees = {};
        data.forEach(item => { employees[item.name] = item.data; });
    };
    
    transaction.objectStore('suppliers').getAll().onsuccess = (e) => {
        const data = e.target.result;
        suppliers = {};
        data.forEach(item => { suppliers[item.name] = item.data; });
    };
    
    transaction.objectStore('debtors').getAll().onsuccess = (e) => {
        const data = e.target.result;
        debtors = {};
        data.forEach(item => { debtors[item.name] = item.data; });
    };
    
    transaction.objectStore('contacts').getAll().onsuccess = (e) => {
        const data = e.target.result;
        contacts = data.map(item => item.data);
    };
    
    transaction.objectStore('deliveredAmounts').getAll().onsuccess = (e) => {
        deliveredAmounts = e.target.result.map(item => item.data);
    };
    
    transaction.objectStore('settings').get('currency').onsuccess = (e) => {
        if (e.target.result) currentCurrency = e.target.result.value;
    };
    
    transaction.oncomplete = () => {
        updateStats();
        renderClients();
        renderEmployees();
        renderSuppliers();
        renderDebtors();
        renderDeliveredAmounts();
        loadContacts();
        updateHomePage();
    };
}

// حفظ البيانات في IndexedDB
function saveToIndexedDB() {
    if (!db) {
        saveToLocalStorage();
        return;
    }
    
    const transaction = db.transaction(['clients', 'employees', 'suppliers', 'debtors', 'contacts', 'deliveredAmounts', 'settings'], 'readwrite');
    
    // مسح التخزين الحالي
    transaction.objectStore('clients').clear();
    transaction.objectStore('employees').clear();
    transaction.objectStore('suppliers').clear();
    transaction.objectStore('debtors').clear();
    transaction.objectStore('contacts').clear();
    transaction.objectStore('deliveredAmounts').clear();
    
    // إضافة البيانات الجديدة
    for (const [name, data] of Object.entries(clients)) {
        transaction.objectStore('clients').add({ id: name, name: name, data: data });
    }
    
    for (const [name, data] of Object.entries(employees)) {
        transaction.objectStore('employees').add({ id: name, name: name, data: data });
    }
    
    for (const [name, data] of Object.entries(suppliers)) {
        transaction.objectStore('suppliers').add({ id: name, name: name, data: data });
    }
    
    for (const [name, data] of Object.entries(debtors)) {
        transaction.objectStore('debtors').add({ id: name, name: name, data: data });
    }
    
    contacts.forEach((contact, index) => {
        transaction.objectStore('contacts').add({ id: index, data: contact });
    });
    
    deliveredAmounts.forEach((amount, index) => {
        transaction.objectStore('deliveredAmounts').add({ id: index, data: amount });
    });
    
    transaction.objectStore('settings').put({ key: 'currency', value: currentCurrency });
    
    transaction.oncomplete = () => {
        console.log('تم حفظ البيانات في IndexedDB');
    };
    
    // نسخ احتياطي إلى localStorage
    saveToLocalStorage();
}

// حفظ نسخة احتياطية في localStorage
function saveToLocalStorage() {
    localStorage.setItem('clients', JSON.stringify(clients));
    localStorage.setItem('employees', JSON.stringify(employees));
    localStorage.setItem('suppliers', JSON.stringify(suppliers));
    localStorage.setItem('debtors', JSON.stringify(debtors));
    localStorage.setItem('contacts', JSON.stringify(contacts));
    localStorage.setItem('deliveredAmounts', JSON.stringify(deliveredAmounts));
    localStorage.setItem('invoices', JSON.stringify(invoices));
    localStorage.setItem('vouchers', JSON.stringify(vouchers));
    localStorage.setItem('transfers', JSON.stringify(transfers));
    localStorage.setItem('currency', currentCurrency);
}

// تحميل البيانات من localStorage
function loadFromLocalStorage() {
    if(localStorage.getItem('clients')) clients = JSON.parse(localStorage.getItem('clients'));
    if(localStorage.getItem('employees')) employees = JSON.parse(localStorage.getItem('employees'));
    if(localStorage.getItem('suppliers')) suppliers = JSON.parse(localStorage.getItem('suppliers'));
    if(localStorage.getItem('debtors')) debtors = JSON.parse(localStorage.getItem('debtors'));
    if(localStorage.getItem('contacts')) contacts = JSON.parse(localStorage.getItem('contacts'));
    if(localStorage.getItem('deliveredAmounts')) deliveredAmounts = JSON.parse(localStorage.getItem('deliveredAmounts'));
    if(localStorage.getItem('invoices')) invoices = JSON.parse(localStorage.getItem('invoices'));
    if(localStorage.getItem('vouchers')) vouchers = JSON.parse(localStorage.getItem('vouchers'));
    if(localStorage.getItem('transfers')) transfers = JSON.parse(localStorage.getItem('transfers'));
    if(localStorage.getItem('currency')) currentCurrency = localStorage.getItem('currency');
    
    updateStats();
    renderClients();
    renderEmployees();
    renderSuppliers();
    renderDebtors();
    renderDeliveredAmounts();
    loadContacts();
    updateHomePage();
}

function saveData() {
    saveToIndexedDB();
}

// تحديث الصفحة الرئيسية
function updateHomePage() {
    const totalRevenue = calculateTotalRevenue();
    const totalExpenses = calculateTotalExpenses();
    const netProfit = totalRevenue - totalExpenses;
    const treasuryBalance = calculateTreasuryBalance();
    
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-label">الإيرادات</div>
            <div class="stat-value">${formatCurrency(totalRevenue)}</div>
            <div class="stat-change positive"><i class="fas fa-arrow-up"></i><span>+12% عن الشهر الماضي</span></div>
        </div>
        <div class="stat-card">
            <div class="stat-label">المصروفات</div>
            <div class="stat-value">${formatCurrency(totalExpenses)}</div>
            <div class="stat-change negative"><i class="fas fa-arrow-down"></i><span>+5% عن الشهر الماضي</span></div>
        </div>
        <div class="stat-card">
            <div class="stat-label">صافي الربح</div>
            <div class="stat-value">${formatCurrency(netProfit)}</div>
            <div class="stat-change positive"><i class="fas fa-arrow-up"></i><span>+18% عن الشهر الماضي</span></div>
        </div>
        <div class="stat-card">
            <div class="stat-label">رصيد الخزينة</div>
            <div class="stat-value">${formatCurrency(treasuryBalance)}</div>
            <div class="stat-change positive"><i class="fas fa-arrow-up"></i><span>+8% عن الشهر الماضي</span></div>
        </div>
    `;
    
    const quickActions = document.getElementById('quickActions');
    quickActions.innerHTML = `
        <div class="action-card" onclick="showInvoiceModal()"><div class="action-icon"><i class="fas fa-file-invoice"></i></div><div class="action-name">فاتورة جديدة</div></div>
        <div class="action-card" onclick="showVoucherModal()"><div class="action-icon"><i class="fas fa-receipt"></i></div><div class="action-name">سند جديد</div></div>
        <div class="action-card" onclick="showTransferModal()"><div class="action-icon"><i class="fas fa-exchange-alt"></i></div><div class="action-name">حوالة جديدة</div></div>
        <div class="action-card" onclick="accessDeviceContacts()"><div class="action-icon"><i class="fas fa-address-book"></i></div><div class="action-name">جهات الاتصال</div></div>
    `;
    
    const financeGrid = document.getElementById('financeGrid');
    financeGrid.innerHTML = `
        <div class="finance-card" onclick="showPage('clients')"><div class="finance-icon"><i class="fas fa-users"></i></div><div class="finance-value" id="clientsCount">${Object.keys(clients).length}</div><div class="finance-label">العملاء</div></div>
        <div class="finance-card" onclick="showPage('suppliers')"><div class="finance-icon"><i class="fas fa-truck"></i></div><div class="finance-value" id="suppliersCount">${Object.keys(suppliers).length}</div><div class="finance-label">الموردين</div></div>
        <div class="finance-card" onclick="showPage('debts')"><div class="finance-icon"><i class="fas fa-file-invoice-dollar"></i></div><div class="finance-value" id="debtsCount">${Object.keys(debtors).length}</div><div class="finance-label">الديون</div></div>
        <div class="finance-card" onclick="showPage('employees')"><div class="finance-icon"><i class="fas fa-user-tie"></i></div><div class="finance-value" id="employeesCount">${Object.keys(employees).length}</div><div class="finance-label">الموظفين</div></div>
    `;
}

function calculateTotalRevenue() {
    let total = 0;
    invoices.forEach(invoice => { total += invoice.total || 0; });
    vouchers.forEach(voucher => { if (voucher.type === 'قبض') total += voucher.amount; });
    return total;
}

function calculateTotalExpenses() {
    let total = 0;
    vouchers.forEach(voucher => { if (voucher.type === 'صرف') total += voucher.amount; });
    transfers.forEach(transfer => { total += transfer.amount; });
    return total;
}

function calculateTreasuryBalance() {
    return calculateTotalRevenue() - calculateTotalExpenses();
}

function formatCurrency(amount) {
    return amount.toFixed(2) + (currentCurrency === 'sar' ? ' ر.س' : currentCurrency === 'yer' ? ' ر.ي' : '');
}

// تحديث الإحصائيات
function updateStats() {
    const clientsCount = document.getElementById('clientsCount');
    const employeesCount = document.getElementById('employeesCount');
    const suppliersCount = document.getElementById('suppliersCount');
    const debtsCount = document.getElementById('debtsCount');
    
    if (clientsCount) clientsCount.textContent = Object.keys(clients).length;
    if (employeesCount) employeesCount.textContent = Object.keys(employees).length;
    if (suppliersCount) suppliersCount.textContent = Object.keys(suppliers).length;
    if (debtsCount) debtsCount.textContent = Object.keys(debtors).length;
}

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    initDB();
    updateDateTime();
    setInterval(updateDateTime, 60000);
    initTheme();
    checkLoginStatus();
    
    document.getElementById('loginForm').addEventListener('submit', login);
    document.getElementById('clientForm').addEventListener('submit', addClient);
    document.getElementById('employeeForm').addEventListener('submit', addEmployee);
    document.getElementById('supplierForm').addEventListener('submit', addSupplier);
    document.getElementById('debtorForm').addEventListener('submit', addDebtor);
    document.getElementById('addTransactionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addClientTransaction();
    });
    document.getElementById('addDeliveredAmountForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addClientDeliveredAmount();
    });
    document.getElementById('searchInput').addEventListener('input', searchData);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    setTimeout(showDeveloperNotification, 1000);
});

// تحديث التاريخ والوقت
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('ar-SA', options);
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    
    const dateElement = document.getElementById('currentDate');
    const timeElement = document.getElementById('currentTime');
    if (dateElement) dateElement.textContent = dateStr;
    if (timeElement) timeElement.textContent = timeStr;
}

// التحقق من حالة تسجيل الدخول
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
    const loginPage = document.getElementById('login-page');
    const mainApp = document.getElementById('main-app');
    if (loginPage) loginPage.style.display = 'block';
    if (mainApp) mainApp.style.display = 'none';
}

function showMainApp() {
    const loginPage = document.getElementById('login-page');
    const mainApp = document.getElementById('main-app');
    if (loginPage) loginPage.style.display = 'none';
    if (mainApp) mainApp.style.display = 'block';
    updateStats();
    renderClients();
    renderEmployees();
    renderSuppliers();
    renderDebtors();
    loadContacts();
    renderDeliveredAmounts();
    updateHomePage();
}

// وظائف تسجيل الدخول
function login(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (email && password) {
        currentUser = { email: email, name: email.split('@')[0], type: 'email' };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showMainApp();
        alert('تم تسجيل الدخول بنجاح!');
        setTimeout(showDeveloperNotification, 500);
    } else {
        alert('يرجى إدخال البريد الإلكتروني وكلمة المرور');
    }
}

function loginWithGoogle() {
    currentUser = { name: 'مستخدم جوجل', email: 'user@gmail.com', type: 'google' };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showMainApp();
    alert('تم تسجيل الدخول بحساب جوجل بنجاح!');
    setTimeout(showDeveloperNotification, 500);
}

function loginAsGuest() {
    currentUser = { name: 'ضيف', type: 'guest' };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showMainApp();
    alert('تم الدخول كضيف بنجاح!');
    setTimeout(showDeveloperNotification, 500);
}

function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showLoginScreen();
        alert('تم تسجيل الخروج بنجاح!');
    }
}

// وظائف المظهر
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        enableDarkMode();
    } else {
        enableLightMode();
    }
}

function enableDarkMode() {
    document.body.classList.add('dark-theme');
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) themeIcon.className = 'fas fa-sun';
    isDarkMode = true;
    localStorage.setItem('theme', 'dark');
}

function enableLightMode() {
    document.body.classList.remove('dark-theme');
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) themeIcon.className = 'fas fa-moon';
    isDarkMode = false;
    localStorage.setItem('theme', 'light');
}

function toggleTheme() {
    if (isDarkMode) {
        enableLightMode();
    } else {
        enableDarkMode();
    }
}

// وظائف عرض الصفحات
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) targetPage.classList.add('active');
    
    const navItems = document.querySelectorAll('.nav-item');
    const pageMap = { home: 0, clients: 1, suppliers: 2, debts: 3, employees: 4, reports: 5, settings: 6 };
    if (navItems[pageMap[pageId]]) navItems[pageMap[pageId]].classList.add('active');
}

// وظائف النوافذ المنبثقة
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function showClientModal() { openModal('clientModal'); }
function showEmployeeModal() { openModal('employeeModal'); }
function showSupplierModal() { openModal('supplierModal'); }
function showDebtorModal() { openModal('debtorModal'); }
function showInvoiceModal() { openModal('invoiceModal'); }
function showVoucherModal() { openModal('voucherModal'); }
function showTransferModal() { openModal('transferModal'); }
function showContactsModal() { openModal('contactsModal'); renderContacts(); }
function showCurrencySettings() { openModal('currencySettingsModal'); }
function showAddTransactionModal() {
    document.getElementById('transactionItemName').value = '';
    document.getElementById('transactionValue').value = '';
    document.getElementById('transactionValueSAR').value = '';
    document.getElementById('transactionValueYER').value = '';
    selectTransactionCurrency('sar');
    openModal('addTransactionModal');
}
function showAddDeliveredAmountModal() {
    document.getElementById('deliveredAmount').value = '';
    document.getElementById('deliveredAmountSAR').value = '';
    document.getElementById('deliveredAmountYER').value = '';
    document.getElementById('deliveredAmountDate').value = new Date().toISOString().split('T')[0];
    selectModalCurrency('sar');
    openModal('addDeliveredAmountModal');
}

// وظائف العملات
function selectCurrency(currency) {
    selectedCurrency = currency;
    const options = document.querySelectorAll('#homeCurrencyToggle .currency-option');
    options.forEach(opt => opt.classList.remove('active'));
    
    if (currency === 'sar') {
        options[0]?.classList.add('active');
        document.getElementById('amountLabel').textContent = 'المبلغ (ريال سعودي)';
        document.getElementById('currencySymbol').textContent = 'ر.س';
        document.getElementById('singleCurrencyInput').style.display = 'flex';
        document.getElementById('dualCurrencyInput').style.display = 'none';
    } else if (currency === 'yer') {
        options[1]?.classList.add('active');
        document.getElementById('amountLabel').textContent = 'المبلغ (ريال يمني)';
        document.getElementById('currencySymbol').textContent = 'ر.ي';
        document.getElementById('singleCurrencyInput').style.display = 'flex';
        document.getElementById('dualCurrencyInput').style.display = 'none';
    } else if (currency === 'both') {
        options[2]?.classList.add('active');
        document.getElementById('amountLabel').textContent = 'المبلغ (ريال سعودي وريال يمني)';
        document.getElementById('singleCurrencyInput').style.display = 'none';
        document.getElementById('dualCurrencyInput').style.display = 'block';
    }
}

function selectTransactionCurrency(currency) {
    selectedTransactionCurrency = currency;
    const options = document.querySelectorAll('#addTransactionModal .currency-option');
    options.forEach(opt => opt.classList.remove('active'));
    
    if (currency === 'sar') {
        options[0]?.classList.add('active');
        document.getElementById('transactionAmountLabel').textContent = 'القيمة (ريال سعودي)';
        document.getElementById('transactionCurrencySymbol').textContent = 'ر.س';
        document.getElementById('transactionSingleCurrencyInput').style.display = 'flex';
        document.getElementById('transactionDualCurrencyInput').style.display = 'none';
    } else if (currency === 'yer') {
        options[1]?.classList.add('active');
        document.getElementById('transactionAmountLabel').textContent = 'القيمة (ريال يمني)';
        document.getElementById('transactionCurrencySymbol').textContent = 'ر.ي';
        document.getElementById('transactionSingleCurrencyInput').style.display = 'flex';
        document.getElementById('transactionDualCurrencyInput').style.display = 'none';
    } else if (currency === 'both') {
        options[2]?.classList.add('active');
        document.getElementById('transactionAmountLabel').textContent = 'القيمة (ريال سعودي وريال يمني)';
        document.getElementById('transactionSingleCurrencyInput').style.display = 'none';
        document.getElementById('transactionDualCurrencyInput').style.display = 'block';
    }
}

function selectModalCurrency(currency) {
    selectedModalCurrency = currency;
    const options = document.querySelectorAll('#addDeliveredAmountModal .currency-option');
    options.forEach(opt => opt.classList.remove('active'));
    
    if (currency === 'sar') {
        options[0]?.classList.add('active');
        document.getElementById('modalAmountLabel').textContent = 'المبلغ (ريال سعودي)';
        document.getElementById('modalCurrencySymbol').textContent = 'ر.س';
        document.getElementById('modalSingleCurrencyInput').style.display = 'flex';
        document.getElementById('modalDualCurrencyInput').style.display = 'none';
    } else if (currency === 'yer') {
        options[1]?.classList.add('active');
        document.getElementById('modalAmountLabel').textContent = 'المبلغ (ريال يمني)';
        document.getElementById('modalCurrencySymbol').textContent = 'ر.ي';
        document.getElementById('modalSingleCurrencyInput').style.display = 'flex';
        document.getElementById('modalDualCurrencyInput').style.display = 'none';
    } else if (currency === 'both') {
        options[2]?.classList.add('active');
        document.getElementById('modalAmountLabel').textContent = 'المبلغ (ريال سعودي وريال يمني)';
        document.getElementById('modalSingleCurrencyInput').style.display = 'none';
        document.getElementById('modalDualCurrencyInput').style.display = 'block';
    }
}

function setDefaultCurrency(currency) {
    currentCurrency = currency;
    saveData();
    alert('تم حفظ إعدادات العملة بنجاح!');
}

function switchCurrencyTab(currency) {
    currentCurrencyTab = currency;
    document.querySelectorAll('.currency-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.currency-content').forEach(content => content.classList.remove('active'));
    
    if (currency === 'sar') {
        document.querySelector('.currency-tab:nth-child(1)')?.classList.add('active');
        document.getElementById('sar-content')?.classList.add('active');
    } else if (currency === 'yer') {
        document.querySelector('.currency-tab:nth-child(2)')?.classList.add('active');
        document.getElementById('yer-content')?.classList.add('active');
    } else if (currency === 'all') {
        document.querySelector('.currency-tab:nth-child(3)')?.classList.add('active');
        document.getElementById('all-content')?.classList.add('active');
    }
    
    renderClientRecords();
    renderClientDeliveredAmounts();
}

// وظائف إدارة العملاء
function addClient(e) {
    e.preventDefault();
    const name = document.getElementById('clientName').value;
    const phone = document.getElementById('clientPhone').value;
    const email = document.getElementById('clientEmail').value;
    const address = document.getElementById('clientAddress').value;
    
    clients[name] = {
        phone: phone, email: email, address: address,
        joinDate: new Date().toISOString().split('T')[0],
        records: [], deliveredAmounts: []
    };
    
    saveData();
    renderClients();
    
    const clientSelect = document.getElementById('amountClient');
    if (clientSelect) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        clientSelect.appendChild(option);
    }
    
    closeModal('clientModal');
    alert('تم إضافة العميل بنجاح!');
}

function renderClients() {
    const container = document.getElementById('clientsList');
    if (!container) return;
    container.innerHTML = '';
    
    if (Object.keys(clients).length === 0) {
        container.innerHTML = '<div class="list-item"><div class="item-info"><div class="item-details"><div class="item-name">لا يوجد عملاء</div><div class="item-desc">قم بإضافة عميل جديد</div></div></div></div>';
        return;
    }
    
    for (const client in clients) {
        const clientElement = document.createElement('div');
        clientElement.className = 'list-item';
        clientElement.onclick = () => showClientRecords(client);
        clientElement.innerHTML = `
            <div class="client-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div class="item-info">
                    <div class="item-icon"><i class="fas fa-user"></i></div>
                    <div class="item-details"><div class="item-name">${client}</div><div class="item-desc">${clients[client].phone}</div></div>
                </div>
                <div class="client-actions" style="display: flex; gap: 5px;">
                    <button class="contacts-btn" onclick="event.stopPropagation(); addClientToContacts('${client}')" style="background: none; border: none; color: var(--primary); font-size: 16px; cursor: pointer;"><i class="fas fa-address-book"></i></button>
                    <button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="event.stopPropagation(); deleteClient('${client}')"><i class="fas fa-trash"></i></button>
                    <i class="fas fa-chevron-left"></i>
                </div>
            </div>
        `;
        container.appendChild(clientElement);
    }
}

function addClientToContacts(clientName) {
    const client = clients[clientName];
    const existingContact = contacts.find(contact => contact.phone === client.phone);
    if (existingContact) {
        alert('هذا العميل موجود بالفعل في جهات الاتصال!');
        return;
    }
    contacts.push({ name: clientName, phone: client.phone, email: client.email || '', address: client.address || '' });
    saveData();
    alert(`تم إضافة ${clientName} إلى جهات الاتصال بنجاح!`);
}

function deleteClient(clientName) {
    if (confirm(`هل أنت متأكد من حذف العميل "${clientName}"؟ سيتم حذف جميع سجلاته أيضًا.`)) {
        delete clients[clientName];
        saveData();
        renderClients();
        
        const clientSelect = document.getElementById('amountClient');
        if (clientSelect) {
            for (let i = 0; i < clientSelect.options.length; i++) {
                if (clientSelect.options[i].value === clientName) {
                    clientSelect.remove(i);
                    break;
                }
            }
        }
        alert('تم حذف العميل بنجاح!');
    }
}

function showClientRecords(clientName) {
    currentClient = clientName;
    const titleElement = document.getElementById('clientRecordsTitle');
    if (titleElement) titleElement.textContent = `سجل العميل: ${clientName}`;
    showPage('client-records');
    renderClientRecords();
    renderClientDeliveredAmounts();
    updateClientBalance();
}

function renderClientRecords() {
    if (!currentClient || !clients[currentClient]) return;
    
    const client = clients[currentClient];
    let totalSAR = 0, totalYER = 0;
    
    const sarContainer = document.getElementById('clientRecordsTableSAR');
    const yerContainer = document.getElementById('clientRecordsTableYER');
    const allContainer = document.getElementById('clientRecordsTableALL');
    
    if (sarContainer) sarContainer.innerHTML = '';
    if (yerContainer) yerContainer.innerHTML = '';
    if (allContainer) allContainer.innerHTML = '';
    
    if (client.records && client.records.length > 0) {
        client.records.forEach((record, index) => {
            const valueSAR = record.valueSAR || 0;
            const valueYER = record.valueYER || 0;
            totalSAR += valueSAR;
            totalYER += valueYER;
            
            if (valueSAR > 0 && sarContainer) {
                const rowSAR = document.createElement('tr');
                rowSAR.innerHTML = `<td>${record.item}</td><td>${valueSAR.toFixed(2)}</td><td>${record.takenDate || record.date}</td><td>${record.time}</td><td><button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="deleteClientRecord(${index})"><i class="fas fa-trash"></i></button></td>`;
                sarContainer.appendChild(rowSAR);
            }
            
            if (valueYER > 0 && yerContainer) {
                const rowYER = document.createElement('tr');
                rowYER.innerHTML = `<td>${record.item}</td><td>${valueYER.toFixed(2)}</td><td>${record.takenDate || record.date}</td><td>${record.time}</td><td><button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="deleteClientRecord(${index})"><i class="fas fa-trash"></i></button></td>`;
                yerContainer.appendChild(rowYER);
            }
            
            if (allContainer) {
                const rowALL = document.createElement('tr');
                rowALL.innerHTML = `<td>${record.item}</td><td>${valueSAR > 0 ? valueSAR.toFixed(2) : '0.00'}</td><td>${valueYER > 0 ? valueYER.toFixed(2) : '0.00'}</td><td>${record.takenDate || record.date}</td><td>${record.time}</td><td><button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="deleteClientRecord(${index})"><i class="fas fa-trash"></i></button></td>`;
                allContainer.appendChild(rowALL);
            }
        });
    }
    
    const totalSARElement = document.getElementById('clientTotalSAR');
    const totalYERElement = document.getElementById('clientTotalYER');
    const totalALLElement = document.getElementById('clientTotalALL');
    
    if (totalSARElement) totalSARElement.textContent = `الإجمالي: ${totalSAR.toFixed(2)} ر.س`;
    if (totalYERElement) totalYERElement.textContent = `الإجمالي: ${totalYER.toFixed(2)} ر.ي`;
    if (totalALLElement) totalALLElement.textContent = `الإجمالي: ${totalSAR.toFixed(2)} ر.س / ${totalYER.toFixed(2)} ر.ي`;
}

function renderClientDeliveredAmounts() {
    if (!currentClient || !clients[currentClient]) return;
    
    const client = clients[currentClient];
    const sarContainer = document.getElementById('clientDeliveredAmountsListSAR');
    const yerContainer = document.getElementById('clientDeliveredAmountsListYER');
    const allContainer = document.getElementById('clientDeliveredAmountsListALL');
    
    if (sarContainer) sarContainer.innerHTML = '';
    if (yerContainer) yerContainer.innerHTML = '';
    if (allContainer) allContainer.innerHTML = '';
    
    let totalSAR = 0, totalYER = 0;
    
    if (client.deliveredAmounts && client.deliveredAmounts.length > 0) {
        client.deliveredAmounts.forEach((amount, index) => {
            const valueSAR = amount.amountSAR || 0;
            const valueYER = amount.amountYER || 0;
            totalSAR += valueSAR;
            totalYER += valueYER;
            
            if (valueSAR > 0 && sarContainer) {
                const el = document.createElement('div');
                el.className = 'list-item';
                el.innerHTML = `<div class="item-info"><div class="item-icon"><i class="fas fa-money-bill-wave"></i></div><div class="item-details"><div class="item-name">${valueSAR.toFixed(2)} ر.س</div><div class="item-desc">${amount.date}</div></div></div><div><span class="delivered-amount">${valueSAR.toFixed(2)} ر.س</span><button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px; margin-right: 10px;" onclick="deleteClientDeliveredAmount(${index})"><i class="fas fa-trash"></i></button></div>`;
                sarContainer.appendChild(el);
            }
            
            if (valueYER > 0 && yerContainer) {
                const el = document.createElement('div');
                el.className = 'list-item';
                el.innerHTML = `<div class="item-info"><div class="item-icon"><i class="fas fa-coins"></i></div><div class="item-details"><div class="item-name">${valueYER.toFixed(2)} ر.ي</div><div class="item-desc">${amount.date}</div></div></div><div><span class="delivered-amount">${valueYER.toFixed(2)} ر.ي</span><button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px; margin-right: 10px;" onclick="deleteClientDeliveredAmount(${index})"><i class="fas fa-trash"></i></button></div>`;
                yerContainer.appendChild(el);
            }
            
            if (allContainer) {
                const el = document.createElement('div');
                el.className = 'list-item';
                el.innerHTML = `<div class="item-info"><div class="item-icon"><i class="fas fa-exchange-alt"></i></div><div class="item-details"><div class="item-name">${valueSAR > 0 ? valueSAR.toFixed(2) + ' ر.س' : ''}${valueSAR > 0 && valueYER > 0 ? ' / ' : ''}${valueYER > 0 ? valueYER.toFixed(2) + ' ر.ي' : ''}</div><div class="item-desc">${amount.date}</div></div></div><div><span class="delivered-amount">${valueSAR > 0 ? valueSAR.toFixed(2) + ' ر.س' : ''}${valueSAR > 0 && valueYER > 0 ? ' / ' : ''}${valueYER > 0 ? valueYER.toFixed(2) + ' ر.ي' : ''}</span><button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px; margin-right: 10px;" onclick="deleteClientDeliveredAmount(${index})"><i class="fas fa-trash"></i></button></div>`;
                allContainer.appendChild(el);
            }
        });
    }
}

function addClientTransaction() {
    if (!currentClient) return;
    const item = document.getElementById('transactionItemName').value;
    if (!item) { alert('يرجى إدخال اسم الصنف'); return; }
    
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    
    if (!clients[currentClient].records) clients[currentClient].records = [];
    
    const record = { item: item, date: dateStr, time: timeStr, takenDate: dateStr };
    
    if (selectedTransactionCurrency === 'sar') {
        const value = parseFloat(document.getElementById('transactionValue').value) || 0;
        if (value === 0) { alert('يرجى إدخال قيمة للمعاملة'); return; }
        record.valueSAR = value;
    } else if (selectedTransactionCurrency === 'yer') {
        const value = parseFloat(document.getElementById('transactionValue').value) || 0;
        if (value === 0) { alert('يرجى إدخال قيمة للمعاملة'); return; }
        record.valueYER = value;
    } else if (selectedTransactionCurrency === 'both') {
        const valueSAR = parseFloat(document.getElementById('transactionValueSAR').value) || 0;
        const valueYER = parseFloat(document.getElementById('transactionValueYER').value) || 0;
        if (valueSAR === 0 && valueYER === 0) { alert('يرجى إدخال قيمة على الأقل في أحد العملتين'); return; }
        if (valueSAR > 0) record.valueSAR = valueSAR;
        if (valueYER > 0) record.valueYER = valueYER;
    }
    
    clients[currentClient].records.push(record);
    saveData();
    renderClientRecords();
    updateClientBalance();
    closeModal('addTransactionModal');
    alert('تم إضافة المعاملة بنجاح!');
}

function addClientDeliveredAmount() {
    if (!currentClient) return;
    const date = document.getElementById('deliveredAmountDate').value;
    const deliveredAmount = { date: date };
    
    if (selectedModalCurrency === 'sar') {
        const amount = parseFloat(document.getElementById('deliveredAmount').value) || 0;
        if (amount === 0) { alert('يرجى إدخال المبلغ'); return; }
        deliveredAmount.amountSAR = amount;
    } else if (selectedModalCurrency === 'yer') {
        const amount = parseFloat(document.getElementById('deliveredAmount').value) || 0;
        if (amount === 0) { alert('يرجى إدخال المبلغ'); return; }
        deliveredAmount.amountYER = amount;
    } else if (selectedModalCurrency === 'both') {
        const amountSAR = parseFloat(document.getElementById('deliveredAmountSAR').value) || 0;
        const amountYER = parseFloat(document.getElementById('deliveredAmountYER').value) || 0;
        if (amountSAR === 0 && amountYER === 0) { alert('يرجى إدخال مبلغ على الأقل في أحد العملتين'); return; }
        if (amountSAR > 0) deliveredAmount.amountSAR = amountSAR;
        if (amountYER > 0) deliveredAmount.amountYER = amountYER;
    }
    
    if (!clients[currentClient].deliveredAmounts) clients[currentClient].deliveredAmounts = [];
    clients[currentClient].deliveredAmounts.push(deliveredAmount);
    saveData();
    renderClientDeliveredAmounts();
    updateClientBalance();
    closeModal('addDeliveredAmountModal');
    alert('تم إضافة المبلغ المسلم بنجاح!');
}

function deleteClientRecord(index) {
    if (!currentClient || !confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;
    clients[currentClient].records.splice(index, 1);
    saveData();
    renderClientRecords();
    updateClientBalance();
    alert('تم حذف المعاملة بنجاح!');
}

function deleteClientDeliveredAmount(index) {
    if (!currentClient || !confirm('هل أنت متأكد من حذف هذا المبلغ المسلم؟')) return;
    clients[currentClient].deliveredAmounts.splice(index, 1);
    saveData();
    renderClientDeliveredAmounts();
    updateClientBalance();
    alert('تم حذف المبلغ المسلم بنجاح!');
}

function deleteClientAccount() {
    if (!currentClient) return;
    if (confirm(`هل أنت متأكد من حذف حساب العميل "${currentClient}" بالكامل؟`)) {
        delete clients[currentClient];
        saveData();
        showPage('clients');
        const clientSelect = document.getElementById('amountClient');
        if (clientSelect) {
            for (let i = 0; i < clientSelect.options.length; i++) {
                if (clientSelect.options[i].value === currentClient) {
                    clientSelect.remove(i);
                    break;
                }
            }
        }
        alert('تم حذف حساب العميل بالكامل!');
    }
}

function updateClientBalance() {
    if (!currentClient || !clients[currentClient]) return;
    const client = clients[currentClient];
    let totalPurchasesSAR = 0, totalPurchasesYER = 0;
    let totalDeliveredSAR = 0, totalDeliveredYER = 0;
    
    if (client.records) {
        client.records.forEach(record => {
            totalPurchasesSAR += record.valueSAR || 0;
            totalPurchasesYER += record.valueYER || 0;
        });
    }
    
    if (client.deliveredAmounts) {
        client.deliveredAmounts.forEach(amount => {
            totalDeliveredSAR += amount.amountSAR || 0;
            totalDeliveredYER += amount.amountYER || 0;
        });
    }
    
    const balanceSAR = totalPurchasesSAR - totalDeliveredSAR;
    const balanceYER = totalPurchasesYER - totalDeliveredYER;
    
    const balanceContainer = document.querySelector('.balance-info');
    if (balanceContainer) {
        balanceContainer.innerHTML = `
            <div class="balance-container">
                <div class="balance-item"><span class="balance-label">الرصيد المتبقي (ر.س):</span><span class="balance-amount ${balanceSAR > 0 ? 'balance-negative' : balanceSAR < 0 ? 'balance-positive' : ''}">${balanceSAR.toFixed(2)} ر.س</span></div>
                <div class="balance-item"><span class="balance-label">الرصيد المتبقي (ر.ي):</span><span class="balance-amount ${balanceYER > 0 ? 'balance-negative' : balanceYER < 0 ? 'balance-positive' : ''}">${balanceYER.toFixed(2)} ر.ي</span></div>
            </div>
        `;
    }
}

function sendClientStatement(method) {
    if (!currentClient) return;
    const client = clients[currentClient];
    let message = `كشف حساب العميل: ${currentClient}\n═════════════════\n\n`;
    let totalPurchasesSAR = 0, totalPurchasesYER = 0;
    
    if (client.records && client.records.length > 0) {
        message += `🛒 المشتريات والخدمات:\n══════════════════\n`;
        client.records.forEach(record => {
            const valueSAR = record.valueSAR || 0;
            const valueYER = record.valueYER || 0;
            totalPurchasesSAR += valueSAR;
            totalPurchasesYER += valueYER;
            let recordText = `• ${record.item}: `;
            if (valueSAR > 0) recordText += `${valueSAR.toFixed(2)} ر.س`;
            if (valueSAR > 0 && valueYER > 0) recordText += ' / ';
            if (valueYER > 0) recordText += `${valueYER.toFixed(2)} ر.ي`;
            recordText += ` (${record.takenDate || record.date} - ${record.time})\n`;
            message += recordText;
        });
        message += `\n`;
    }
    
    if (totalPurchasesSAR > 0) message += `💰 إجمالي المشتريات (ريال سعودي):\n${totalPurchasesSAR.toFixed(2)} ر.س\n\n`;
    if (totalPurchasesYER > 0) message += `💰 إجمالي المشتريات (ريال يمني):\n${totalPurchasesYER.toFixed(2)} ر.ي\n\n`;
    
    let totalDeliveredSAR = 0, totalDeliveredYER = 0;
    if (client.deliveredAmounts && client.deliveredAmounts.length > 0) {
        message += `💵 المبالغ المسلمة:\n═════════════════\n`;
        client.deliveredAmounts.forEach(amount => {
            const valueSAR = amount.amountSAR || 0;
            const valueYER = amount.amountYER || 0;
            totalDeliveredSAR += valueSAR;
            totalDeliveredYER += valueYER;
            let amountText = `• `;
            if (valueSAR > 0) amountText += `${valueSAR.toFixed(2)} ر.س`;
            if (valueSAR > 0 && valueYER > 0) amountText += ' / ';
            if (valueYER > 0) amountText += `${valueYER.toFixed(2)} ر.ي`;
            amountText += ` (${amount.date})\n`;
            message += amountText;
        });
        message += `\n`;
    }
    
    if (totalDeliveredSAR > 0) message += `💳 إجمالي المبالغ المسلمة (ريال سعودي):\n${totalDeliveredSAR.toFixed(2)} ر.س\n\n`;
    if (totalDeliveredYER > 0) message += `💳 إجمالي المبالغ المسلمة (ريال يمني):\n${totalDeliveredYER.toFixed(2)} ر.ي\n\n`;
    
    const balanceSAR = totalPurchasesSAR - totalDeliveredSAR;
    const balanceYER = totalPurchasesYER - totalDeliveredYER;
    message += `⚖️ الرصيد المتبقي:\n═════════════════════\n`;
    if (balanceSAR !== 0) message += `• ${balanceSAR.toFixed(2)} ر.س\n`;
    if (balanceYER !== 0) message += `• ${balanceYER.toFixed(2)} ر.ي\n\n`;
    message += `─────────────────\nشكراً لتعاملكم معنا 🌟\nمحاسب المستقبل\nمطور بواسطة: عبد الوهاب عبد الواحد الريمي`;
    
    if (method === 'whatsapp') {
        const phone = client.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else if (method === 'sms') {
        const cleanPhone = client.phone.replace(/\D/g, '');
        window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
    }
}

// وظائف إدارة الموظفين
function addEmployee(e) {
    e.preventDefault();
    const name = document.getElementById('employeeName').value;
    const phone = document.getElementById('employeePhone').value;
    const salary = parseFloat(document.getElementById('employeeSalary').value);
    const position = document.getElementById('employeePosition').value;
    
    employees[name] = { phone: phone, salary: salary, position: position, joinDate: new Date().toISOString().split('T')[0], records: [] };
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
        container.innerHTML = '<div class="list-item"><div class="item-info"><div class="item-details"><div class="item-name">لا يوجد موظفين</div><div class="item-desc">قم بإضافة موظف جديد</div></div></div></div>';
        return;
    }
    
    for (const employee in employees) {
        const employeeElement = document.createElement('div');
        employeeElement.className = 'list-item';
        employeeElement.onclick = () => showEmployeeRecords(employee);
        employeeElement.innerHTML = `
            <div class="item-info"><div class="item-icon"><i class="fas fa-user-tie"></i></div><div class="item-details"><div class="item-name">${employee}</div><div class="item-desc">${employees[employee].position} - ${employees[employee].salary.toFixed(2)} ر.س</div></div></div>
            <div><button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px; margin-left: 5px;" onclick="event.stopPropagation(); deleteEmployee('${employee}')"><i class="fas fa-trash"></i></button><i class="fas fa-chevron-left"></i></div>
        `;
        container.appendChild(employeeElement);
    }
}

function deleteEmployee(employeeName) {
    if (confirm(`هل أنت متأكد من حذف الموظف "${employeeName}"؟ سيتم حذف جميع سجلاته أيضًا.`)) {
        delete employees[employeeName];
        saveData();
        renderEmployees();
        alert('تم حذف الموظف بنجاح!');
    }
}

function showEmployeeRecords(employeeName) {
    currentEmployee = employeeName;
    const titleElement = document.getElementById('employeeRecordsTitle');
    if (titleElement) titleElement.textContent = `سجل الموظف: ${employeeName}`;
    showPage('employee-records');
    renderEmployeeRecords();
}

function renderEmployeeRecords() {
    if (!currentEmployee || !employees[currentEmployee]) return;
    const container = document.getElementById('employeeRecordsTable');
    if (!container) return;
    container.innerHTML = '';
    const employee = employees[currentEmployee];
    let total = 0;
    
    if (employee.records && employee.records.length > 0) {
        employee.records.forEach((record, index) => {
            total += record.value;
            const row = document.createElement('tr');
            row.innerHTML = `<td>${record.item}</td><td>${record.value.toFixed(2)}</td><td>${record.date}</td><td>-</td><td><button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="deleteEmployeeRecord(${index})"><i class="fas fa-trash"></i></button></td>`;
            container.appendChild(row);
        });
    }
    
    const totalElement = document.getElementById('employeeTotal');
    if (totalElement) totalElement.textContent = `الإجمالي: ${total.toFixed(2)}`;
}

function addEmployeeRecord() {
    if (!currentEmployee) return;
    const item = document.getElementById('employeeItemName').value;
    const value = parseFloat(document.getElementById('employeeItemValue').value);
    if (!item || !value) { alert('يرجى ملء جميع الحقول'); return; }
    
    const dateStr = new Date().toISOString().split('T')[0];
    if (!employees[currentEmployee].records) employees[currentEmployee].records = [];
    employees[currentEmployee].records.push({ item: item, value: value, date: dateStr });
    
    document.getElementById('employeeItemName').value = '';
    document.getElementById('employeeItemValue').value = '';
    saveData();
    renderEmployeeRecords();
    alert('تم إضافة المعاملة بنجاح!');
}

function deleteEmployeeRecord(index) {
    if (!currentEmployee || !confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;
    employees[currentEmployee].records.splice(index, 1);
    saveData();
    renderEmployeeRecords();
    alert('تم حذف المعاملة بنجاح!');
}

function deleteEmployeeAccount() {
    if (!currentEmployee) return;
    if (confirm(`هل أنت متأكد من حذف حساب الموظف "${currentEmployee}" بالكامل؟`)) {
        delete employees[currentEmployee];
        saveData();
        showPage('employees');
        alert('تم حذف حساب الموظف بالكامل!');
    }
}

// وظائف إدارة الموردين
function addSupplier(e) {
    e.preventDefault();
    const name = document.getElementById('supplierName').value;
    const phone = document.getElementById('supplierPhone').value;
    const email = document.getElementById('supplierEmail').value;
    const address = document.getElementById('supplierAddress').value;
    
    suppliers[name] = { phone: phone, email: email, address: address, joinDate: new Date().toISOString().split('T')[0] };
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
        container.innerHTML = '<div class="list-item"><div class="item-info"><div class="item-details"><div class="item-name">لا يوجد موردين</div><div class="item-desc">قم بإضافة مورد جديد</div></div></div></div>';
        return;
    }
    
    for (const supplier in suppliers) {
        const supplierElement = document.createElement('div');
        supplierElement.className = 'list-item';
        supplierElement.innerHTML = `
            <div class="item-info"><div class="item-icon"><i class="fas fa-truck"></i></div><div class="item-details"><div class="item-name">${supplier}</div><div class="item-desc">${suppliers[supplier].phone}</div></div></div>
            <div><button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px; margin-left: 5px;" onclick="deleteSupplier('${supplier}')"><i class="fas fa-trash"></i></button><i class="fas fa-chevron-left"></i></div>
        `;
        container.appendChild(supplierElement);
    }
}

function deleteSupplier(supplierName) {
    if (confirm(`هل أنت متأكد من حذف المورد "${supplierName}"؟`)) {
        delete suppliers[supplierName];
        saveData();
        renderSuppliers();
        alert('تم حذف المورد بنجاح!');
    }
}

// وظائف إدارة الديون
function addDebtor(e) {
    e.preventDefault();
    const name = document.getElementById('debtorName').value;
    const phone = document.getElementById('debtorPhone').value;
    const amount = parseFloat(document.getElementById('debtorAmount').value);
    const dueDate = document.getElementById('debtorDueDate').value;
    
    debtors[name] = { phone: phone, amount: amount, dueDate: dueDate, joinDate: new Date().toISOString().split('T')[0] };
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
        container.innerHTML = '<div class="list-item"><div class="item-info"><div class="item-details"><div class="item-name">لا يوجد مدينين</div><div class="item-desc">قم بإضافة مدين جديد</div></div></div></div>';
        return;
    }
    
    for (const debtor in debtors) {
        const debtorElement = document.createElement('div');
        debtorElement.className = 'list-item';
        debtorElement.innerHTML = `
            <div class="item-info"><div class="item-icon"><i class="fas fa-file-invoice-dollar"></i></div><div class="item-details"><div class="item-name">${debtor}</div><div class="item-desc">${debtors[debtor].phone} - ${debtors[debtor].dueDate}</div></div></div>
            <div style="display: flex; align-items: center; gap: 10px;"><span class="debt-amount">${debtors[debtor].amount.toFixed(2)} ر.س</span><button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="deleteDebtor('${debtor}')"><i class="fas fa-trash"></i></button></div>
        `;
        container.appendChild(debtorElement);
    }
}

function deleteDebtor(debtorName) {
    if (confirm(`هل أنت متأكد من حذف المدين "${debtorName}"؟`)) {
        delete debtors[debtorName];
        saveData();
        renderDebtors();
        alert('تم حذف المدين بنجاح!');
    }
}

// وظائف المبالغ المسلمة
function addDeliveredAmount() {
    const client = document.getElementById('amountClient').value;
    const dateStr = new Date().toISOString().split('T')[0];
    const deliveredAmount = { date: dateStr, client: client };
    
    if (selectedCurrency === 'sar') {
        const amount = parseFloat(document.getElementById('amountValue').value) || 0;
        if (amount === 0) { alert('يرجى إدخال المبلغ'); return; }
        deliveredAmount.amountSAR = amount;
    } else if (selectedCurrency === 'yer') {
        const amount = parseFloat(document.getElementById('amountValue').value) || 0;
        if (amount === 0) { alert('يرجى إدخال المبلغ'); return; }
        deliveredAmount.amountYER = amount;
    } else if (selectedCurrency === 'both') {
        const amountSAR = parseFloat(document.getElementById('amountValueSAR').value) || 0;
        const amountYER = parseFloat(document.getElementById('amountValueYER').value) || 0;
        if (amountSAR === 0 && amountYER === 0) { alert('يرجى إدخال مبلغ على الأقل في أحد العملتين'); return; }
        if (amountSAR > 0) deliveredAmount.amountSAR = amountSAR;
        if (amountYER > 0) deliveredAmount.amountYER = amountYER;
    }
    
    deliveredAmounts.push(deliveredAmount);
    if (client && clients[client]) {
        if (!clients[client].deliveredAmounts) clients[client].deliveredAmounts = [];
        clients[client].deliveredAmounts.push(deliveredAmount);
    }
    
    document.getElementById('amountValue').value = '';
    document.getElementById('amountValueSAR').value = '';
    document.getElementById('amountValueYER').value = '';
    saveData();
    renderDeliveredAmounts();
    alert('تم إضافة المبلغ المسلم بنجاح!');
}

function renderDeliveredAmounts() {
    const container = document.getElementById('deliveredAmountsList');
    if (!container) return;
    container.innerHTML = '';
    
    if (deliveredAmounts.length === 0) {
        container.innerHTML = '<div class="list-item"><div class="item-info"><div class="item-details"><div class="item-name">لا توجد مبالغ مسلمة</div><div class="item-desc">قم بإضافة مبلغ مسلم جديد</div></div></div></div>';
        return;
    }
    
    let totalSAR = 0, totalYER = 0;
    deliveredAmounts.forEach((amount, index) => {
        const valueSAR = amount.amountSAR || 0;
        const valueYER = amount.amountYER || 0;
        totalSAR += valueSAR;
        totalYER += valueYER;
        
        const amountElement = document.createElement('div');
        amountElement.className = 'list-item';
        amountElement.innerHTML = `
            <div class="item-info"><div class="item-icon"><i class="fas fa-money-bill-wave"></i></div><div class="item-details"><div class="item-name">${valueSAR > 0 ? valueSAR.toFixed(2) + ' ر.س' : ''}${valueSAR > 0 && valueYER > 0 ? ' / ' : ''}${valueYER > 0 ? valueYER.toFixed(2) + ' ر.ي' : ''}</div><div class="item-desc">${amount.date} ${amount.client ? `- ${amount.client}` : ''}</div></div></div>
            <div><span class="delivered-amount">${valueSAR > 0 ? valueSAR.toFixed(2) + ' ر.س' : ''}${valueSAR > 0 && valueYER > 0 ? ' / ' : ''}${valueYER > 0 ? valueYER.toFixed(2) + ' ر.ي' : ''}</span><button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px; margin-right: 10px;" onclick="deleteDeliveredAmount(${index})"><i class="fas fa-trash"></i></button></div>
        `;
        container.appendChild(amountElement);
    });
    
    const totalElement = document.createElement('div');
    totalElement.className = 'list-item';
    totalElement.style.background = 'var(--success)';
    totalElement.style.color = 'white';
    totalElement.style.fontWeight = 'bold';
    totalElement.innerHTML = `<div class="item-info"><div class="item-details"><div class="item-name">إجمالي المبالغ المسلمة</div></div></div><div>${totalSAR > 0 ? totalSAR.toFixed(2) + ' ر.س' : ''}${totalSAR > 0 && totalYER > 0 ? '<br>' : ''}${totalYER > 0 ? totalYER.toFixed(2) + ' ر.ي' : ''}</div>`;
    container.appendChild(totalElement);
}

function deleteDeliveredAmount(index) {
    if (confirm('هل أنت متأكد من حذف هذا المبلغ المسلم؟')) {
        deliveredAmounts.splice(index, 1);
        saveData();
        renderDeliveredAmounts();
        alert('تم حذف المبلغ المسلم بنجاح!');
    }
}

// وظائف جهات الاتصال
function loadContacts() { renderContacts(); }

function renderContacts() {
    const container = document.getElementById('contactsList');
    if (!container) return;
    container.innerHTML = '';
    
    if (contacts.length === 0) {
        container.innerHTML = '<div class="contact-item"><div class="contact-info"><div class="contact-name">لا توجد جهات اتصال</div></div></div>';
        return;
    }
    
    contacts.forEach((contact, index) => {
        const contactElement = document.createElement('div');
        contactElement.className = 'contact-item';
        contactElement.onclick = () => selectContact(contact);
        contactElement.innerHTML = `
            <div class="contact-avatar">${contact.name.charAt(0)}</div>
            <div class="contact-info"><div class="contact-name">${contact.name}</div><div class="contact-phone">${contact.phone}</div></div>
            <button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="event.stopPropagation(); deleteContact(${index})"><i class="fas fa-trash"></i></button>
        `;
        container.appendChild(contactElement);
    });
}

function filterContacts() {
    const query = document.getElementById('contactSearch').value.toLowerCase();
    const contactItems = document.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
        const name = item.querySelector('.contact-name')?.textContent.toLowerCase() || '';
        const phone = item.querySelector('.contact-phone')?.textContent.toLowerCase() || '';
        item.style.display = (name.includes(query) || phone.includes(query)) ? 'flex' : 'none';
    });
}

function selectContact(contact) {
    const phoneField = document.getElementById('clientPhone');
    const nameField = document.getElementById('clientName');
    if (phoneField) phoneField.value = contact.phone;
    if (nameField) nameField.value = contact.name;
    closeModal('contactsModal');
    showClientModal();
}

function addNewContact() {
    const name = prompt('أدخل اسم جهة الاتصال:');
    if (name && name.trim()) {
        const phone = prompt('أدخل رقم الهاتف:');
        if (phone && phone.trim()) {
            contacts.push({ name: name, phone: phone });
            saveData();
            renderContacts();
            alert('تم إضافة جهة الاتصال بنجاح!');
        }
    }
}

function deleteContact(index) {
    if (confirm('هل أنت متأكد من حذف جهة الاتصال هذه؟')) {
        contacts.splice(index, 1);
        saveData();
        renderContacts();
        alert('تم حذف جهة الاتصال بنجاح!');
    }
}

function accessDeviceContacts() {
    if ('contacts' in navigator && 'select' in navigator.contacts) {
        navigator.contacts.select(['name', 'tel'])
            .then(contacts => {
                if (contacts && contacts.length > 0) {
                    const contact = contacts[0];
                    const phoneField = document.getElementById('clientPhone');
                    const nameField = document.getElementById('clientName');
                    if (phoneField) phoneField.value = contact.tel ? contact.tel[0] : '';
                    if (nameField) nameField.value = contact.name || '';
                    showClientModal();
                } else {
                    alert('لم يتم اختيار أي جهة اتصال');
                }
            })
            .catch(error => {
                console.error('خطأ في الوصول إلى جهات الاتصال:', error);
                alert('عذراً، لا يمكن الوصول إلى جهات اتصال الجهاز. تأكد من السماح للتطبيق بالوصول إلى جهات الاتصال.');
            });
    } else {
        alert('عذراً، متصفحك لا يدعم واجهة برمجة تطبيقات جهات الاتصال. يمكنك إضافة جهات الاتصال يدوياً.');
    }
}

// وظائف النسخ الاحتياطي
function createBackup() {
    const backupData = {
        clients, employees, suppliers, debtors, contacts, deliveredAmounts,
        invoices, vouchers, transfers, currency: currentCurrency,
        timestamp: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "نسخة_احتياطية_محاسب_المستقبل.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    alert('تم إنشاء النسخة الاحتياطية بنجاح!');
}

function restoreBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const backupData = JSON.parse(event.target.result);
                if (confirm('هل أنت متأكد من استعادة النسخة الاحتياطية؟ سيتم استبدال جميع البيانات الحالية.')) {
                    clients = backupData.clients || {};
                    employees = backupData.employees || {};
                    suppliers = backupData.suppliers || {};
                    debtors = backupData.debtors || {};
                    contacts = backupData.contacts || [];
                    deliveredAmounts = backupData.deliveredAmounts || [];
                    invoices = backupData.invoices || [];
                    vouchers = backupData.vouchers || [];
                    transfers = backupData.transfers || [];
                    currentCurrency = backupData.currency || 'sar';
                    saveData();
                    renderClients();
                    renderEmployees();
                    renderSuppliers();
                    renderDebtors();
                    renderDeliveredAmounts();
                    
                    const clientSelect = document.getElementById('amountClient');
                    if (clientSelect) {
                        clientSelect.innerHTML = '<option value="">اختر العميل</option>';
                        for (const client in clients) {
                            const option = document.createElement('option');
                            option.value = client;
                            option.textContent = client;
                            clientSelect.appendChild(option);
                        }
                    }
                    alert('تم استعادة النسخة الاحتياطية بنجاح!');
                }
            } catch (error) {
                alert('خطأ في استعادة النسخة الاحتياطية!');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function deleteAllData() {
    if (confirm('هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        clients = {};
        employees = {};
        suppliers = {};
        debtors = {};
        contacts = [];
        deliveredAmounts = [];
        invoices = [];
        vouchers = [];
        transfers = [];
        saveData();
        renderClients();
        renderEmployees();
        renderSuppliers();
        renderDebtors();
        renderDeliveredAmounts();
        
        const clientSelect = document.getElementById('amountClient');
        if (clientSelect) clientSelect.innerHTML = '<option value="">اختر العميل</option>';
        alert('تم حذف جميع البيانات بنجاح!');
    }
}

// وظائف متنوعة
function searchData() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    if (query.length > 2) console.log(`جاري البحث عن: ${query}`);
}

function generateReport(type) {
    alert(`جاري إنشاء تقرير ${type}...`);
}

function showDeliveredAmounts() { alert('جاري عرض جميع المبالغ المسلمة...'); }

function showDeveloperNotification() {
    const notification = document.getElementById('developerNotification');
    if (notification) notification.style.display = 'block';
}

function closeDeveloperNotification() {
    const notification = document.getElementById('developerNotification');
    if (notification) notification.style.display = 'none';
}

// تسجيل Service Worker لـ PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(reg => {
        console.log('Service Worker registered:', reg);
    }).catch(err => {
        console.log('Service Worker registration failed:', err);
    });
}
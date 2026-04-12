// متغيرات عامة
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

// التسجيل في خدمة PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered:', reg))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    loadData();
    initTheme();
    checkLoginStatus();
    
    document.getElementById('loginForm').addEventListener('submit', login);
    document.getElementById('registerForm').addEventListener('submit', register);
    document.getElementById('clientForm').addEventListener('submit', addClient);
    document.getElementById('employeeForm').addEventListener('submit', addEmployee);
    document.getElementById('supplierForm').addEventListener('submit', addSupplier);
    document.getElementById('debtorForm').addEventListener('submit', addDebtor);
    document.getElementById('invoiceForm').addEventListener('submit', addInvoice);
    document.getElementById('voucherForm').addEventListener('submit', addVoucher);
    document.getElementById('transferForm').addEventListener('submit', addTransfer);
    document.getElementById('addTransactionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addClientTransaction();
    });
    document.getElementById('addDeliveredAmountForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addClientDeliveredAmount();
    });
    
    document.getElementById('searchInput').addEventListener('input', searchData);
    
    const clientSelect = document.getElementById('amountClient');
    for (const client in clients) {
        const option = document.createElement('option');
        option.value = client;
        option.textContent = client;
        clientSelect.appendChild(option);
    }
    
    document.getElementById('deliveredAmountDate').value = new Date().toISOString().split('T')[0];
    
    setTimeout(showDeveloperNotification, 1000);
}

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
    renderClients();
    renderEmployees();
    renderSuppliers();
    renderDebtors();
    loadContacts();
    renderDeliveredAmounts();
}

function login(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    currentUser = { email: email, name: email.split('@')[0], type: 'email' };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showMainApp();
    alert('تم تسجيل الدخول بنجاح!');
    setTimeout(showDeveloperNotification, 500);
}

function register(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    if (password !== confirmPassword) {
        alert('كلمات المرور غير متطابقة!');
        return;
    }
    currentUser = { name: name, email: email, type: 'registered' };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    closeModal('registerModal');
    showMainApp();
    alert('تم إنشاء الحساب بنجاح!');
    setTimeout(showDeveloperNotification, 500);
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

function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('ar-SA', options);
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('currentDate').textContent = dateStr;
    document.getElementById('currentTime').textContent = timeStr;
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') enableDarkMode();
    else enableLightMode();
}

function enableDarkMode() {
    document.body.classList.add('dark-theme');
    document.getElementById('themeIcon').className = 'fas fa-sun';
    isDarkMode = true;
    localStorage.setItem('theme', 'dark');
}

function enableLightMode() {
    document.body.classList.remove('dark-theme');
    document.getElementById('themeIcon').className = 'fas fa-moon';
    isDarkMode = false;
    localStorage.setItem('theme', 'light');
}

function toggleTheme() {
    if (isDarkMode) enableLightMode();
    else enableDarkMode();
}

function loadData() {
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
    localStorage.setItem('currency', currentCurrency);
    updateStats();
}

function updateStats() {
    document.getElementById('clientsCount').textContent = Object.keys(clients).length;
    document.getElementById('employeesCount').textContent = Object.keys(employees).length;
    document.getElementById('suppliersCount').textContent = Object.keys(suppliers).length;
    document.getElementById('debtsCount').textContent = Object.keys(debtors).length;
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById(pageId + '-page').classList.add('active');
    const navMap = { home: 0, clients: 1, suppliers: 2, debts: 3, employees: 4, reports: 5, settings: 6 };
    if (navMap[pageId] !== undefined) document.querySelectorAll('.nav-item')[navMap[pageId]].classList.add('active');
}

function showClientModal() { openModal('clientModal'); }
function showEmployeeModal() { openModal('employeeModal'); }
function showSupplierModal() { openModal('supplierModal'); }
function showDebtorModal() { openModal('debtorModal'); }

function showInvoiceModal() {
    const clientSelect = document.getElementById('invoiceClient');
    clientSelect.innerHTML = '<option value="">اختر العميل</option>';
    for (const client in clients) {
        const option = document.createElement('option');
        option.value = client;
        option.textContent = client;
        clientSelect.appendChild(option);
    }
    openModal('invoiceModal');
}

function showVoucherModal() { openModal('voucherModal'); }
function showTransferModal() { openModal('transferModal'); }
function showContactsModal() { openModal('contactsModal'); renderContacts(); }
function showRegisterModal() { openModal('registerModal'); }

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

function showCurrencySettings() { openModal('currencySettingsModal'); }
function showLanguagesModal() { openModal('languagesModal'); }

function openModal(modalId) { document.getElementById(modalId).classList.add('active'); }
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    const form = document.getElementById(modalId.replace('Modal', 'Form'));
    if (form && modalId !== 'contactsModal' && modalId !== 'currencySettingsModal' && modalId !== 'languagesModal') form.reset();
}

function selectCurrency(currency) {
    selectedCurrency = currency;
    const options = document.querySelectorAll('#home-page .currency-option');
    options.forEach(opt => opt.classList.remove('active'));
    if (currency === 'sar') {
        options[0].classList.add('active');
        document.getElementById('amountLabel').textContent = 'المبلغ (ريال سعودي)';
        document.getElementById('currencySymbol').textContent = 'ر.س';
        document.getElementById('singleCurrencyInput').style.display = 'flex';
        document.getElementById('dualCurrencyInput').style.display = 'none';
    } else if (currency === 'yer') {
        options[1].classList.add('active');
        document.getElementById('amountLabel').textContent = 'المبلغ (ريال يمني)';
        document.getElementById('currencySymbol').textContent = 'ر.ي';
        document.getElementById('singleCurrencyInput').style.display = 'flex';
        document.getElementById('dualCurrencyInput').style.display = 'none';
    } else if (currency === 'both') {
        options[2].classList.add('active');
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
        options[0].classList.add('active');
        document.getElementById('transactionAmountLabel').textContent = 'القيمة (ريال سعودي)';
        document.getElementById('transactionCurrencySymbol').textContent = 'ر.س';
        document.getElementById('transactionSingleCurrencyInput').style.display = 'flex';
        document.getElementById('transactionDualCurrencyInput').style.display = 'none';
    } else if (currency === 'yer') {
        options[1].classList.add('active');
        document.getElementById('transactionAmountLabel').textContent = 'القيمة (ريال يمني)';
        document.getElementById('transactionCurrencySymbol').textContent = 'ر.ي';
        document.getElementById('transactionSingleCurrencyInput').style.display = 'flex';
        document.getElementById('transactionDualCurrencyInput').style.display = 'none';
    } else if (currency === 'both') {
        options[2].classList.add('active');
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
        options[0].classList.add('active');
        document.getElementById('modalAmountLabel').textContent = 'المبلغ (ريال سعودي)';
        document.getElementById('modalCurrencySymbol').textContent = 'ر.س';
        document.getElementById('modalSingleCurrencyInput').style.display = 'flex';
        document.getElementById('modalDualCurrencyInput').style.display = 'none';
    } else if (currency === 'yer') {
        options[1].classList.add('active');
        document.getElementById('modalAmountLabel').textContent = 'المبلغ (ريال يمني)';
        document.getElementById('modalCurrencySymbol').textContent = 'ر.ي';
        document.getElementById('modalSingleCurrencyInput').style.display = 'flex';
        document.getElementById('modalDualCurrencyInput').style.display = 'none';
    } else if (currency === 'both') {
        options[2].classList.add('active');
        document.getElementById('modalAmountLabel').textContent = 'المبلغ (ريال سعودي وريال يمني)';
        document.getElementById('modalSingleCurrencyInput').style.display = 'none';
        document.getElementById('modalDualCurrencyInput').style.display = 'block';
    }
}

function setDefaultCurrency(currency) {
    currentCurrency = currency;
    const options = document.querySelectorAll('#currencySettingsModal .currency-option');
    options.forEach(opt => opt.classList.remove('active'));
    if (currency === 'sar') options[0].classList.add('active');
    else if (currency === 'yer') options[1].classList.add('active');
    else if (currency === 'both') options[2].classList.add('active');
    saveData();
    alert('تم حفظ إعدادات العملة بنجاح!');
}

function switchCurrencyTab(currency) {
    currentCurrencyTab = currency;
    document.querySelectorAll('.currency-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.currency-content').forEach(content => content.classList.remove('active'));
    if (currency === 'sar') {
        document.querySelector('.currency-tab:nth-child(1)').classList.add('active');
        document.getElementById('sar-content').classList.add('active');
    } else if (currency === 'yer') {
        document.querySelector('.currency-tab:nth-child(2)').classList.add('active');
        document.getElementById('yer-content').classList.add('active');
    } else if (currency === 'all') {
        document.querySelector('.currency-tab:nth-child(3)').classList.add('active');
        document.getElementById('all-content').classList.add('active');
    }
    renderClientRecords();
    renderClientDeliveredAmounts();
}

function addClient(e) {
    e.preventDefault();
    const name = document.getElementById('clientName').value;
    const phone = document.getElementById('clientPhone').value;
    const email = document.getElementById('clientEmail').value;
    const address = document.getElementById('clientAddress').value;
    clients[name] = { phone, email, address, joinDate: new Date().toISOString().split('T')[0], records: [], deliveredAmounts: [] };
    saveData();
    renderClients();
    const clientSelect = document.getElementById('amountClient');
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    clientSelect.appendChild(option);
    closeModal('clientModal');
    alert('تم إضافة العميل بنجاح!');
}

function addEmployee(e) {
    e.preventDefault();
    const name = document.getElementById('employeeName').value;
    const phone = document.getElementById('employeePhone').value;
    const salary = parseFloat(document.getElementById('employeeSalary').value);
    const position = document.getElementById('employeePosition').value;
    employees[name] = { phone, salary, position, joinDate: new Date().toISOString().split('T')[0], records: [] };
    saveData();
    renderEmployees();
    closeModal('employeeModal');
    alert('تم إضافة الموظف بنجاح!');
}

function addSupplier(e) {
    e.preventDefault();
    const name = document.getElementById('supplierName').value;
    const phone = document.getElementById('supplierPhone').value;
    const email = document.getElementById('supplierEmail').value;
    const address = document.getElementById('supplierAddress').value;
    suppliers[name] = { phone, email, address, joinDate: new Date().toISOString().split('T')[0] };
    saveData();
    renderSuppliers();
    closeModal('supplierModal');
    alert('تم إضافة المورد بنجاح!');
}

function addDebtor(e) {
    e.preventDefault();
    const name = document.getElementById('debtorName').value;
    const phone = document.getElementById('debtorPhone').value;
    const amount = parseFloat(document.getElementById('debtorAmount').value);
    const dueDate = document.getElementById('debtorDueDate').value;
    debtors[name] = { phone, amount, dueDate, joinDate: new Date().toISOString().split('T')[0] };
    saveData();
    renderDebtors();
    closeModal('debtorModal');
    alert('تم إضافة المدين بنجاح!');
}

function addInvoice(e) {
    e.preventDefault();
    const client = document.getElementById('invoiceClient').value;
    const date = document.getElementById('invoiceDate').value;
    invoices.push({ client, date, items: [], total: 0 });
    saveData();
    closeModal('invoiceModal');
    alert('تم إنشاء الفاتورة بنجاح!');
}

function addVoucher(e) {
    e.preventDefault();
    const type = document.getElementById('voucherType').value;
    const amount = parseFloat(document.getElementById('voucherAmount').value);
    const date = document.getElementById('voucherDate').value;
    vouchers.push({ type, amount, date });
    saveData();
    closeModal('voucherModal');
    alert('تم إنشاء السند بنجاح!');
}

function addTransfer(e) {
    e.preventDefault();
    const from = document.getElementById('transferFrom').value;
    const to = document.getElementById('transferTo').value;
    const amount = parseFloat(document.getElementById('transferAmount').value);
    const date = document.getElementById('transferDate').value;
    transfers.push({ from, to, amount, date });
    saveData();
    closeModal('transferModal');
    alert('تم إنشاء الحوالة بنجاح!');
}

function addClientTransaction() {
    if (!currentClient) return;
    const item = document.getElementById('transactionItemName').value;
    if (!item) { alert('يرجى إدخال اسم الصنف'); return; }
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    if (!clients[currentClient].records) clients[currentClient].records = [];
    const record = { item, date: dateStr, time: timeStr, takenDate: dateStr };
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
    const deliveredAmount = { date };
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

function addDeliveredAmount() {
    const client = document.getElementById('amountClient').value;
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const deliveredAmount = { date: dateStr, client };
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
    document.getElementById('amountValue').value = '';
    document.getElementById('amountValueSAR').value = '';
    document.getElementById('amountValueYER').value = '';
    saveData();
    renderDeliveredAmounts();
    alert('تم إضافة المبلغ المسلم بنجاح!');
}

function addInvoiceItem() {
    const itemsContainer = document.getElementById('invoiceItems');
    const newItem = document.createElement('div');
    newItem.className = 'amount-input-group';
    newItem.innerHTML = `
        <input type="text" class="form-control" placeholder="اسم الصنف">
        <input type="number" class="form-control" placeholder="الكمية" step="1">
        <input type="number" class="form-control" placeholder="السعر" step="0.01">
        <button type="button" class="btn btn-outline" onclick="this.parentElement.remove()">-</button>
    `;
    itemsContainer.appendChild(newItem);
}

function renderClients() {
    const container = document.getElementById('clientsList');
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
            <div class="client-header">
                <div class="item-info">
                    <div class="item-icon"><i class="fas fa-user"></i></div>
                    <div class="item-details"><div class="item-name">${client}</div><div class="item-desc">${clients[client].phone}</div></div>
                </div>
                <div class="client-actions">
                    <button class="contacts-btn" onclick="event.stopPropagation(); addClientToContacts('${client}')" title="إضافة إلى جهات الاتصال"><i class="fas fa-address-book"></i></button>
                    <button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="event.stopPropagation(); deleteClient('${client}')"><i class="fas fa-trash"></i></button>
                    <i class="fas fa-chevron-left"></i>
                </div>
            </div>
        `;
        container.appendChild(clientElement);
    }
}

function renderSuppliers() {
    const container = document.getElementById('suppliersList');
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

function renderDebtors() {
    const container = document.getElementById('debtorsList');
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

function addClientToContacts(clientName) {
    const client = clients[clientName];
    const existingContact = contacts.find(contact => contact.phone === client.phone);
    if (existingContact) { alert('هذا العميل موجود بالفعل في جهات الاتصال!'); return; }
    contacts.push({ name: clientName, phone: client.phone, email: client.email || '', address: client.address || '' });
    saveData();
    alert(`تم إضافة ${clientName} إلى جهات الاتصال بنجاح!`);
}

function renderEmployees() {
    const container = document.getElementById('employeesList');
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

function deleteClient(clientName) {
    if (confirm(`هل أنت متأكد من حذف العميل "${clientName}"؟ سيتم حذف جميع سجلاته أيضًا.`)) {
        delete clients[clientName];
        saveData();
        renderClients();
        const clientSelect = document.getElementById('amountClient');
        for (let i = 0; i < clientSelect.options.length; i++) {
            if (clientSelect.options[i].value === clientName) { clientSelect.remove(i); break; }
        }
        alert('تم حذف العميل بنجاح!');
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

function deleteSupplier(supplierName) {
    if (confirm(`هل أنت متأكد من حذف المورد "${supplierName}"؟`)) {
        delete suppliers[supplierName];
        saveData();
        renderSuppliers();
        alert('تم حذف المورد بنجاح!');
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

function deleteClientAccount() {
    if (!currentClient) return;
    if (confirm(`هل أنت متأكد من حذف حساب العميل "${currentClient}" بالكامل؟`)) {
        delete clients[currentClient];
        saveData();
        showPage('clients');
        const clientSelect = document.getElementById('amountClient');
        for (let i = 0; i < clientSelect.options.length; i++) {
            if (clientSelect.options[i].value === currentClient) { clientSelect.remove(i); break; }
        }
        alert('تم حذف حساب العميل بالكامل!');
    }
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
        clientSelect.innerHTML = '<option value="">اختر العميل</option>';
        alert('تم حذف جميع البيانات بنجاح!');
    }
}

function showClientRecords(clientName) {
    currentClient = clientName;
    document.getElementById('clientRecordsTitle').textContent = `سجل العميل: ${clientName}`;
    showPage('client-records');
    renderClientRecords();
    renderClientDeliveredAmounts();
    updateClientBalance();
}

function showEmployeeRecords(employeeName) {
    currentEmployee = employeeName;
    document.getElementById('employeeRecordsTitle').textContent = `سجل الموظف: ${employeeName}`;
    showPage('employee-records');
    renderEmployeeRecords();
}

function renderClientRecords() {
    if (!currentClient || !clients[currentClient]) return;
    const client = clients[currentClient];
    let totalSAR = 0, totalYER = 0;
    const sarContainer = document.getElementById('clientRecordsTableSAR');
    const yerContainer = document.getElementById('clientRecordsTableYER');
    const allContainer = document.getElementById('clientRecordsTableALL');
    sarContainer.innerHTML = '';
    yerContainer.innerHTML = '';
    allContainer.innerHTML = '';
    if (client.records && client.records.length > 0) {
        client.records.forEach((record, index) => {
            const valueSAR = record.valueSAR || 0;
            const valueYER = record.valueYER || 0;
            totalSAR += valueSAR;
            totalYER += valueYER;
            if (valueSAR > 0) {
                const rowSAR = document.createElement('tr');
                rowSAR.innerHTML = `<td>${record.item}</td><td>${valueSAR.toFixed(2)}</td><td>${record.takenDate || record.date}</td><td>${record.time}</td><td><button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="deleteClientRecord(${index})"><i class="fas fa-trash"></i></button></td>`;
                sarContainer.appendChild(rowSAR);
            }
            if (valueYER > 0) {
                const rowYER = document.createElement('tr');
                rowYER.innerHTML = `<td>${record.item}</td><td>${valueYER.toFixed(2)}</td><td>${record.takenDate || record.date}</td><td>${record.time}</td><td><button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="deleteClientRecord(${index})"><i class="fas fa-trash"></i></button></td>`;
                yerContainer.appendChild(rowYER);
            }
            const rowALL = document.createElement('tr');
            rowALL.innerHTML = `<td>${record.item}</td><td>${valueSAR > 0 ? valueSAR.toFixed(2) : '0.00'}</td><td>${valueYER > 0 ? valueYER.toFixed(2) : '0.00'}</td><td>${record.takenDate || record.date}</td><td>${record.time}</td><td><button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="deleteClientRecord(${index})"><i class="fas fa-trash"></i></button></td>`;
            allContainer.appendChild(rowALL);
        });
    } else {
        const emptyRow = '<tr><td colspan="5" style="text-align: center; padding: 15px;">لا توجد معاملات مسجلة</td></tr>';
        sarContainer.innerHTML = emptyRow;
        yerContainer.innerHTML = emptyRow;
        allContainer.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 15px;">لا توجد معاملات مسجلة</td></tr>';
    }
    document.getElementById('clientTotalSAR').textContent = `الإجمالي: ${totalSAR.toFixed(2)} ر.س`;
    document.getElementById('clientTotalYER').textContent = `الإجمالي: ${totalYER.toFixed(2)} ر.ي`;
    document.getElementById('clientTotalALL').textContent = `الإجمالي: ${totalSAR.toFixed(2)} ر.س / ${totalYER.toFixed(2)} ر.ي`;
}

function renderClientDeliveredAmounts() {
    if (!currentClient || !clients[currentClient]) return;
    const client = clients[currentClient];
    const sarContainer = document.getElementById('clientDeliveredAmountsListSAR');
    const yerContainer = document.getElementById('clientDeliveredAmountsListYER');
    const allContainer = document.getElementById('clientDeliveredAmountsListALL');
    sarContainer.innerHTML = '';
    yerContainer.innerHTML = '';
    allContainer.innerHTML = '';
    let totalAmountSAR = 0, totalAmountYER = 0;
    if (client.deliveredAmounts && client.deliveredAmounts.length > 0) {
        client.deliveredAmounts.forEach((amount, index) => {
            const valueSAR = amount.amountSAR || 0;
            const valueYER = amount.amountYER || 0;
            totalAmountSAR += valueSAR;
            totalAmountYER += valueYER;
            if (valueSAR > 0) {
                const amountElementSAR = document.createElement('div');
                amountElementSAR.className = 'list-item';
                amountElementSAR.innerHTML = `<div class="item-info"><div class="item-icon"><i class="fas fa-money-bill-wave"></i></div><div class="item-details"><div class="item-name">${valueSAR.toFixed(2)} ر.س</div><div class="item-desc">${amount.date}</div></div></div><div style="display: flex; align-items: center; gap: 10px;"><span class="delivered-amount"><i class="fas fa-check-circle"></i> ${valueSAR.toFixed(2)} ر.س</span><button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="deleteClientDeliveredAmount(${index})"><i class="fas fa-trash"></i></button></div>`;
                sarContainer.appendChild(amountElementSAR);
            }
            if (valueYER > 0) {
                const amountElementYER = document.createElement('div');
                amountElementYER.className = 'list-item';
                amountElementYER.innerHTML = `<div class="item-info"><div class="item-icon"><i class="fas fa-coins"></i></div><div class="item-details"><div class="item-name">${valueYER.toFixed(2)} ر.ي</div><div class="item-desc">${amount.date}</div></div></div><div style="display: flex; align-items: center; gap: 10px;"><span class="delivered-amount"><i class="fas fa-check-circle"></i> ${valueYER.toFixed(2)} ر.ي</span><button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="deleteClientDeliveredAmount(${index})"><i class="fas fa-trash"></i></button></div>`;
                yerContainer.appendChild(amountElementYER);
            }
            const amountElementALL = document.createElement('div');
            amountElementALL.className = 'list-item';
            amountElementALL.innerHTML = `<div class="item-info"><div class="item-icon"><i class="fas fa-exchange-alt"></i></div><div class="item-details"><div class="item-name">${valueSAR > 0 ? valueSAR.toFixed(2) + ' ر.س' : ''}${valueSAR > 0 && valueYER > 0 ? ' / ' : ''}${valueYER > 0 ? valueYER.toFixed(2) + ' ر.ي' : ''}</div><div class="item-desc">${amount.date}</div></div></div><div style="display: flex; align-items: center; gap: 10px;"><span class="delivered-amount"><i class="fas fa-check-circle"></i> ${valueSAR > 0 ? valueSAR.toFixed(2) + ' ر.س' : ''}${valueSAR > 0 && valueYER > 0 ? ' / ' : ''}${valueYER > 0 ? valueYER.toFixed(2) + ' ر.ي' : ''}</span><button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="deleteClientDeliveredAmount(${index})"><i class="fas fa-trash"></i></button></div>`;
            allContainer.appendChild(amountElementALL);
        });
    } else {
        const emptyMessage = '<div class="list-item"><div class="item-info"><div class="item-details"><div class="item-name">لا توجد مبالغ مسلمة</div><div class="item-desc">قم بإضافة مبلغ مسلم جديد</div></div></div></div>';
        sarContainer.innerHTML = emptyMessage;
        yerContainer.innerHTML = emptyMessage;
        allContainer.innerHTML = emptyMessage;
    }
    if (sarContainer.children.length > 0 && !(sarContainer.children.length === 1 && sarContainer.children[0].innerHTML.includes('لا توجد مبالغ مسلمة'))) {
        const totalElementSAR = document.createElement('div');
        totalElementSAR.className = 'list-item';
        totalElementSAR.style.background = 'var(--success)';
        totalElementSAR.style.color = 'white';
        totalElementSAR.style.fontWeight = 'bold';
        totalElementSAR.innerHTML = `<div class="item-info"><div class="item-details"><div class="item-name">إجمالي المبالغ المسلمة (ر.س)</div></div></div><div>${totalAmountSAR.toFixed(2)} ر.س</div>`;
        sarContainer.appendChild(totalElementSAR);
    }
    if (yerContainer.children.length > 0 && !(yerContainer.children.length === 1 && yerContainer.children[0].innerHTML.includes('لا توجد مبالغ مسلمة'))) {
        const totalElementYER = document.createElement('div');
        totalElementYER.className = 'list-item';
        totalElementYER.style.background = 'var(--warning)';
        totalElementYER.style.color = 'white';
        totalElementYER.style.fontWeight = 'bold';
        totalElementYER.innerHTML = `<div class="item-info"><div class="item-details"><div class="item-name">إجمالي المبالغ المسلمة (ر.ي)</div></div></div><div>${totalAmountYER.toFixed(2)} ر.ي</div>`;
        yerContainer.appendChild(totalElementYER);
    }
    if (allContainer.children.length > 0 && !(allContainer.children.length === 1 && allContainer.children[0].innerHTML.includes('لا توجد مبالغ مسلمة'))) {
        const totalElementALL = document.createElement('div');
        totalElementALL.className = 'list-item';
        totalElementALL.style.background = 'var(--primary)';
        totalElementALL.style.color = 'white';
        totalElementALL.style.fontWeight = 'bold';
        totalElementALL.innerHTML = `<div class="item-info"><div class="item-details"><div class="item-name">إجمالي المبالغ المسلمة</div></div></div><div>${totalAmountSAR > 0 ? totalAmountSAR.toFixed(2) + ' ر.س' : ''}${totalAmountSAR > 0 && totalAmountYER > 0 ? '<br>' : ''}${totalAmountYER > 0 ? totalAmountYER.toFixed(2) + ' ر.ي' : ''}</div>`;
        allContainer.appendChild(totalElementALL);
    }
}

function renderEmployeeRecords() {
    if (!currentEmployee || !employees[currentEmployee]) return;
    const container = document.getElementById('employeeRecordsTable');
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
    } else {
        container.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 15px;">لا توجد معاملات مسجلة</td></tr>';
    }
    document.getElementById('employeeTotal').textContent = `الإجمالي: ${total.toFixed(2)}`;
}

function addEmployeeRecord() {
    if (!currentEmployee) return;
    const item = document.getElementById('employeeItemName').value;
    const value = parseFloat(document.getElementById('employeeItemValue').value);
    if (!item || !value) { alert('يرجى ملء جميع الحقول'); return; }
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    if (!employees[currentEmployee].records) employees[currentEmployee].records = [];
    employees[currentEmployee].records.push({ item, value, date: dateStr });
    document.getElementById('employeeItemName').value = '';
    document.getElementById('employeeItemValue').value = '';
    saveData();
    renderEmployeeRecords();
    alert('تم إضافة المعاملة بنجاح!');
}

function deleteClientRecord(index) {
    if (!currentClient || !confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;
    clients[currentClient].records.splice(index, 1);
    saveData();
    renderClientRecords();
    updateClientBalance();
    alert('تم حذف المعاملة بنجاح!');
}

function deleteEmployeeRecord(index) {
    if (!currentEmployee || !confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;
    employees[currentEmployee].records.splice(index, 1);
    saveData();
    renderEmployeeRecords();
    alert('تم حذف المعاملة بنجاح!');
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
    if (balanceYER !== 0) message += `• ${balanceYER.toFixed(2)} ر.ي\n`;
    message += `\n📅 ملخص الحساب:\n════════════════════\n`;
    if (totalPurchasesSAR > 0) message += `• إجمالي المشتريات (ر.س): ${totalPurchasesSAR.toFixed(2)}\n`;
    if (totalPurchasesYER > 0) message += `• إجمالي المشتريات (ر.ي): ${totalPurchasesYER.toFixed(2)}\n`;
    if (totalDeliveredSAR > 0) message += `• إجمالي المسدد (ر.س): ${totalDeliveredSAR.toFixed(2)}\n`;
    if (totalDeliveredYER > 0) message += `• إجمالي المسدد (ر.ي): ${totalDeliveredYER.toFixed(2)}\n`;
    if (balanceSAR !== 0) message += `• الرصيد المتبقي (ر.س): ${balanceSAR.toFixed(2)}\n`;
    if (balanceYER !== 0) message += `• الرصيد المتبقي (ر.ي): ${balanceYER.toFixed(2)}\n`;
    message += `\n─────────────────\nشكراً لتعاملكم معنا 🌟\nمحاسب المستقبل - نظام محاسبي متكامل\nمطور بواسطة: عبد الوهاب عبد الواحد الريمي`;
    if (method === 'whatsapp') {
        const phone = client.phone.replace(/\D/g, '');
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    } else if (method === 'sms') sendSMS(client.phone, message);
}

function sendSMS(phoneNumber, message) {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    let formattedPhone = cleanPhone;
    if (!formattedPhone.startsWith('966') && formattedPhone.length === 9) formattedPhone = '966' + formattedPhone;
    else if (!formattedPhone.startsWith('967') && formattedPhone.length === 9) formattedPhone = '967' + formattedPhone;
    if ('sms' in navigator && 'send' in navigator.sms) {
        navigator.sms.send(formattedPhone, message).then(() => alert('تم إرسال الرسالة النصية بنجاح!')).catch(error => fallbackSMS(formattedPhone, message));
    } else fallbackSMS(formattedPhone, message);
}

function fallbackSMS(phoneNumber, message) {
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    const link = document.createElement('a');
    link.href = smsUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    try {
        link.click();
        setTimeout(() => document.body.removeChild(link), 1000);
    } catch (error) {
        console.error('خطأ في فتح تطبيق الرسائل:', error);
        alert('تعذر إرسال الرسالة النصية تلقائيًا. يمكنك نسخ النص وإرساله يدويًا.');
        copyToClipboard(message);
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => alert('تم نسخ النص إلى الحافظة! يمكنك الآن إرساله يدوياً.')).catch(err => fallbackCopyToClipboard(text));
    } else fallbackCopyToClipboard(text);
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        alert('تم نسخ النص إلى الحافظة! يمكنك الآن إرساله يدوياً.');
    } catch (err) {
        console.error('خطأ في النسخ:', err);
        alert('تعذر نسخ النص. يرجى نسخه يدويًا:\n\n' + text);
    }
    document.body.removeChild(textArea);
}

function updateClientBalance() {
    if (!currentClient || !clients[currentClient]) return;
    const client = clients[currentClient];
    let totalPurchasesSAR = 0, totalPurchasesYER = 0;
    if (client.records && client.records.length > 0) {
        client.records.forEach(record => {
            totalPurchasesSAR += record.valueSAR || 0;
            totalPurchasesYER += record.valueYER || 0;
        });
    }
    let totalDeliveredSAR = 0, totalDeliveredYER = 0;
    if (client.deliveredAmounts && client.deliveredAmounts.length > 0) {
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

function loadContacts() {}
function renderContacts() {
    const container = document.getElementById('contactsList');
    container.innerHTML = '';
    if (contacts.length === 0) {
        container.innerHTML = '<div class="contact-item"><div class="contact-info"><div class="contact-name">لا توجد جهات اتصال</div></div></div>';
        return;
    }
    contacts.forEach((contact, index) => {
        const contactElement = document.createElement('div');
        contactElement.className = 'contact-item';
        contactElement.onclick = () => selectContact(contact);
        contactElement.innerHTML = `<div class="contact-avatar">${contact.name.charAt(0)}</div><div class="contact-info"><div class="contact-name">${contact.name}</div><div class="contact-phone">${contact.phone}</div></div><button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="event.stopPropagation(); deleteContact(${index})"><i class="fas fa-trash"></i></button>`;
        container.appendChild(contactElement);
    });
}

function filterContacts() {
    const query = document.getElementById('contactSearch').value.toLowerCase();
    const contactItems = document.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
        const name = item.querySelector('.contact-name').textContent.toLowerCase();
        const phone = item.querySelector('.contact-phone').textContent.toLowerCase();
        item.style.display = (name.includes(query) || phone.includes(query)) ? 'flex' : 'none';
    });
}

function selectContact(contact) {
    document.getElementById('clientPhone').value = contact.phone;
    document.getElementById('clientName').value = contact.name;
    closeModal('contactsModal');
    showClientModal();
}

function addNewContact() {
    const name = prompt('أدخل اسم جهة الاتصال:');
    if (name && name.trim()) {
        const phone = prompt('أدخل رقم الهاتف:');
        if (phone && phone.trim()) {
            contacts.push({ name, phone });
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
        navigator.contacts.select(['name', 'tel']).then(contacts => {
            if (contacts && contacts.length > 0) {
                const contact = contacts[0];
                alert(`تم اختيار جهة الاتصال: ${contact.name} - ${contact.tel ? contact.tel[0] : 'لا يوجد رقم'}`);
                document.getElementById('clientPhone').value = contact.tel ? contact.tel[0] : '';
                document.getElementById('clientName').value = contact.name || '';
                showClientModal();
            } else alert('لم يتم اختيار أي جهة اتصال');
        }).catch(error => {
            console.error('خطأ في الوصول إلى جهات الاتصال:', error);
            alert('عذراً، لا يمكن الوصول إلى جهات اتصال الجهاز. تأكد من السماح للتطبيق بالوصول إلى جهات الاتصال.');
        });
    } else alert('عذراً، متصفحك لا يدعم واجهة برمجة تطبيقات جهات الاتصال. يمكنك إضافة جهات الاتصال يدوياً.');
}

function accessDrive() { alert('جاري الوصول إلى Google Drive...'); }
function searchData() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    if (query.length > 2) alert(`جاري البحث عن: ${query}`);
}
function generateReport(type) { alert(`جاري إنشاء تقرير ${type}...`); }

function createBackup() {
    const backupData = { clients, employees, suppliers, debtors, contacts, deliveredAmounts, invoices, vouchers, transfers, currency: currentCurrency, timestamp: new Date().toISOString() };
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
                    clientSelect.innerHTML = '<option value="">اختر العميل</option>';
                    for (const client in clients) {
                        const option = document.createElement('option');
                        option.value = client;
                        option.textContent = client;
                        clientSelect.appendChild(option);
                    }
                    alert('تم استعادة النسخة الاحتياطية بنجاح!');
                }
            } catch (error) { alert('خطأ في استعادة النسخة الاحتياطية!'); }
        };
        reader.readAsText(file);
    };
    input.click();
}

function showDeveloperNotification() { document.getElementById('developerNotification').style.display = 'block'; }
function closeDeveloperNotification() { document.getElementById('developerNotification').style.display = 'none'; }

function renderDeliveredAmounts() {
    const container = document.getElementById('deliveredAmountsList');
    container.innerHTML = '';
    if (deliveredAmounts.length === 0) {
        container.innerHTML = '<div class="list-item"><div class="item-info"><div class="item-details"><div class="item-name">لا توجد مبالغ مسلمة</div><div class="item-desc">قم بإضافة مبلغ مسلم جديد</div></div></div></div>';
        return;
    }
    let totalAmountSAR = 0, totalAmountYER = 0;
    deliveredAmounts.forEach((amount, index) => {
        const valueSAR = amount.amountSAR || 0;
        const valueYER = amount.amountYER || 0;
        totalAmountSAR += valueSAR;
        totalAmountYER += valueYER;
        const amountElement = document.createElement('div');
        amountElement.className = 'list-item';
        amountElement.innerHTML = `<div class="item-info"><div class="item-icon"><i class="fas fa-money-bill-wave"></i></div><div class="item-details"><div class="item-name">${valueSAR > 0 ? valueSAR.toFixed(2) + ' ر.س' : ''}${valueSAR > 0 && valueYER > 0 ? ' / ' : ''}${valueYER > 0 ? valueYER.toFixed(2) + ' ر.ي' : ''}</div><div class="item-desc">${amount.date} ${amount.client ? `- ${amount.client}` : ''}</div></div></div><div style="display: flex; align-items: center; gap: 10px;"><span class="delivered-amount"><i class="fas fa-check-circle"></i> ${valueSAR > 0 ? valueSAR.toFixed(2) + ' ر.س' : ''}${valueSAR > 0 && valueYER > 0 ? ' / ' : ''}${valueYER > 0 ? valueYER.toFixed(2) + ' ر.ي' : ''}</span><button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="deleteDeliveredAmount(${index})"><i class="fas fa-trash"></i></button></div>`;
        container.appendChild(amountElement);
    });
    const totalElement = document.createElement('div');
    totalElement.className = 'list-item';
    totalElement.style.background = 'var(--success)';
    totalElement.style.color = 'white';
    totalElement.style.fontWeight = 'bold';
    totalElement.innerHTML = `<div class="item-info"><div class="item-details"><div class="item-name">إجمالي المبالغ المسلمة</div></div></div><div>${totalAmountSAR > 0 ? totalAmountSAR.toFixed(2) + ' ر.س' : ''}${totalAmountSAR > 0 && totalAmountYER > 0 ? '<br>' : ''}${totalAmountYER > 0 ? totalAmountYER.toFixed(2) + ' ر.ي' : ''}</div>`;
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

function deleteClientDeliveredAmount(index) {
    if (!currentClient || !confirm('هل أنت متأكد من حذف هذا المبلغ المسلم؟')) return;
    clients[currentClient].deliveredAmounts.splice(index, 1);
    saveData();
    renderClientDeliveredAmounts();
    updateClientBalance();
    alert('تم حذف المبلغ المسلم للعميل بنجاح!');
}

function showDeliveredAmounts() { alert('جاري عرض جميع المبالغ المسلمة...'); }

document.getElementById('themeToggle').addEventListener('click', toggleTheme);
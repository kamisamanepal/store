
class ItemManager {
    constructor() {
        this.items = [];
        this.deletedItems = [];
        this.currentEditItem = null;
        this.currentDeleteItem = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadItems();
        this.setupThemeToggle();
        this.setupModals();
        this.setupPageNavigation();
    }

    setupEventListeners() {
        // Add item form
        document.getElementById('addItemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddItem();
        });

        // Search and sort
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        document.getElementById('sortSelect').addEventListener('change', () => {
            this.handleSort();
        });

        document.getElementById('sortDirection').addEventListener('click', () => {
            this.toggleSortDirection();
        });

        // Clear deleted items
        document.getElementById('clearDeletedBtn').addEventListener('click', () => {
            this.clearDeletedItems();
        });
    }

    setupThemeToggle() {
        const toggle = document.getElementById('themeToggle');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Set initial theme based on user preference
        if (localStorage.getItem('theme') === 'dark' || 
            (!localStorage.getItem('theme') && prefersDark)) {
            document.documentElement.classList.add('dark');
        }

        toggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    setupModals() {
        // Edit modal
        const editModal = document.getElementById('editModal');
        const editForm = document.getElementById('editItemForm');
        const closeEditModal = editModal.querySelector('.modal-close');
        
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.currentEditItem) {
                this.updateItem(this.currentEditItem.id);
            }
        });
        
        closeEditModal.addEventListener('click', () => {
            this.closeModal('editModal');
        });

        // Calculator in edit modal
        const toggleCalculator = document.getElementById('toggleCalculator');
        const calculatorUI = document.getElementById('calculatorUI');
        const addAmountBtn = document.getElementById('addAmountBtn');
        const subtractAmountBtn = document.getElementById('subtractAmountBtn');
        
        toggleCalculator.addEventListener('click', () => {
            const isVisible = calculatorUI.classList.toggle('hidden');
            toggleCalculator.textContent = isVisible ? 'Show Calculator' : 'Hide Calculator';
        });
        
        addAmountBtn.addEventListener('click', () => {
            this.handleCalculation('add');
        });
        
        subtractAmountBtn.addEventListener('click', () => {
            this.handleCalculation('subtract');
        });

        // Delete confirmation modal
        const deleteModal = document.getElementById('confirmDeleteModal');
        const closeDeleteModal = deleteModal.querySelector('.modal-close');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        
        closeDeleteModal.addEventListener('click', () => {
            this.closeModal('confirmDeleteModal');
        });
        
        cancelDeleteBtn.addEventListener('click', () => {
            this.closeModal('confirmDeleteModal');
        });
        
        confirmDeleteBtn.addEventListener('click', () => {
            if (this.currentDeleteItem) {
                this.deleteItem(this.currentDeleteItem.id);
                this.closeModal('confirmDeleteModal');
            }
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === editModal) {
                this.closeModal('editModal');
            }
            if (e.target === deleteModal) {
                this.closeModal('confirmDeleteModal');
            }
        });
    }

    setupPageNavigation() {
        const mainPage = document.getElementById('main-page');
        const deletedPage = document.getElementById('deleted-page');
        const deletedItemsBtn = document.getElementById('deletedItemsBtn');
        const backToMainBtn = document.getElementById('backToMainBtn');
        
        deletedItemsBtn.addEventListener('click', () => {
            mainPage.classList.add('hidden');
            deletedPage.classList.remove('hidden');
            this.renderDeletedItems();
        });
        
        backToMainBtn.addEventListener('click', () => {
            deletedPage.classList.add('hidden');
            mainPage.classList.remove('hidden');
            this.renderItems();
        });
    }

    loadItems() {
        // Load regular items
        const savedItems = localStorage.getItem('items');
        this.items = savedItems ? JSON.parse(savedItems) : [];
        
        // Load deleted items
        const savedDeletedItems = localStorage.getItem('deletedItems');
        this.deletedItems = savedDeletedItems ? JSON.parse(savedDeletedItems) : [];
        
        this.renderItems();
        this.updateSummary();
    }

    saveItems() {
        localStorage.setItem('items', JSON.stringify(this.items));
        localStorage.setItem('deletedItems', JSON.stringify(this.deletedItems));
    }

    handleAddItem() {
        const nameInput = document.getElementById('newItemName');
        const priceInput = document.getElementById('newItemPrice');

        const name = nameInput.value.trim();
        const price = Number(priceInput.value);

        if (name && !isNaN(price) && price >= 0) {
            const item = {
                id: Date.now().toString(),
                name: name,
                price: price,
                createdAt: new Date().toISOString()
            };

            this.items.push(item);
            this.saveItems();
            this.renderItems();
            this.updateSummary();

            nameInput.value = '';
            priceInput.value = '';
        }
    }

    formatPrice(price) {
        return `₹${Number(price).toFixed(2)}`;
    }

    handleSearch(query) {
        const filteredItems = this.items.filter(item =>
            item.name.toLowerCase().includes(query.toLowerCase())
        );
        this.renderItems(filteredItems);
    }

    handleSort() {
        this.renderItems();
    }

    toggleSortDirection() {
        const btn = document.getElementById('sortDirection');
        btn.textContent = btn.textContent === '↑' ? '↓' : '↑';
        this.renderItems();
    }

    getSortedItems(items = this.items) {
        const sortField = document.getElementById('sortSelect').value;
        const isAsc = document.getElementById('sortDirection').textContent === '↑';
        
        return [...items].sort((a, b) => {
            const compareValue = isAsc ? 1 : -1;
            if (sortField === 'name') {
                return a.name.localeCompare(b.name) * compareValue;
            }
            return (a.price - b.price) * compareValue;
        });
    }

    deleteItem(id) {
        const itemToDelete = this.items.find(item => item.id === id);
        
        if (itemToDelete) {
            // Add to deleted items with deletion timestamp
            this.deletedItems.push({
                ...itemToDelete,
                deletedAt: new Date().toISOString()
            });
            
            // Remove from active items
            this.items = this.items.filter(item => item.id !== id);
            this.saveItems();
            this.renderItems();
            this.updateSummary();
        }
    }
    
    restoreItem(id) {
        const itemToRestore = this.deletedItems.find(item => item.id === id);
        
        if (itemToRestore) {
            // Add back to active items (without the deletedAt property)
            const { deletedAt, ...restoredItem } = itemToRestore;
            this.items.push(restoredItem);
            
            // Remove from deleted items
            this.deletedItems = this.deletedItems.filter(item => item.id !== id);
            
            this.saveItems();
            this.renderDeletedItems();
            this.updateSummary();
        }
    }
    
    clearDeletedItems() {
        if (confirm('Are you sure you want to permanently delete all items in the trash?')) {
            this.deletedItems = [];
            this.saveItems();
            this.renderDeletedItems();
        }
    }

    updateItem(id) {
        const nameInput = document.getElementById('editItemName');
        const priceInput = document.getElementById('editItemPrice');
        
        const name = nameInput.value.trim();
        const price = Number(priceInput.value);
        
        if (name && !isNaN(price) && price >= 0) {
            const updatedItems = this.items.map(item => {
                if (item.id === id) {
                    return { ...item, name, price };
                }
                return item;
            });
            
            this.items = updatedItems;
            this.saveItems();
            this.renderItems();
            this.updateSummary();
            this.closeModal('editModal');
        }
    }

    handleCalculation(operation) {
        const calcAmountInput = document.getElementById('calcAmount');
        const editPriceInput = document.getElementById('editItemPrice');
        
        const amount = Number(calcAmountInput.value);
        let currentPrice = Number(editPriceInput.value);
        
        if (isNaN(amount) || amount <= 0) return;
        
        if (operation === 'add') {
            currentPrice += amount;
        } else {
            currentPrice = Math.max(0, currentPrice - amount);
        }
        
        editPriceInput.value = currentPrice;
        calcAmountInput.value = '';
    }

    updateSummary() {
        const totalItems = document.getElementById('totalItems');
        const totalPrice = document.getElementById('totalPrice');
        
        totalItems.textContent = this.items.length;
        totalPrice.textContent = this.formatPrice(
            this.items.reduce((sum, item) => sum + item.price, 0)
        );
    }

    openEditModal(item) {
        this.currentEditItem = item;
        
        const nameInput = document.getElementById('editItemName');
        const priceInput = document.getElementById('editItemPrice');
        const calculatorUI = document.getElementById('calculatorUI');
        const toggleCalculator = document.getElementById('toggleCalculator');
        
        nameInput.value = item.name;
        priceInput.value = item.price;
        
        calculatorUI.classList.add('hidden');
        toggleCalculator.textContent = 'Show Calculator';
        
        this.openModal('editModal');
    }

    openDeleteConfirmation(item) {
        this.currentDeleteItem = item;
        const confirmText = document.getElementById('deleteConfirmText');
        confirmText.textContent = `Are you sure you want to delete "${item.name}"? It will be moved to the recently deleted items section.`;
        this.openModal('confirmDeleteModal');
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('show');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
    }

    renderItems(itemsToRender = this.items) {
        const container = document.getElementById('itemsList');
        const template = document.getElementById('itemTemplate');
        container.innerHTML = '';

        const sortedItems = this.getSortedItems(itemsToRender);
        
        if (sortedItems.length === 0) {
            container.innerHTML = '<div class="empty-message">No items found</div>';
            return;
        }

        sortedItems.forEach(item => {
            const clone = template.content.cloneNode(true);
            
            clone.querySelector('.item-name').textContent = item.name;
            clone.querySelector('.item-price').textContent = this.formatPrice(item.price);
            clone.querySelector('.item-date').textContent = `Added: ${new Date(item.createdAt).toLocaleDateString()}`;
            
            const editButton = clone.querySelector('.edit-btn');
            const deleteButton = clone.querySelector('.delete-btn');
            
            editButton.addEventListener('click', () => {
                this.openEditModal(item);
            });
            
            deleteButton.addEventListener('click', () => {
                this.openDeleteConfirmation(item);
            });

            container.appendChild(clone);
        });
    }
    
    renderDeletedItems() {
        const container = document.getElementById('deletedItemsList');
        const template = document.getElementById('deletedItemTemplate');
        container.innerHTML = '';
        
        if (this.deletedItems.length === 0) {
            container.innerHTML = '<div class="empty-message">No deleted items found</div>';
            return;
        }
        
        // Sort deleted items by deletion date (most recent first)
        const sortedItems = [...this.deletedItems].sort((a, b) => 
            new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
        
        sortedItems.forEach(item => {
            const clone = template.content.cloneNode(true);
            
            clone.querySelector('.item-name').textContent = item.name;
            clone.querySelector('.item-price').textContent = this.formatPrice(item.price);
            clone.querySelector('.item-date').textContent = `Deleted: ${new Date(item.deletedAt).toLocaleDateString()}`;
            
            const restoreButton = clone.querySelector('.restore-btn');
            
            restoreButton.addEventListener('click', () => {
                this.restoreItem(item.id);
            });
            
            container.appendChild(clone);
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new ItemManager();
});

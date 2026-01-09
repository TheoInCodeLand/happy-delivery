// Manager Dashboard JavaScript

class ManagerDashboard {
    constructor() {
        this.socket = null;
        this.liveOrderCount = 0;
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.setupWebSocket();
        this.updateLiveStats();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Period selector
        const periodSelect = document.getElementById('periodSelect');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.updateDashboardData(e.target.value);
            });
        }

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.applyFilter(filter);
            });
        });
    }

    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.socket.send(JSON.stringify({
                type: 'subscribe',
                userType: 'restaurant_manager',
                userId: window.managerId
            }));
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };

        this.socket.onclose = () => {
            console.log('WebSocket disconnected. Reconnecting...');
            setTimeout(() => this.setupWebSocket(), 3000);
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'new_order':
                this.handleNewOrder(data.order);
                break;
            case 'order_updated':
                this.handleOrderUpdate(data.order);
                break;
            case 'live_stats':
                this.updateLiveStatsDisplay(data.stats);
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    handleNewOrder(order) {
        this.liveOrderCount++;
        this.updateOrderCounter();
        
        // Show notification
        this.showNotification(`New order #${order.order_number} received!`, 'success');
        
        // Update recent orders list if on dashboard
        if (window.location.pathname.includes('dashboard')) {
            this.addToRecentOrders(order);
        }
    }

    handleOrderUpdate(order) {
        // Update order in table if on orders page
        if (window.location.pathname.includes('orders')) {
            this.updateOrderInTable(order);
        }
        
        // Update status badge
        this.updateOrderStatusBadge(order.id, order.status);
    }

    updateDashboardData(period = 'today') {
        fetch(`/api/manager/dashboard/stats?period=${period}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.updateStatsCards(data.stats);
                    this.updateCharts(data.charts);
                }
            })
            .catch(error => console.error('Error updating dashboard:', error));
    }

    updateStatsCards(stats) {
        const elements = {
            totalRevenue: document.getElementById('totalRevenue'),
            totalOrders: document.getElementById('totalOrders'),
            avgRating: document.getElementById('avgRating'),
            activeOrders: document.getElementById('activeOrders'),
            revenueChange: document.getElementById('revenueChange'),
            ordersChange: document.getElementById('ordersChange')
        };

        if (elements.totalRevenue) elements.totalRevenue.textContent = `₹${stats.total_revenue || '0'}`;
        if (elements.totalOrders) elements.totalOrders.textContent = stats.total_orders || '0';
        if (elements.avgRating) elements.avgRating.textContent = `${stats.avg_rating || '0'} ⭐`;
        if (elements.activeOrders) elements.activeOrders.textContent = stats.active_orders || '0';
        
        if (elements.revenueChange) {
            elements.revenueChange.textContent = `${stats.revenue_change || '0'}%`;
            elements.revenueChange.className = stats.revenue_change > 0 ? 'text-success' : 'text-danger';
        }
        
        if (elements.ordersChange) {
            elements.ordersChange.textContent = `${stats.orders_change || '0'}%`;
            elements.ordersChange.className = stats.orders_change > 0 ? 'text-success' : 'text-danger';
        }
    }

    updateLiveStatsDisplay(stats) {
        // Update live stats on dashboard
        const liveElements = {
            todayOrders: document.getElementById('todayOrders'),
            todayRevenue: document.getElementById('todayRevenue'),
            activeDrivers: document.getElementById('activeDrivers')
        };

        Object.keys(liveElements).forEach(key => {
            if (liveElements[key] && stats[key] !== undefined) {
                liveElements[key].textContent = stats[key];
            }
        });
    }

    updateOrderCounter() {
        const counter = document.getElementById('liveOrderCount');
        const urgentCounter = document.getElementById('urgentOrders');
        
        if (counter) {
            counter.textContent = this.liveOrderCount;
            
            // Add animation for new orders
            if (this.liveOrderCount > 0) {
                counter.classList.add('live-badge');
            }
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
        `;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    startAutoRefresh() {
        // Auto-refresh dashboard every 30 seconds
        if (window.location.pathname.includes('dashboard')) {
            setInterval(() => {
                this.updateDashboardData();
            }, 30000);
        }
        
        // Auto-refresh orders every 10 seconds
        if (window.location.pathname.includes('orders')) {
            setInterval(() => {
                this.refreshOrders();
            }, 10000);
        }
    }

    refreshOrders() {
        const currentPage = window.currentPage || 1;
        if (typeof loadOrders === 'function') {
            loadOrders(currentPage);
        }
    }
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Menu Management Functions
function toggleMenuItemAvailability(itemId, currentStatus) {
    const newStatus = !currentStatus;
    
    fetch(`/api/manager/menu/items/${itemId}/availability`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_available: newStatus })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const statusBadge = document.querySelector(`#item-${itemId} .status-badge`);
            if (statusBadge) {
                statusBadge.textContent = newStatus ? 'Available' : 'Unavailable';
                statusBadge.className = newStatus ? 'badge bg-success' : 'badge bg-danger';
            }
            
            // Show notification
            showNotification(`Item ${newStatus ? 'enabled' : 'disabled'} successfully!`, 'success');
        }
    });
}

function editMenuItem(itemId) {
    fetch(`/api/manager/menu/items/${itemId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Populate modal with item data
                const item = data.item;
                document.getElementById('editItemName').value = item.name;
                document.getElementById('editItemPrice').value = item.price;
                document.getElementById('editItemDescription').value = item.description || '';
                document.getElementById('editItemAvailability').checked = item.is_available;
                
                // Show modal
                const modal = new bootstrap.Modal(document.getElementById('editItemModal'));
                modal.show();
                
                // Set form submission handler
                document.getElementById('editItemForm').onsubmit = (e) => {
                    e.preventDefault();
                    updateMenuItem(itemId);
                };
            }
        });
}

function updateMenuItem(itemId) {
    const formData = new FormData(document.getElementById('editItemForm'));
    
    fetch(`/api/manager/menu/items/${itemId}`, {
        method: 'PUT',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Close modal and refresh
            bootstrap.Modal.getInstance(document.getElementById('editItemModal')).hide();
            showNotification('Item updated successfully!', 'success');
            // Refresh the menu items list
            if (typeof loadMenuItems === 'function') {
                loadMenuItems();
            }
        }
    });
}

// Initialize dashboard when page loads  
document.addEventListener('DOMContentLoaded', function() {
    // Initialize ManagerDashboard if on manager pages
    if (window.location.pathname.includes('/manager/')) {
        window.managerDashboard = new ManagerDashboard();
    }
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize charts if on dashboard
    if (window.location.pathname.includes('dashboard')) {
        initializeDashboardCharts();
    }
});

// Global showNotification function
window.showNotification = function(message, type = 'info') {
    if (window.managerDashboard) {
        window.managerDashboard.showNotification(message, type);
    }
};
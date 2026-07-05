package com.example.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.data.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlin.random.Random

class AppViewModel(private val repository: AppRepository) : ViewModel() {
    val products = repository.products.stateIn(viewModelScope, SharingStarted.Lazily, emptyList())
    val neighborhoods = repository.neighborhoods.stateIn(viewModelScope, SharingStarted.Lazily, emptyList())
    val orders = repository.orders.stateIn(viewModelScope, SharingStarted.Lazily, emptyList())
    val tenants = repository.tenants.stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser = _currentUser.asStateFlow()

    suspend fun login(email: String, pass: String): User? {
        val user = repository.login(email, pass)
        if (user != null) {
            _currentUser.value = user
        }
        return user
    }
    
    suspend fun register(name: String, email: String, pass: String, role: String): Boolean {
        if (repository.getUserByEmail(email) != null) return false
        repository.registerUser(User(name = name, email = email, passwordHash = pass, role = role))
        return true
    }
    
    fun logout() {
        _currentUser.value = null
    }

    private val _cartItems = MutableStateFlow<List<OrderItem>>(emptyList())
    val cartItems = _cartItems.asStateFlow()

    fun toggleFavorite(productId: Int, isFavorite: Boolean) {
        viewModelScope.launch {
            repository.updateProductFavorite(productId, isFavorite)
        }
    }

    fun addToCart(product: Product, quantity: Int) {
        val current = _cartItems.value.toMutableList()
        val index = current.indexOfFirst { it.productId == product.id }
        if (index != -1) {
            val existing = current[index]
            current[index] = existing.copy(
                quantity = existing.quantity + quantity,
                totalPrice = (existing.quantity + quantity) * existing.unitPrice
            )
        } else {
            current.add(
                OrderItem(
                    productId = product.id,
                    productName = product.name,
                    quantity = quantity,
                    unitPrice = product.price,
                    totalPrice = quantity * product.price
                )
            )
        }
        _cartItems.value = current
    }

    fun updateCartQuantity(productId: Int, quantity: Int) {
        if (quantity <= 0) {
            removeFromCart(productId)
            return
        }
        val current = _cartItems.value.toMutableList()
        val index = current.indexOfFirst { it.productId == productId }
        if (index != -1) {
            val existing = current[index]
            current[index] = existing.copy(
                quantity = quantity,
                totalPrice = quantity * existing.unitPrice
            )
            _cartItems.value = current
        }
    }

    fun removeFromCart(productId: Int) {
        _cartItems.value = _cartItems.value.filter { it.productId != productId }
    }

    fun clearCart() {
        _cartItems.value = emptyList()
    }

    fun placeOrder(
        customerName: String,
        customerPhone: String,
        addressStreet: String,
        addressNumber: String,
        addressNeighborhood: Neighborhood?,
        addressComplement: String,
        addressReference: String,
        paymentMethod: String,
        changeFor: Double,
        onSuccess: () -> Unit
    ) {
        viewModelScope.launch {
            val items = _cartItems.value
            val subtotal = items.sumOf { it.totalPrice }
            val deliveryFee = addressNeighborhood?.deliveryFee ?: 0.0
            val orderStatus = if (addressNeighborhood?.status == "consult") "Aguardando análise" else "Novo"
            val order = Order(
                orderNumber = "REQ-${Random.nextInt(1000, 9999)}",
                customerName = customerName,
                customerPhone = customerPhone,
                addressStreet = addressStreet,
                addressNumber = addressNumber,
                addressNeighborhood = addressNeighborhood?.name ?: "N/D",
                addressComplement = addressComplement,
                addressReference = addressReference,
                paymentMethod = paymentMethod,
                changeFor = changeFor,
                subtotal = subtotal,
                deliveryFee = deliveryFee,
                total = subtotal + deliveryFee,
                status = orderStatus,
                itemsJson = MoshiHelper.toJson(items)
            )
            repository.insertOrder(order)
            clearCart()
            onSuccess()
        }
    }

    fun updateOrderStatus(id: Int, status: String) {
        viewModelScope.launch {
            repository.updateOrderStatus(id, status)
        }
    }

    fun addProduct(name: String, description: String, price: Double, category: String, imageUrl: String, isOrderBump: Boolean = false) {
        viewModelScope.launch {
            repository.insertProduct(
                Product(
                    name = name,
                    description = description,
                    price = price,
                    category = category,
                    imageUrl = imageUrl,
                    isOrderBump = isOrderBump
                )
            )
        }
    }

    fun deleteProduct(id: Int) {
        viewModelScope.launch {
            repository.deleteProduct(id)
        }
    }

    fun updateProduct(product: Product) {
        viewModelScope.launch {
            repository.updateProductFull(product)
        }
    }

    fun addNeighborhood(name: String, deliveryFee: Double, status: String) {
        viewModelScope.launch {
            repository.insertNeighborhood(Neighborhood(name = name, deliveryFee = deliveryFee, status = status))
        }
    }

    fun updateNeighborhood(neighborhood: Neighborhood) {
        viewModelScope.launch {
            repository.updateNeighborhood(neighborhood)
        }
    }

    fun deleteNeighborhood(id: Int) {
        viewModelScope.launch {
            repository.deleteNeighborhood(id)
        }
    }
    
    fun addTenant(name: String, plan: String, status: String, email: String) {
        viewModelScope.launch {
            repository.insertTenant(Tenant(name = name, plan = plan, status = status, ownerEmail = email))
        }
    }
    
    fun updateTenant(tenant: Tenant) {
        viewModelScope.launch {
            repository.updateTenant(tenant)
        }
    }
    
    fun deleteTenant(id: Int) {
        viewModelScope.launch {
            repository.deleteTenant(id)
        }
    }
}

class AppViewModelFactory(private val repository: AppRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AppViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return AppViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}

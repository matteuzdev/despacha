package com.example.data

import kotlinx.coroutines.flow.Flow

class AppRepository(private val dao: AppDao) {
    suspend fun login(email: String, pass: String): User? = dao.login(email, pass)
    suspend fun registerUser(user: User) = dao.insertUser(user)
    suspend fun getUserByEmail(email: String): User? = dao.getUserByEmail(email)

    val products: Flow<List<Product>> = dao.getAllProducts()
    val neighborhoods: Flow<List<Neighborhood>> = dao.getAllNeighborhoods()
    val orders: Flow<List<Order>> = dao.getAllOrders()

    suspend fun insertProduct(product: Product) = dao.insertProduct(product)
    suspend fun updateProductAvailability(id: Int, available: Boolean) = dao.updateProductAvailability(id, available)
    suspend fun updateProductFavorite(id: Int, isFavorite: Boolean) = dao.updateProductFavorite(id, isFavorite)
    suspend fun updateProductFull(product: Product) = dao.updateProduct(product)
    suspend fun deleteProduct(id: Int) = dao.deleteProduct(id)
    
    suspend fun insertNeighborhood(neighborhood: Neighborhood) = dao.insertNeighborhood(neighborhood)
    suspend fun updateNeighborhood(neighborhood: Neighborhood) = dao.updateNeighborhood(neighborhood)
    suspend fun deleteNeighborhood(id: Int) = dao.deleteNeighborhood(id)
    
    suspend fun insertOrder(order: Order) = dao.insertOrder(order)
    suspend fun updateOrderStatus(id: Int, status: String) = dao.updateOrderStatus(id, status)

    val tenants: Flow<List<Tenant>> = dao.getAllTenants()
    suspend fun insertTenant(tenant: Tenant) = dao.insertTenant(tenant)
    suspend fun updateTenant(tenant: Tenant) = dao.updateTenant(tenant)
    suspend fun deleteTenant(id: Int) = dao.deleteTenant(id)
}

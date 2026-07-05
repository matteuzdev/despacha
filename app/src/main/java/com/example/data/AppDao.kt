package com.example.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface AppDao {
    @Query("SELECT * FROM users WHERE LOWER(email) = LOWER(:email) AND passwordHash = :password LIMIT 1")
    suspend fun login(email: String, password: String): User?

    @Query("SELECT * FROM users WHERE email = :email LIMIT 1")
    suspend fun getUserByEmail(email: String): User?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: User)

    @Update
    suspend fun updateUser(user: User)

    @Query("SELECT * FROM products")
    fun getAllProducts(): Flow<List<Product>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProduct(product: Product)

    @Query("UPDATE products SET isAvailable = :isAvailable WHERE id = :id")
    suspend fun updateProductAvailability(id: Int, isAvailable: Boolean)

    @Query("UPDATE products SET isFavorite = :isFavorite WHERE id = :id")
    suspend fun updateProductFavorite(id: Int, isFavorite: Boolean)

    @Query("SELECT * FROM neighborhoods")
    fun getAllNeighborhoods(): Flow<List<Neighborhood>>

    @Query("SELECT * FROM tenants")
    fun getAllTenants(): Flow<List<Tenant>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTenant(tenant: Tenant)
    
    @Update
    suspend fun updateTenant(tenant: Tenant)

    @Query("DELETE FROM tenants WHERE id = :id")
    suspend fun deleteTenant(id: Int)

    @Update
    suspend fun updateProduct(product: Product)

    @Query("DELETE FROM products WHERE id = :id")
    suspend fun deleteProduct(id: Int)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNeighborhood(neighborhood: Neighborhood)

    @Update
    suspend fun updateNeighborhood(neighborhood: Neighborhood)

    @Query("DELETE FROM neighborhoods WHERE id = :id")
    suspend fun deleteNeighborhood(id: Int)

    @Query("SELECT * FROM orders ORDER BY createdAt DESC")
    fun getAllOrders(): Flow<List<Order>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrder(order: Order)

    @Query("UPDATE orders SET status = :status WHERE id = :id")
    suspend fun updateOrderStatus(id: Int, status: String)
}

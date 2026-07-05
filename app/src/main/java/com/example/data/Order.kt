package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class OrderItem(
    val productId: Int,
    val productName: String,
    val quantity: Int,
    val unitPrice: Double,
    val totalPrice: Double
)

@Entity(tableName = "orders")
data class Order(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val orderNumber: String,
    val customerName: String,
    val customerPhone: String,
    val addressStreet: String,
    val addressNumber: String,
    val addressNeighborhood: String,
    val addressComplement: String,
    val addressReference: String,
    val paymentMethod: String,
    val changeFor: Double,
    val subtotal: Double,
    val deliveryFee: Double,
    val total: Double,
    val status: String, // "Novo", "Confirmado", "Saiu", "Entregue", "Cancelado"
    val notes: String = "",
    val itemsJson: String, // Stored as JSON string
    val createdAt: Long = System.currentTimeMillis()
)

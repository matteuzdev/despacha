package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "products")
data class Product(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val description: String,
    val price: Double,
    val category: String, // "Gás", "Água", "Acessórios"
    val isAvailable: Boolean = true,
    val imageUrl: String = "",
    val isFavorite: Boolean = false,
    val isOrderBump: Boolean = false
)

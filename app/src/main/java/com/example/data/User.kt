package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class User(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val email: String,
    val passwordHash: String, // Keeping literal for simulation purposes
    val role: String, // "superAdmin", "admin", "delivery"
    val tenantId: Int? = null, // To associate with a tenant if role == "admin" or "delivery"
    val isFirstLogin: Boolean = false
)

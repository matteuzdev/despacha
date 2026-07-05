package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tenants")
data class Tenant(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val plan: String,
    val status: String,
    val ownerEmail: String,
    val businessName: String? = null,
    val address: String? = null,
    val colorHex: String? = null,
    val logoUrl: String? = null,
    val coverUrl: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)

package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "neighborhoods")
data class Neighborhood(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val deliveryFee: Double,
    val status: String // "available", "unavailable", "consult"
)

package com.example.data

import com.squareup.moshi.Moshi
import com.squareup.moshi.Types
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory

object MoshiHelper {
    private val moshi: Moshi = Moshi.Builder()
        // No KotlinJsonAdapterFactory if using codegen (which is in libs.version), but to be safe we could rely on code gen. We have `@JsonClass(generateAdapter = true)` on OrderItem
        .build()

    private val orderItemListType = Types.newParameterizedType(List::class.java, OrderItem::class.java)
    val orderItemListAdapter = moshi.adapter<List<OrderItem>>(orderItemListType)

    fun toJson(items: List<OrderItem>): String = orderItemListAdapter.toJson(items)
    fun fromJson(json: String): List<OrderItem> = orderItemListAdapter.fromJson(json) ?: emptyList()
}

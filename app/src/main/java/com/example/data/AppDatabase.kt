package com.example.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [Product::class, Neighborhood::class, Order::class, Tenant::class, User::class],
    version = 8,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun appDao(): AppDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "despacha_db_v5"
                )
                .addCallback(DatabaseCallback(context.applicationContext))
                .fallbackToDestructiveMigration()
                .build()
                .also { INSTANCE = it }
            }
        }
    }

    private class DatabaseCallback(private val context: Context) : RoomDatabase.Callback() {
        override fun onCreate(db: SupportSQLiteDatabase) {
            super.onCreate(db)
            
            // Insert initial super admin synchronously to avoid race condition on first login
            db.execSQL("INSERT INTO users (name, email, passwordHash, role, tenantId, isFirstLogin) VALUES ('Hianto CEO', 'hianto@despacha.com', 'Mateus32**', 'superAdmin', NULL, 0)")
            db.execSQL("INSERT INTO users (name, email, passwordHash, role, tenantId, isFirstLogin) VALUES ('João da Silva', 'lojista@despacha.com', 'lojista123', 'admin', 1, 0)")
            db.execSQL("INSERT INTO users (name, email, passwordHash, role, tenantId, isFirstLogin) VALUES ('Entregador Zé', 'entregador@despacha.com', 'entrega123', 'delivery', 1, 0)")
            
            val currentTime = System.currentTimeMillis()
            db.execSQL("INSERT INTO tenants (name, plan, status, ownerEmail, businessName, address, colorHex, createdAt) VALUES ('Depósito do João', 'PRO', 'Ativo', 'joao@exemplo.com', 'Depósito do João Gás & Água', 'Rua Principal, 123 - Centro', '#FF5722', $currentTime)")
            db.execSQL("INSERT INTO tenants (name, plan, status, ownerEmail, businessName, address, colorHex, createdAt) VALUES ('Gás Rápido Centro', 'FREE', 'Ativo', 'gas@exemplo.com', 'Gás Rápido Centro', 'Avenida das Américas, 456', '#2196F3', $currentTime)")

            db.execSQL("INSERT INTO products (name, description, price, category, imageUrl, isAvailable, isFavorite, isOrderBump) VALUES ('Botijão P13 Cheio', 'Gás de cozinha 13kg', 110.0, 'Gás', '', 1, 0, 0)")
            db.execSQL("INSERT INTO products (name, description, price, category, imageUrl, isAvailable, isFavorite, isOrderBump) VALUES ('Botijão P13 Troca', 'Apenas o líquido', 85.0, 'Gás', '', 1, 0, 0)")
            
            db.execSQL("INSERT INTO neighborhoods (name, deliveryFee, status) VALUES ('Centro', 0.0, 'available')")
            db.execSQL("INSERT INTO neighborhoods (name, deliveryFee, status) VALUES ('Aldeota', 5.0, 'available')")
        }
    }
}

package com.example.ui.saas

import com.example.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.FormBody
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.io.IOException

object StripeNetwork {
    private val client = OkHttpClient()

    // Note: Do not do this in a real production environment.
    // The Secret Key must never be shipped in the client app.
    // It's used here solely to simulate the backend intent creation locally for prototypes.
    private val secretKey = BuildConfig.STRIPE_SECRET_KEY

    suspend fun createPaymentIntent(amountStr: String): String? = withContext(Dispatchers.IO) {
        // Convert string like "R$ 49,90" to cents: 4990
        val numericAmount = try {
            amountStr.replace("R$", "").trim().replace(",", ".").toDouble().times(100).toLong()
        } catch (e: Exception) {
            0L
        }

        if (numericAmount == 0L || secretKey.isEmpty()) return@withContext null

        val formBody = FormBody.Builder()
            .add("amount", numericAmount.toString())
            .add("currency", "brl")
            .add("payment_method_types[]", "card")
            .add("payment_method_types[]", "pix")
            .build()

        val request = Request.Builder()
            .url("https://api.stripe.com/v1/payment_intents")
            .header("Authorization", "Bearer $secretKey")
            .post(formBody)
            .build()

        return@withContext try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val json = response.body?.string()
                val jsonObj = JSONObject(json ?: "")
                jsonObj.getString("client_secret")
            } else {
                null
            }
        } catch (e: IOException) {
            null
        }
    }
}

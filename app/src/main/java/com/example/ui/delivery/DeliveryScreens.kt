package com.example.ui.delivery

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.data.Order
import com.example.ui.AppViewModel

@Composable
fun DeliveryFlow(viewModel: AppViewModel, onBackToRoles: () -> Unit) {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = "onboarding") {
        composable("onboarding") {
            DeliveryOnboardingScreen(
                onBack = onBackToRoles,
                onComplete = { navController.navigate("dashboard") { popUpTo("onboarding") { inclusive = true } } }
            )
        }
        composable("dashboard") {
            DeliveryScreen(viewModel = viewModel, onBackToRoles = onBackToRoles)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeliveryScreen(viewModel: AppViewModel, onBackToRoles: () -> Unit) {
    val orders by viewModel.orders.collectAsStateWithLifecycle()
    val deliveryOrders = orders.filter { it.status == "Saiu" || it.status == "Confirmado" }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Área do Entregador") },
                navigationIcon = {
                    IconButton(onClick = onBackToRoles) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            Text(
                "Entregas Pendentes (${deliveryOrders.size})",
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.padding(16.dp)
            )
            if (deliveryOrders.isEmpty()) {
                Text("Nenhuma entrega no momento.", modifier = Modifier.padding(16.dp))
            } else {
                LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(deliveryOrders) { order ->
                        DeliveryOrderCard(order = order, onMarkDelivered = {
                            viewModel.updateOrderStatus(order.id, "Entregue")
                        })
                    }
                }
            }
        }
    }
}

@Composable
fun DeliveryOrderCard(order: Order, onMarkDelivered: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)) {
        Column(Modifier.padding(16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(order.orderNumber, fontWeight = FontWeight.Bold)
                Text(order.status, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(8.dp))
            Text("Cliente: ${order.customerName} (${order.customerPhone})")
            Text("Endereço: ${order.addressStreet}, ${order.addressNumber}")
            Text("Bairro: ${order.addressNeighborhood}")
            if (order.addressComplement.isNotEmpty()) {
                Text("Compl: ${order.addressComplement}")
            }
            Spacer(Modifier.height(8.dp))
            Text(String.format("Pagamento: %s (Total: R\$ %.2f)", order.paymentMethod, order.total), fontWeight = FontWeight.Bold)
            if (order.changeFor > 0) {
                Text(String.format("Levar troco para: R\$ %.2f", order.changeFor), color = MaterialTheme.colorScheme.error)
            }
            
            Spacer(Modifier.height(16.dp))
            Button(onClick = onMarkDelivered, modifier = Modifier.fillMaxWidth()) {
                Text("Marcar como Entregue")
            }
        }
    }
}

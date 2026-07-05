package com.example.ui.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Settings
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
fun AdminScreensWrapper(viewModel: AppViewModel, onBackToRoles: () -> Unit) {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = "dashboard") {
        composable("dashboard") {
            AdminScreen(viewModel = viewModel, onBackToRoles = onBackToRoles, onManageProducts = { navController.navigate("products") }, onManageSettings = { navController.navigate("settings") }, onManageNeighborhoods = { navController.navigate("neighborhoods") })
        }
        composable("products") {
            ProductManagementScreen(viewModel = viewModel, onBack = { navController.popBackStack() })
        }
        composable("settings") {
            TenantSettingsScreen(viewModel = viewModel, onBack = { navController.popBackStack() })
        }
        composable("neighborhoods") {
            NeighborhoodManagementScreen(viewModel = viewModel, onBack = { navController.popBackStack() })
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminScreen(viewModel: AppViewModel, onBackToRoles: () -> Unit, onManageProducts: () -> Unit, onManageSettings: () -> Unit, onManageNeighborhoods: () -> Unit) {
    val orders by viewModel.orders.collectAsStateWithLifecycle()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Área de Gestão") },
                navigationIcon = {
                    IconButton(onClick = onBackToRoles) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Sair")
                    }
                },
                actions = {
                    IconButton(onClick = onManageSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Configurações", tint = MaterialTheme.colorScheme.onPrimary)
                    }
                    TextButton(onClick = onManageNeighborhoods) { Text("Bairros", color = MaterialTheme.colorScheme.onPrimary) }
                    TextButton(onClick = onManageProducts) { Text("Catálogo", color = MaterialTheme.colorScheme.onPrimary) }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { padding ->
        LazyColumn(modifier = Modifier.padding(padding).fillMaxSize()) {
            item {
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Text("Olá, Administrador!", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onPrimaryContainer)
                        Text("Acompanhe o desempenho da sua loja pelo Despacha.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onPrimaryContainer)
                    }
                }
                Spacer(Modifier.height(16.dp))
                DashboardVisuals(orders = orders)
            }
            
            item {
                Text(
                    "Pedidos Recentes (${orders.size})",
                    style = MaterialTheme.typography.titleLarge,
                    modifier = Modifier.padding(16.dp)
                )
            }
            
            items(orders) { order ->
                Box(Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                    AdminOrderCard(order = order, onStatusChange = { newStatus ->
                        viewModel.updateOrderStatus(order.id, newStatus)
                    })
                }
            }
        }
    }
}

@Composable
fun AdminOrderCard(order: Order, onStatusChange: (String) -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)) {
        Column(Modifier.padding(16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(order.orderNumber, fontWeight = FontWeight.Bold)
                Text(order.status, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(8.dp))
            Text("Cliente: ${order.customerName}")
            Text("Endereço: ${order.addressStreet}, ${order.addressNumber} - ${order.addressNeighborhood}")
            Text(String.format("Total: R\$ %.2f", order.total))
            Spacer(Modifier.height(8.dp))
            
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                Button(onClick = { onStatusChange("Confirmado") }, enabled = order.status == "Novo" || order.status == "Aguardando análise") {
                    Text("Confirmar")
                }
                Button(onClick = { onStatusChange("Saiu") }, enabled = order.status == "Confirmado") {
                    Text("Enviar")
                }
                OutlinedButton(onClick = { onStatusChange("Cancelado") }, enabled = order.status != "Entregue" && order.status != "Cancelado") {
                    Text("Cancelar")
                }
            }
        }
    }
}

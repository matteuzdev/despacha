package com.example.ui.saas

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.ui.AppViewModel
import com.example.data.Tenant

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SuperAdminScreen(viewModel: AppViewModel, onBack: () -> Unit) {
    val tenants by viewModel.tenants.collectAsStateWithLifecycle()
    var showAddDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Dashboard Super Admin") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar") }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Adicionar Tenant")
            }
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize().padding(16.dp)) {
            Text("Visão Geral do SaaS", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(16.dp))
            
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                MetricCard("Tenants Ativos", "${tenants.size}", Modifier.weight(1f))
                
                // Calculo simples de MRR baseado no plano (Mock: PRO = R$49.90, FREE = R$0)
                val mrr = tenants.count { it.plan == "PRO" } * 49.90
                MetricCard("MRR Estimado", String.format("R$ %.2f", mrr), Modifier.weight(1f))
            }
            Spacer(Modifier.height(32.dp))
            
            Text("Lojas e Depósitos Cadastrados", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(16.dp))
            
            if (tenants.isEmpty()) {
                Box(Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) { Text("Nenhum tenant cadastrado.") }
            } else {
                LazyColumn {
                    items(tenants) { tenant ->
                        TenantItem(
                            tenant = tenant,
                            onDelete = { viewModel.deleteTenant(tenant.id) }
                        )
                    }
                }
            }
        }

        if (showAddDialog) {
            AddTenantDialog(
                onDismiss = { showAddDialog = false },
                onAdd = { name, plan, status, email ->
                    viewModel.addTenant(name, plan, status, email)
                    showAddDialog = false
                }
            )
        }
    }
}

@Composable
fun AddTenantDialog(onDismiss: () -> Unit, onAdd: (String, String, String, String) -> Unit) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var plan by remember { mutableStateOf("PRO") }
    var status by remember { mutableStateOf("Ativo") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Novo Tenant / Loja") },
        text = {
            Column {
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Nome do Negócio") }, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email do Proprietário") }, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(8.dp))
                
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(selected = plan == "FREE", onClick = { plan = "FREE" })
                        Text("FREE")
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(selected = plan == "PRO", onClick = { plan = "PRO" })
                        Text("PRO")
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = { onAdd(name, plan, status, email) }) { Text("Adicionar") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}

@Composable
fun MetricCard(title: String, value: String, modifier: Modifier = Modifier) {
    Card(modifier = modifier) {
        Column(Modifier.padding(16.dp)) {
            Text(title, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(8.dp))
            Text(value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
        }
    }
}

@Composable
fun TenantItem(tenant: Tenant, onDelete: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Row(Modifier.padding(16.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(tenant.name, fontWeight = FontWeight.Bold)
                Text("Plano ${tenant.plan}", style = MaterialTheme.typography.bodySmall)
                Text(tenant.ownerEmail, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Badge(containerColor = MaterialTheme.colorScheme.secondaryContainer) {
                    Text(tenant.status, modifier = Modifier.padding(4.dp))
                }
                Spacer(Modifier.width(8.dp))
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, contentDescription = "Deletar", tint = MaterialTheme.colorScheme.error)
                }
            }
        }
    }
}

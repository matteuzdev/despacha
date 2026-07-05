package com.example.ui.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.Neighborhood
import com.example.ui.AppViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NeighborhoodManagementScreen(viewModel: AppViewModel, onBack: () -> Unit) {
    val neighborhoods by viewModel.neighborhoods.collectAsStateWithLifecycle()
    var showAddDialog by remember { mutableStateOf(false) }
    var editingNeighborhood by remember { mutableStateOf<Neighborhood?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Taxas de Entrega") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar") }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Adicionar Bairro")
            }
        }
    ) { padding ->
        if (neighborhoods.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) { Text("Nenhum bairro cadastrado.") }
        } else {
            LazyColumn(modifier = Modifier.padding(padding).fillMaxSize(), contentPadding = PaddingValues(16.dp)) {
                items(neighborhoods) { neighborhood ->
                    Card(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)) {
                        Row(Modifier.padding(16.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(neighborhood.name, fontWeight = FontWeight.Bold)
                                Text("Taxa: R$ ${"%.2f".format(neighborhood.deliveryFee)}", color = MaterialTheme.colorScheme.primary)
                                val statusText = when (neighborhood.status) {
                                    "available" -> "Disponível"
                                    "consult" -> "Sob Consulta"
                                    else -> "Indisponível"
                                }
                                Text("Status: $statusText", style = MaterialTheme.typography.bodySmall)
                            }
                            Row {
                                IconButton(onClick = { editingNeighborhood = neighborhood }) {
                                    Icon(Icons.Default.Edit, contentDescription = "Editar", tint = MaterialTheme.colorScheme.primary)
                                }
                                IconButton(onClick = { viewModel.deleteNeighborhood(neighborhood.id) }) {
                                    Icon(Icons.Default.Delete, contentDescription = "Excluir", tint = MaterialTheme.colorScheme.error)
                                }
                            }
                        }
                    }
                }
            }
        }

        if (showAddDialog || editingNeighborhood != null) {
            NeighborhoodEditDialog(
                neighborhood = editingNeighborhood,
                onDismiss = { 
                    showAddDialog = false
                    editingNeighborhood = null
                },
                onSave = { name, fee, status ->
                    if (editingNeighborhood != null) {
                        viewModel.updateNeighborhood(editingNeighborhood!!.copy(name = name, deliveryFee = fee, status = status))
                    } else {
                        viewModel.addNeighborhood(name, fee, status)
                    }
                    showAddDialog = false
                    editingNeighborhood = null
                }
            )
        }
    }
}

@Composable
fun NeighborhoodEditDialog(neighborhood: Neighborhood?, onDismiss: () -> Unit, onSave: (String, Double, String) -> Unit) {
    var name by remember { mutableStateOf(neighborhood?.name ?: "") }
    var feeStr by remember { mutableStateOf(neighborhood?.deliveryFee?.toString() ?: "") }
    var status by remember { mutableStateOf(neighborhood?.status ?: "available") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (neighborhood != null) "Editar Bairro" else "Novo Bairro") },
        text = {
            Column {
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Nome do Bairro") }, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(value = feeStr, onValueChange = { feeStr = it }, label = { Text("Taxa (ex: 5.00)") }, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(8.dp))
                // Simple status selector (Dropdown would be better but keeping it simple with Row)
                Text("Status:")
                Row(verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(selected = status == "available", onClick = { status = "available" })
                    Text("Disponível")
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(selected = status == "consult", onClick = { status = "consult" })
                    Text("Sob Consulta")
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(selected = status == "unavailable", onClick = { status = "unavailable" })
                    Text("Indisponível")
                }
            }
        },
        confirmButton = {
            Button(onClick = {
                val fee = feeStr.replace(",", ".").toDoubleOrNull() ?: 0.0
                onSave(name, fee, status)
            }) { Text("Salvar") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}

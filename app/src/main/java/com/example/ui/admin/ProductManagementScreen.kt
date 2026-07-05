package com.example.ui.admin

import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Image
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.ui.AppViewModel
import com.example.data.Product

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductManagementScreen(viewModel: AppViewModel, onBack: () -> Unit) {
    val products by viewModel.products.collectAsStateWithLifecycle()
    var showAddDialog by remember { mutableStateOf(false) }
    var editingProduct by remember { mutableStateOf<Product?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Gerenciar Catálogo") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar") }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Adicionar Produto")
            }
        }
    ) { padding ->
        if (products.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) { Text("Nenhum produto cadastrado.") }
        } else {
            LazyColumn(modifier = Modifier.padding(padding).fillMaxSize(), contentPadding = PaddingValues(16.dp)) {
                items(products) { product ->
                    Card(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)) {
                        Row(Modifier.padding(16.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(product.name, fontWeight = FontWeight.Bold)
                                Text(product.description, style = MaterialTheme.typography.bodySmall)
                                Text(String.format("R$ %.2f", product.price), color = MaterialTheme.colorScheme.primary)
                            }
                            Row {
                                IconButton(onClick = { editingProduct = product }) {
                                    Icon(Icons.Default.Edit, contentDescription = "Editar", tint = MaterialTheme.colorScheme.primary)
                                }
                                IconButton(onClick = { viewModel.deleteProduct(product.id) }) {
                                    Icon(Icons.Default.Delete, contentDescription = "Excluir", tint = MaterialTheme.colorScheme.error)
                                }
                            }
                        }
                    }
                }
            }
        }

        if (showAddDialog || editingProduct != null) {
            ProductEditDialog(
                product = editingProduct,
                onDismiss = { 
                    showAddDialog = false
                    editingProduct = null
                },
                onSave = { name, desc, price, cat, imgUrl, bump ->
                    if (editingProduct != null) {
                        viewModel.updateProduct(editingProduct!!.copy(name = name, description = desc, price = price, category = cat, imageUrl = imgUrl, isOrderBump = bump))
                    } else {
                        viewModel.addProduct(name, desc, price, cat, imgUrl, bump)
                    }
                    showAddDialog = false
                    editingProduct = null
                }
            )
        }
    }
}

@Composable
fun ProductEditDialog(product: Product?, onDismiss: () -> Unit, onSave: (String, String, Double, String, String, Boolean) -> Unit) {
    var name by remember { mutableStateOf(product?.name ?: "") }
    var desc by remember { mutableStateOf(product?.description ?: "") }
    var priceStr by remember { mutableStateOf(product?.price?.toString() ?: "") }
    var category by remember { mutableStateOf(product?.category ?: "Geral") }
    var imageUrl by remember { mutableStateOf(product?.imageUrl ?: "") }
    var isOrderBump by remember { mutableStateOf(product?.isOrderBump ?: false) }

    val context = LocalContext.current
    val imagePicker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        if (uri != null) {
            context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
            imageUrl = uri.toString()
        }
    }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (product != null) "Editar Produto" else "Novo Produto") },
        text = {
            Column {
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Nome") }, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(value = desc, onValueChange = { desc = it }, label = { Text("Descrição") }, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(value = priceStr, onValueChange = { priceStr = it }, label = { Text("Preço (ex: 45.90)") }, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(value = category, onValueChange = { category = it }, label = { Text("Categoria") }, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(8.dp))
                OutlinedButton(
                    onClick = { imagePicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Image, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text(if (imageUrl.isNotEmpty()) "Imagem Selecionada" else "Selecionar Imagem (Opcional)")
                }
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = isOrderBump, onCheckedChange = { isOrderBump = it })
                    Text("Destacar como Order Bump (Venda Adicional)")
                }
            }
        },
        confirmButton = {
            Button(onClick = {
                val cleanPrice = priceStr.replace(",", ".")
                val price = cleanPrice.toDoubleOrNull() ?: 0.0
                onSave(name, desc, price, category, imageUrl, isOrderBump)
            }) { Text("Salvar") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}

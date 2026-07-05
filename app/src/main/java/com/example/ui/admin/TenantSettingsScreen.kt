package com.example.ui.admin

import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Image
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.ui.AppViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TenantSettingsScreen(viewModel: AppViewModel, onBack: () -> Unit) {
    // Para simplificar, assumimos o primeiro tenant como sendo o do Lojista atual.
    val tenants by viewModel.tenants.collectAsStateWithLifecycle()
    val tenant = tenants.firstOrNull()
    val context = LocalContext.current

    var name by remember(tenant) { mutableStateOf(tenant?.businessName ?: "") }
    var address by remember(tenant) { mutableStateOf(tenant?.address ?: "") }
    var colorHex by remember(tenant) { mutableStateOf(tenant?.colorHex ?: "") }
    var logoUrl by remember(tenant) { mutableStateOf(tenant?.logoUrl ?: "") }
    var coverUrl by remember(tenant) { mutableStateOf(tenant?.coverUrl ?: "") }

    val logoPicker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        if (uri != null) {
            context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
            logoUrl = uri.toString()
        }
    }

    val coverPicker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        if (uri != null) {
            context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
            coverUrl = uri.toString()
        }
    }

    val preDefinedColors = listOf(
        Pair("Laranja (Gás)", "#FF5722"),
        Pair("Azul (Água)", "#2196F3"),
        Pair("Verde (Natureza)", "#4CAF50"),
        Pair("Vermelho (Urgência)", "#F44336"),
        Pair("Roxo (Premium)", "#9C27B0"),
        Pair("Preto (Elegante)", "#212121")
    )
    var expandedColorDropdown by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Personalização da Loja") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar") }
                }
            )
        }
    ) { padding ->
        Column(Modifier.padding(padding).padding(16.dp).fillMaxSize().verticalScroll(rememberScrollState())) {
            Text("Defina a identidade visual e dados da sua loja.", style = MaterialTheme.typography.bodyLarge)
            Spacer(Modifier.height(24.dp))
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Nome do Negócio") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(16.dp))
            OutlinedTextField(
                value = address,
                onValueChange = { address = it },
                label = { Text("Endereço Completo") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(16.dp))
            ExposedDropdownMenuBox(
                expanded = expandedColorDropdown,
                onExpandedChange = { expandedColorDropdown = it }
            ) {
                val selectedColorName = preDefinedColors.find { it.second == colorHex }?.first ?: "Selecione uma cor"
                OutlinedTextField(
                    value = selectedColorName,
                    onValueChange = { },
                    readOnly = true,
                    label = { Text("Cor Principal da Loja") },
                    trailingIcon = {
                        ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedColorDropdown)
                    },
                    colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                    modifier = Modifier.fillMaxWidth().menuAnchor()
                )
                ExposedDropdownMenu(
                    expanded = expandedColorDropdown,
                    onDismissRequest = { expandedColorDropdown = false }
                ) {
                    preDefinedColors.forEach { colorPair ->
                        DropdownMenuItem(
                            text = { 
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Surface(modifier = Modifier.size(24.dp), shape = androidx.compose.foundation.shape.CircleShape, color = androidx.compose.ui.graphics.Color(android.graphics.Color.parseColor(colorPair.second))) {}
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(colorPair.first)
                                }
                            },
                            onClick = {
                                colorHex = colorPair.second
                                expandedColorDropdown = false
                            }
                        )
                    }
                }
            }
            Spacer(Modifier.height(16.dp))
            OutlinedButton(
                onClick = { logoPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.Image, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text(if (logoUrl.isNotEmpty()) "Logo Selecionada" else "Selecionar Logo (Opcional)")
            }
            Spacer(Modifier.height(16.dp))
            OutlinedButton(
                onClick = { coverPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.Image, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text(if (coverUrl.isNotEmpty()) "Capa Selecionada" else "Selecionar Capa (Opcional)")
            }
            Spacer(Modifier.height(32.dp))
            Button(
                onClick = {
                    tenant?.let {
                        viewModel.updateTenant(it.copy(
                            businessName = name,
                            address = address,
                            colorHex = colorHex,
                            logoUrl = logoUrl.ifBlank { null },
                            coverUrl = coverUrl.ifBlank { null }
                        ))
                    }
                    onBack()
                },
                modifier = Modifier.fillMaxWidth().height(56.dp)
            ) {
                Text("Salvar Preferências")
            }
        }
    }
}

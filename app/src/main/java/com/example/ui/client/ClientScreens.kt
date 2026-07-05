package com.example.ui.client

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import coil.compose.AsyncImage
import com.example.data.Neighborhood
import com.example.data.Product
import com.example.ui.AppViewModel

@Composable
fun ClientFlow(viewModel: AppViewModel, onBackToRoles: () -> Unit) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Scaffold(
        bottomBar = {
            if (currentRoute in listOf("catalog", "favorites", "history")) {
                NavigationBar(containerColor = MaterialTheme.colorScheme.surfaceVariant) {
                    NavigationBarItem(
                        icon = { Icon(Icons.Default.Home, contentDescription = "Início") },
                        label = { Text("Início") },
                        selected = currentRoute == "catalog",
                        onClick = {
                            navController.navigate("catalog") {
                                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                    NavigationBarItem(
                        icon = { Icon(Icons.Default.Favorite, contentDescription = "Favoritos") },
                        label = { Text("Favoritos") },
                        selected = currentRoute == "favorites",
                        onClick = {
                            navController.navigate("favorites") {
                                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                    NavigationBarItem(
                        icon = { Icon(Icons.Default.Receipt, contentDescription = "Pedidos") },
                        label = { Text("Pedidos") },
                        selected = currentRoute == "history",
                        onClick = {
                            navController.navigate("history") {
                                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController, 
            startDestination = "catalog",
            modifier = Modifier.padding(innerPadding)
        ) {
            composable("catalog") {
                CatalogScreen(
                    viewModel = viewModel,
                    onBack = onBackToRoles,
                    onGoToCart = { navController.navigate("cart") }
                )
            }
            composable("favorites") {
                FavoritesScreen(
                    viewModel = viewModel,
                    onGoToCart = { navController.navigate("cart") }
                )
            }
            composable("history") {
                HistoryScreen(viewModel = viewModel)
            }
            composable("cart") {
            CartScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onCheckout = { navController.navigate("checkout") }
            )
        }
        composable("checkout") {
            CheckoutScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onOrderSuccess = {
                    navController.navigate("success") {
                        popUpTo("catalog") { inclusive = false }
                    }
                }
            )
        }
        composable("success") {
            OrderSuccessScreen(
                onBackToCatalog = {
                    navController.navigate("catalog") {
                        popUpTo("catalog") { inclusive = true }
                    }
                }
            )
        }
    }
}
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CatalogScreen(viewModel: AppViewModel, onBack: () -> Unit, onGoToCart: () -> Unit) {
    val products by viewModel.products.collectAsStateWithLifecycle()
    val cartItems by viewModel.cartItems.collectAsStateWithLifecycle()
    val tenants by viewModel.tenants.collectAsStateWithLifecycle()
    val tenant = tenants.firstOrNull()

    // Using a simple Surface and standard components for the vitrine look
    // A more advanced integration would use Coil for async image loading, but here we use placeholder shapes if URLs exist
    
    // Group products by category
    val groupedProducts = products.filter { it.isAvailable }.groupBy { it.category }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(tenant?.businessName ?: "Catálogo") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = tenant?.colorHex?.let {  try { Color(android.graphics.Color.parseColor(it)) } catch(e:Exception){ MaterialTheme.colorScheme.primary } } ?: MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary,
                    actionIconContentColor = MaterialTheme.colorScheme.onPrimary
                ),
                actions = {
                    Box(modifier = Modifier.padding(end = 8.dp)) {
                        IconButton(onClick = onGoToCart) {
                            Icon(Icons.Default.ShoppingCart, contentDescription = "Carrinho")
                        }
                        if (cartItems.isNotEmpty()) {
                            Badge(modifier = Modifier.align(Alignment.TopEnd).padding(4.dp)) { Text(cartItems.sumOf { it.quantity }.toString()) }
                        }
                    }
                }
            )
        }
    ) { padding ->
        if (products.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) { Text("Nenhum produto disponível.") }
            return@Scaffold
        }
        
        LazyColumn(
            modifier = Modifier.padding(padding).fillMaxSize()
        ) {
            item {
                Column(modifier = Modifier.fillMaxWidth()) {
                    // Cover Image placeholder
                    Box(modifier = Modifier.fillMaxWidth().height(150.dp)) {
                        if (tenant?.coverUrl != null) {
                            AsyncImage(
                                model = tenant.coverUrl,
                                contentDescription = "Capa da loja",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        } else {
                            Surface(
                                modifier = Modifier.fillMaxSize(),
                                color = tenant?.colorHex?.let { try { Color(android.graphics.Color.parseColor(it)).copy(alpha = 0.5f) } catch(e:Exception){ Color.LightGray } } ?: Color.LightGray
                            ) {}
                        }

                        // Logo placeholder
                        Surface(
                            modifier = Modifier
                                .size(80.dp)
                                .align(Alignment.BottomStart)
                                .offset(x = 16.dp, y = (40).dp),
                            shape = androidx.compose.foundation.shape.CircleShape,
                            color = Color.White,
                            shadowElevation = 4.dp
                        ) {
                             if (tenant?.logoUrl != null) {
                                AsyncImage(
                                    model = tenant.logoUrl,
                                    contentDescription = "Logo",
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Crop
                                )
                             } else {
                                Icon(Icons.Default.Home, contentDescription = "Logo", tint = Color.Gray, modifier = Modifier.padding(16.dp).fillMaxSize())
                             }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(48.dp))
                    
                    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                        Text(tenant?.businessName ?: "Sua Loja", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                        Text(tenant?.address ?: "Consulte opções de entrega", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }
            }

            groupedProducts.forEach { (cat, catProducts) ->
                item {
                    Text(
                        text = cat,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }
                items(catProducts) { product ->
                    Box(Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                        ProductCard(
                            product = product, 
                            onAdd = { viewModel.addToCart(product, 1) },
                            onToggleFavorite = { viewModel.toggleFavorite(product.id, !product.isFavorite) }
                        )
                    }
                }
            }
            
            item {
                Spacer(Modifier.height(32.dp))
            }
        }
    }
}

@Composable
fun ProductCard(product: Product, onAdd: () -> Unit, onToggleFavorite: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Product image
            Surface(
                modifier = Modifier.size(64.dp),
                shape = MaterialTheme.shapes.medium,
                color = MaterialTheme.colorScheme.surfaceVariant
            ) {
                if (product.imageUrl.isNotEmpty()) {
                    AsyncImage(
                        model = product.imageUrl,
                        contentDescription = product.name,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.ShoppingCart, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
            Spacer(Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(product.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    IconButton(onClick = onToggleFavorite) {
                        Icon(
                            imageVector = if (product.isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                            contentDescription = "Favorito",
                            tint = if (product.isFavorite) Color.Red else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Spacer(Modifier.height(4.dp))
                Text(product.description, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(8.dp))
                Text(String.format("R\$ %.2f", product.price), style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
            }
            Spacer(Modifier.width(16.dp))
            Button(onClick = onAdd, shape = MaterialTheme.shapes.medium) {
                Text("Adicionar")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FavoritesScreen(viewModel: AppViewModel, onGoToCart: () -> Unit) {
    val products by viewModel.products.collectAsStateWithLifecycle()
    val cartItems by viewModel.cartItems.collectAsStateWithLifecycle()
    val favorites = products.filter { it.isFavorite && it.isAvailable }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Favoritos") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary
                ),
                actions = {
                    Box(modifier = Modifier.padding(end = 8.dp)) {
                        IconButton(onClick = onGoToCart) {
                            Icon(Icons.Default.ShoppingCart, contentDescription = "Carrinho", tint = MaterialTheme.colorScheme.onPrimary)
                        }
                        if (cartItems.isNotEmpty()) {
                            Badge(
                                modifier = Modifier.align(Alignment.TopEnd).padding(4.dp)
                            ) { Text(cartItems.sumOf { it.quantity }.toString()) }
                        }
                    }
                }
            )
        }
    ) { padding ->
        if (favorites.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("Você ainda não adicionou favoritos.")
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.padding(padding).fillMaxSize()
            ) {
                items(favorites) { product ->
                    ProductCard(
                        product = product,
                        onAdd = { viewModel.addToCart(product, 1) },
                        onToggleFavorite = { viewModel.toggleFavorite(product.id, !product.isFavorite) }
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HistoryScreen(viewModel: AppViewModel) {
    val orders by viewModel.orders.collectAsStateWithLifecycle()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Histórico de Pedidos") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { padding ->
        if (orders.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("Você ainda não fez nenhum pedido no dispositivo.")
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.padding(padding).fillMaxSize()
            ) {
                items(orders) { order ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Pedido: ${order.orderNumber}", fontWeight = FontWeight.Bold)
                                Text(order.status, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                            }
                            Spacer(Modifier.height(8.dp))
                            Text("Data: ${java.text.SimpleDateFormat("dd/MM/yyyy HH:mm").format(java.util.Date(order.createdAt))}")
                            Spacer(Modifier.height(16.dp))
                            
                            val itemsList = com.example.data.MoshiHelper.fromJson(order.itemsJson)
                            itemsList.forEach { item ->
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("${item.quantity}x ${item.productName}", style = MaterialTheme.typography.bodyMedium)
                                    Text(String.format("R\$ %.2f", item.totalPrice), style = MaterialTheme.typography.bodyMedium)
                                }
                            }
                            
                            HorizontalDivider(Modifier.padding(vertical = 8.dp))
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Total", fontWeight = FontWeight.Bold)
                                Text(String.format("R\$ %.2f", order.total), fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CartScreen(viewModel: AppViewModel, onBack: () -> Unit, onCheckout: () -> Unit) {
    val items by viewModel.cartItems.collectAsStateWithLifecycle()
    val products by viewModel.products.collectAsStateWithLifecycle()
    val total = items.sumOf { it.totalPrice }
    
    // Order Bump: Seleciona produtos marcados como Order Bump, caso contrário pega aleatórios
    val cartProductIds = items.map { it.productId }
    val bumpCandidates = products.filter { !cartProductIds.contains(it.id) && it.isAvailable }
    val orderBumpProducts = bumpCandidates.filter { it.isOrderBump }
        .ifEmpty { bumpCandidates.shuffled() }
        .take(2)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Carrinho") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar") }
                }
            )
        },
        bottomBar = {
            if (items.isNotEmpty()) {
                Surface(shadowElevation = 8.dp) {
                    Column(Modifier.padding(16.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Total", style = MaterialTheme.typography.titleLarge)
                            Text(String.format("R\$ %.2f", total), style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary)
                        }
                        Spacer(Modifier.height(16.dp))
                        Button(onClick = onCheckout, modifier = Modifier.fillMaxWidth().height(56.dp)) {
                            Text("Finalizar Pedido")
                        }
                    }
                }
            }
        }
    ) { padding ->
        if (items.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("Seu carrinho está vazio")
            }
        } else {
            LazyColumn(modifier = Modifier.padding(padding).fillMaxSize(), contentPadding = PaddingValues(16.dp)) {
                items(items) { item ->
                    Card(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)) {
                        Row(Modifier.padding(16.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(item.productName, fontWeight = FontWeight.Bold)
                                Text(String.format("R\$ %.2f", item.unitPrice))
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                IconButton(onClick = { viewModel.updateCartQuantity(item.productId, item.quantity - 1) }) {
                                    Icon(Icons.Default.Remove, contentDescription = "-")
                                }
                                Text("${item.quantity}", modifier = Modifier.padding(horizontal = 8.dp))
                                IconButton(onClick = { viewModel.updateCartQuantity(item.productId, item.quantity + 1) }) {
                                    Icon(Icons.Default.Add, contentDescription = "+")
                                }
                            }
                        }
                    }
                }
                
                if (orderBumpProducts.isNotEmpty()) {
                    item {
                        Spacer(Modifier.height(24.dp))
                        Text("Aproveite e leve também:", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
                        Spacer(Modifier.height(8.dp))
                    }
                    
                    items(orderBumpProducts) { bumpItem ->
                        Card(
                            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp).fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(Modifier.weight(1f)) {
                                    Text(bumpItem.name, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
                                    Text(String.format("+ R\$ %.2f", bumpItem.price), color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.labelMedium)
                                }
                                Button(
                                    onClick = { viewModel.addToCart(bumpItem, 1) },
                                    modifier = Modifier.height(36.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp)
                                ) {
                                    Text("Adicionar", style = MaterialTheme.typography.labelSmall)
                                }
                            }
                        }
                    }
                }
                
                // Espaçamento extra no fundo
                item { Spacer(Modifier.height(80.dp)) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CheckoutScreen(viewModel: AppViewModel, onBack: () -> Unit, onOrderSuccess: () -> Unit) {
    val neighborhoods by viewModel.neighborhoods.collectAsStateWithLifecycle()
    val cart by viewModel.cartItems.collectAsStateWithLifecycle()
    val subtotal = cart.sumOf { it.totalPrice }

    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var street by remember { mutableStateOf("") }
    var number by remember { mutableStateOf("") }
    var complement by remember { mutableStateOf("") }
    var reference by remember { mutableStateOf("") }
    
    var selectedNeighborhood by remember { mutableStateOf<Neighborhood?>(null) }
    var expandedNeighborhood by remember { mutableStateOf(false) }

    var paymentMethod by remember { mutableStateOf("Pix") }
    var changeFor by remember { mutableStateOf("0.0") }

    val total = subtotal + (selectedNeighborhood?.deliveryFee ?: 0.0)

    Scaffold(
        topBar = { TopAppBar(title = { Text("Finalizar Pedido") }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar") } }) },
        bottomBar = {
            Surface(shadowElevation = 8.dp) {
                Column(Modifier.padding(16.dp)) {
                    Button(
                        onClick = {
                            viewModel.placeOrder(
                                name, phone, street, number, selectedNeighborhood, complement, reference,
                                paymentMethod, changeFor.toDoubleOrNull() ?: 0.0, onSuccess = onOrderSuccess
                            )
                        },
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        enabled = name.isNotBlank() && phone.isNotBlank() && street.isNotBlank() && selectedNeighborhood != null
                    ) {
                        Text("Confirmar Pedido")
                    }
                }
            }
        }
    ) { padding ->
        LazyColumn(contentPadding = PaddingValues(16.dp), modifier = Modifier.padding(padding).fillMaxSize()) {
            item {
                Text("Dados do Cliente", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Nome Completo") }, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(value = phone, onValueChange = { phone = it }, label = { Text("WhatsApp") }, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(24.dp))
                
                Text("Endereço de Entrega", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(value = street, onValueChange = { street = it }, label = { Text("Rua") }, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(8.dp))
                Row {
                    OutlinedTextField(value = number, onValueChange = { number = it }, label = { Text("Número") }, modifier = Modifier.weight(1f))
                    Spacer(Modifier.width(8.dp))
                    OutlinedTextField(value = complement, onValueChange = { complement = it }, label = { Text("Complemento") }, modifier = Modifier.weight(1f))
                }
                Spacer(Modifier.height(8.dp))
                
                ExposedDropdownMenuBox(expanded = expandedNeighborhood, onExpandedChange = { expandedNeighborhood = !expandedNeighborhood }) {
                    OutlinedTextField(
                        value = selectedNeighborhood?.name ?: "Selecione o Bairro",
                        onValueChange = {}, readOnly = true,
                        modifier = Modifier.menuAnchor().fillMaxWidth(),
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedNeighborhood) },
                        colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors()
                    )
                    ExposedDropdownMenu(expanded = expandedNeighborhood, onDismissRequest = { expandedNeighborhood = false }) {
                        neighborhoods.forEach { n ->
                            DropdownMenuItem(
                                text = { Text("${n.name} (Taxa: R$ ${n.deliveryFee})") },
                                onClick = { selectedNeighborhood = n; expandedNeighborhood = false }
                            )
                        }
                    }
                }
                
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(value = reference, onValueChange = { reference = it }, label = { Text("Ponto de Referência") }, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(24.dp))

                Text("Pagamento", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.height(8.dp))
                
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    listOf("Pix", "Dinheiro", "Cartão").forEach { method ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(selected = method == paymentMethod, onClick = { paymentMethod = method })
                            Text(method)
                        }
                    }
                }
                
                if (paymentMethod == "Dinheiro") {
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(value = changeFor, onValueChange = { changeFor = it }, label = { Text("Troco para quanto?") }, modifier = Modifier.fillMaxWidth())
                }

                Spacer(Modifier.height(32.dp))
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)) {
                    Column(Modifier.padding(16.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text("Subtotal"); Text(String.format("R\$ %.2f", subtotal)) }
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text("Taxa de Entrega"); Text(String.format("R\$ %.2f", selectedNeighborhood?.deliveryFee ?: 0.0)) }
                        HorizontalDivider(Modifier.padding(vertical = 8.dp))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Total", fontWeight = FontWeight.Bold)
                            Text(String.format("R\$ %.2f", total), fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun OrderSuccessScreen(onBackToCatalog: () -> Unit) {
    Column(
        Modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("Pedido Recebido!", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(16.dp))
        Text("Obrigado pelo seu pedido. Agora é só aguardar a confirmação de entrega.", style = MaterialTheme.typography.bodyLarge)
        Spacer(Modifier.height(32.dp))
        Button(onClick = onBackToCatalog, modifier = Modifier.fillMaxWidth().height(56.dp)) { Text("Voltar à Loja") }
    }
}

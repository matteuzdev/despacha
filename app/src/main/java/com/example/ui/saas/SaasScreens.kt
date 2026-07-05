package com.example.ui.saas

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.RocketLaunch
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.ui.components.DespachaLogoHorizontal
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LandingScreen(onNavigateToPricing: () -> Unit, onNavigateToApp: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { DespachaLogoHorizontal(iconSize = 28.dp) },
                actions = {
                    TextButton(onClick = onNavigateToApp) {
                        Text("Acessar Plataforma")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            item {
                DespachaLogoHorizontal(iconSize = 64.dp)
                Spacer(Modifier.height(24.dp))
                Text(
                    "O Sistema de Pedidos Automático para o seu Depósito",
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
                Spacer(Modifier.height(16.dp))
                Text(
                    "Venda gás e água no piloto automático. Sem ligações perdidas, sem erros no endereço. Um link, múltiplos pedidos.",
                    style = MaterialTheme.typography.bodyLarge,
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.height(32.dp))
                Button(
                    onClick = onNavigateToPricing,
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = MaterialTheme.shapes.medium
                ) {
                    Text("Começar Agora - Escolha seu Plano", fontSize = 18.sp)
                }
                Spacer(Modifier.height(48.dp))
            }

            item {
                Text("Vantagens do Despacha", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(24.dp))
                FeatureItem("Cardápio Digital Integrado", "Seu depósito tem uma vitrine online pra clientes comprarem a qualquer hora.")
                FeatureItem("Fim dos Erros pelo WhatsApp", "Seus clientes preenchem os dados deles mesmos, evitando endereços errados e perda de tempo.")
                FeatureItem("Organização Total", "Painel que mostra novos pedidos e direciona para seus entregadores de forma fácil.")
                FeatureItem("Order Bump Inteligente", "Aumente seu ticket médio oferecendo produtos extras como água junto com o gás.")
            }
        }
    }
}

@Composable
fun FeatureItem(title: String, desc: String) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp)) {
        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.width(16.dp))
        Column {
            Text(title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
            Text(desc, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PricingScreen(onBack: () -> Unit, onSubscribe: (String) -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Escolha seu Plano") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Voltar") }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text(
                    "Pare de perder vendas pelo WhatsApp. Automatize seu depósito.",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                Text(
                    "Selecione um plano abaixo e veja como o Despacha vai facilitar sua rotina e aumentar seus lucros.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
            }
            item {
                PricingCard(
                    title = "Plano Mensal (Pro)",
                    price = "R$ 49,90/mês",
                    description = "O poder total do sistema para depósitos em crescimento.",
                    features = listOf("Pedidos Ilimitados", "Personalização Total (Cores e Logo)", "Gestão Completa de Entregadores", "Suporte Prioritário"),
                    buttonText = "Assinar Mensal",
                    isFeatured = true,
                    onClick = { onSubscribe("PRO") }
                )
            }
            item {
                PricingCard(
                    title = "Plano Semestral",
                    price = "R$ 249,90/semestre",
                    description = "Economize ainda mais e foque nas vendas.",
                    features = listOf("Todas as vantagens do Mensal", "Sai por apenas R$ 41,65/mês", "Desconto de mais de 16%"),
                    buttonText = "Assinar Semestral",
                    isFeatured = false,
                    onClick = { onSubscribe("SEMIANNUAL") }
                )
            }
            item {
                PricingCard(
                    title = "Plano Anual",
                    price = "R$ 449,90/ano",
                    description = "A escolha dos grandes lojistas. Pague 1 vez, venda o ano todo.",
                    features = listOf("Todas as vantagens do Mensal", "Sai por apenas R$ 37,49/mês", "Desconto de 25%"),
                    buttonText = "Assinar Anual",
                    isFeatured = false,
                    onClick = { onSubscribe("ANNUAL") }
                )
            }
            item {
                PricingCard(
                    title = "Plano Free (Teste)",
                    price = "R$ 0 por 14 dias",
                    description = "Ideal para validar a solução.",
                    features = listOf("Teste a plataforma sem compromisso", "Limites de funções", "Exclusão dos dados após o teste"),
                    buttonText = "Começar Grátis",
                    isFeatured = false,
                    onClick = { onSubscribe("FREE") }
                )
            }
            item { Spacer(Modifier.height(80.dp)) } // Ensures correct scrolling past bottom bar/nav
        }
    }
}

@Composable
fun PricingCard(title: String, price: String, description: String, features: List<String>, buttonText: String, isFeatured: Boolean = false, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isFeatured) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface
        ),
        border = if (!isFeatured) CardDefaults.outlinedCardBorder() else null
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            if (isFeatured) {
                Badge(modifier = Modifier.padding(bottom = 8.dp), containerColor = MaterialTheme.colorScheme.primary) { Text("Recomendado") }
            }
            Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            Text(price, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.height(8.dp))
            Text(description, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(24.dp))
            
            features.forEach { feature ->
                Row(modifier = Modifier.padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.width(8.dp))
                    Text(feature, style = MaterialTheme.typography.bodyMedium)
                }
            }
            
            Spacer(Modifier.height(32.dp))
            Button(
                onClick = onClick,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isFeatured) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondary
                )
            ) {
                Text(buttonText)
            }
        }
    }
}

package com.example.ui

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.ui.admin.AdminScreensWrapper
import com.example.ui.auth.LoginScreen
import com.example.ui.auth.RegisterScreen
import com.example.ui.client.ClientFlow
import com.example.ui.delivery.DeliveryFlow
import com.example.ui.saas.LandingScreen
import com.example.ui.saas.PricingScreen
import com.example.ui.saas.StripeCheckoutScreen
import com.example.ui.saas.SuperAdminScreen

@Composable
fun LinkMenuApp(viewModel: AppViewModel) {
    val navController = rememberNavController()
    
    NavHost(navController = navController, startDestination = "landing") {
        composable("landing") {
            LandingScreen(
                onNavigateToPricing = { navController.navigate("pricing") },
                onNavigateToApp = { navController.navigate("appPortal") }
            )
        }
        composable("pricing") {
            PricingScreen(
                onBack = { navController.popBackStack() },
                onSubscribe = { plan -> 
                    if (plan == "FREE") {
                        navController.navigate("register") {
                            popUpTo("landing") { inclusive = false }
                        }
                    } else {
                        navController.navigate("stripeCheckout/$plan")
                    }
                }
            )
        }
        composable("stripeCheckout/{plan}") { backStackEntry ->
            val plan = backStackEntry.arguments?.getString("plan") ?: "PRO"
            StripeCheckoutScreen(
                planName = plan,
                onBack = { navController.popBackStack() },
                onPaymentSuccess = {
                    navController.navigate("register") {
                        popUpTo("landing") { inclusive = false }
                    }
                }
            )
        }
        composable("appPortal") {
            AppPortalScreen(
                onNavigateToClient = { navController.navigate("clientFlow") },
                onNavigateToLogin = { navController.navigate("login") }
            )
        }
        composable("login") {
            LoginScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onRegisterClick = { navController.navigate("onboarding") },
                onLoginSuccess = { loggedInRole ->
                    when (loggedInRole) {
                        "superAdmin" -> navController.navigate("superAdmin") { popUpTo("appPortal") { inclusive = true } }
                        "admin" -> navController.navigate("adminScreen") { popUpTo("appPortal") { inclusive = true } }
                        "delivery" -> navController.navigate("deliveryFlow") { popUpTo("appPortal") { inclusive = true } }
                    }
                }
            )
        }
        composable("onboarding") {
            com.example.ui.auth.OnboardingScreen(
                onNavigateToPlans = { navController.navigate("pricing") },
                onBack = { navController.popBackStack() }
            )
        }
        composable("register") {
            RegisterScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onRegisterSuccess = { 
                    // Assume registered standard user is admin
                    navController.navigate("adminScreen") { popUpTo("landing") { inclusive = false } }
                }
            )
        }
        composable("superAdmin") {
            SuperAdminScreen(viewModel = viewModel, onBack = { navController.popBackStack() })
        }
        composable("clientFlow") {
            ClientFlow(viewModel = viewModel, onBackToRoles = { navController.popBackStack() })
        }
        composable("adminScreen") {
            AdminScreensWrapper(viewModel = viewModel, onBackToRoles = { navController.popBackStack() })
        }
        composable("deliveryFlow") {
            DeliveryFlow(viewModel = viewModel, onBackToRoles = { navController.popBackStack() })
        }
    }
}


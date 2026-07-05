package com.example.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun DespachaLogoHorizontal(
    modifier: Modifier = Modifier,
    iconSize: Dp = 40.dp,
    textColor: Color = Color(0xFF0D1B3D), // Primary color
    showText: Boolean = true
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
    ) {
        DespachaIcon(modifier = Modifier.size(iconSize))
        if (showText) {
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Despacha",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontStyle = FontStyle.Italic,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = (-1.5).sp
                ),
                color = textColor
            )
        }
    }
}

@Composable
fun DespachaIcon(
    modifier: Modifier = Modifier,
    lightBlue: Color = Color(0xFF00B4FF),
    orange: Color = Color(0xFFFF8A00),
    darkBlue: Color = Color(0xFF0D1B3D)
) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        
        val sw = h * 0.16f // stroke width
        
        // Top light blue line
        val topY = h * 0.22f
        drawLine(
            color = lightBlue,
            start = Offset(w * 0.05f, topY),
            end = Offset(w * 0.35f, topY),
            strokeWidth = sw,
            cap = StrokeCap.Round
        )
        
        // Middle orange arrow
        val midY = h * 0.5f
        // Main arrow body
        drawLine(
            color = orange,
            start = Offset(w * 0.15f, midY),
            end = Offset(w * 0.55f, midY),
            strokeWidth = sw,
            cap = StrokeCap.Round
        )
        // Arrow head top
        drawLine(
            color = orange,
            start = Offset(w * 0.40f, midY - h * 0.16f),
            end = Offset(w * 0.57f, midY),
            strokeWidth = sw,
            cap = StrokeCap.Round // using round cap makes it look a bit smooth
        )
        // Arrow head bottom
        drawLine(
            color = orange,
            start = Offset(w * 0.40f, midY + h * 0.16f),
            end = Offset(w * 0.57f, midY),
            strokeWidth = sw,
            cap = StrokeCap.Round
        )
        
        // Bottom dark blue line
        val botY = h * 0.78f
        drawLine(
            color = darkBlue,
            start = Offset(w * 0.1f, botY),
            end = Offset(w * 0.45f, botY),
            strokeWidth = sw,
            cap = StrokeCap.Round
        )
        
        // The D curve (Dark Blue)
        val dPath = Path().apply {
            val startX = w * 0.45f
            val top = topY
            val bottom = botY
            
            moveTo(startX, top)
            lineTo(w * 0.6f, top)
            
            val rightRect = Rect(
                left = w * 0.25f,
                top = top,
                right = w - sw/2f,
                bottom = bottom
            )
            arcTo(rightRect, startAngleDegrees = -90f, sweepAngleDegrees = 180f, forceMoveTo = false)
            
            lineTo(startX, bottom)
        }
        
        drawPath(
            path = dPath,
            color = darkBlue,
            style = Stroke(width = sw, cap = StrokeCap.Round, join = StrokeJoin.Round)
        )
    }
}

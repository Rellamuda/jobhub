import 'dart:ui';
import 'package:flutter/material.dart';

class GlassCard extends StatelessWidget {
  final Widget child;
  final double blur;
  final double opacity;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;
  final BorderRadius? borderRadius;
  final Color? color;

  const GlassCard({
    Key? key,
    required this.child,
    this.blur = 10.0,
    this.opacity = 0.1,
    this.padding = const EdgeInsets.all(16.0),
    this.margin = const EdgeInsets.all(0),
    this.borderRadius,
    this.color,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final baseColor = color ?? (isDark ? Colors.white : Colors.black);

    return Container(
      margin: margin,
      child: ClipRRect(
        borderRadius: borderRadius ?? BorderRadius.circular(16.0),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            padding: padding,
            decoration: BoxDecoration(
              color: baseColor.withOpacity(opacity),
              borderRadius: borderRadius ?? BorderRadius.circular(16.0),
              border: Border.all(
                color: baseColor.withOpacity(opacity * 2),
                width: 1.0,
              ),
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}

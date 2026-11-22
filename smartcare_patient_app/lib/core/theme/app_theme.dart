import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand & Canvas Colors
  static const Color surface = Color(0xFFF9F9FF);
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  static const Color surfaceContainerLow = Color(0xFFF0F3FF);
  static const Color surfaceContainer = Color(0xFFE7EEFF);
  static const Color surfaceContainerHigh = Color(0xFFDEE8FF);
  static const Color surfaceContainerHighest = Color(0xFFD8E3FB);

  static const Color onSurface = Color(0xFF111C2D);
  static const Color onSurfaceVariant = Color(0xFF414754);
  static const Color outline = Color(0xFF727785);
  static const Color outlineVariant = Color(0xFFC1C6D6);

  static const Color primary = Color(0xFF1A73E8);
  static const Color primaryDark = Color(0xFF005BBF);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color primaryFixed = Color(0xFFD8E2FF);
  static const Color primaryFixedDim = Color(0xFFADC7FF);
  static const Color primaryContainer = Color(0xFFCCE5FF);
  static const Color onPrimaryContainer = Color(0xFF001D31);
  static const Color onPrimaryFixed = Color(0xFF001D31);
  static const Color onPrimaryFixedVariant = Color(0xFF004B73);

  static const Color secondary = Color(0xFF2B5BB5);
  static const Color secondaryContainer = Color(0xFF759EFD);

  static const Color tertiary = Color(0xFF006C49);
  static const Color tertiaryFixed = Color(0xFF6FFBBE);
  static const Color tertiaryFixedDim = Color(0xFF4EDEA3);
  static const Color tertiaryContainer = Color(0xFF00855B);
  static const Color onTertiaryContainer = Color(0xFFF5FFF6);
  static const Color onTertiaryFixed = Color(0xFF002113);
  static const Color onTertiaryFixedVariant = Color(0xFF005236);

  static const Color error = Color(0xFFEF4444);
  static const Color errorDark = Color(0xFFBA1A1A);
  static const Color errorContainer = Color(0xFFFFDAD6);
  static const Color onErrorContainer = Color(0xFF93000A);
  static const Color onError = Color(0xFFFFFFFF);

  // Semantic Status Tones
  static const Color statusAvailable = Color(0xFF10B981);
  static const Color statusAvailableBg = Color(0xFFECFDF5);
  static const Color statusAvailableBorder = Color(0xFFA7F3D0);
  static const Color statusAvailableText = Color(0xFF065F46);

  static const Color statusLimited = Color(0xFFF59E0B);
  static const Color statusLimitedBg = Color(0xFFFFFBEB);
  static const Color statusLimitedBorder = Color(0xFFFDE68A);
  static const Color statusLimitedText = Color(0xFF92400E);

  static const Color statusEmergency = Color(0xFFEF4444);
  static const Color statusEmergencyBg = Color(0xFFFEF2F2);
  static const Color statusEmergencyBorder = Color(0xFFFECACA);
  static const Color statusEmergencyText = Color(0xFF991B1B);

  // Level 1 Ambient Card Shadow
  static List<BoxShadow> get cardShadow => [
        const BoxShadow(
          color: Color.fromRGBO(30, 41, 59, 0.05),
          blurRadius: 3,
          offset: Offset(0, 1),
        ),
        const BoxShadow(
          color: Color.fromRGBO(30, 41, 59, 0.03),
          blurRadius: 2,
          offset: Offset(0, 1),
        ),
      ];

  // Level 2 Ambient Shadow
  static List<BoxShadow> get elevatedShadow => [
        const BoxShadow(
          color: Color.fromRGBO(30, 41, 59, 0.08),
          blurRadius: 6,
          offset: Offset(0, 4),
        ),
        const BoxShadow(
          color: Color.fromRGBO(30, 41, 59, 0.04),
          blurRadius: 4,
          offset: Offset(0, 2),
        ),
      ];

  static ThemeData get lightTheme {
    final baseTextTheme = GoogleFonts.interTextTheme();

    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: surface,
      colorScheme: const ColorScheme(
        brightness: Brightness.light,
        primary: primary,
        onPrimary: onPrimary,
        secondary: secondary,
        onSecondary: Colors.white,
        error: error,
        onError: onError,
        surface: surface,
        onSurface: onSurface,
        surfaceContainerLowest: surfaceContainerLowest,
        surfaceContainerLow: surfaceContainerLow,
        surfaceContainer: surfaceContainer,
        surfaceContainerHigh: surfaceContainerHigh,
        surfaceContainerHighest: surfaceContainerHighest,
        outline: outline,
        outlineVariant: outlineVariant,
      ),
      textTheme: baseTextTheme.copyWith(
        headlineLarge: GoogleFonts.inter(
          fontSize: 30,
          fontWeight: FontWeight.w700,
          color: onSurface,
          letterSpacing: -0.4,
        ),
        headlineMedium: GoogleFonts.inter(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: onSurface,
          letterSpacing: -0.3,
        ),
        headlineSmall: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: onSurface,
        ),
        titleLarge: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: onSurface,
        ),
        titleMedium: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: onSurface,
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          color: onSurface,
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: onSurfaceVariant,
        ),
        bodySmall: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w400,
          color: onSurfaceVariant,
        ),
        labelLarge: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: onSurface,
        ),
        labelMedium: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: onSurfaceVariant,
        ),
        labelSmall: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: onSurfaceVariant,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: surface,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        iconTheme: IconThemeData(color: onSurface),
      ),
      cardTheme: CardThemeData(
        color: surfaceContainerLowest,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceContainerLow,
        hintStyle: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: onSurfaceVariant,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: outlineVariant, width: 0.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: onPrimary,
          minimumSize: const Size(double.infinity, 48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          elevation: 0,
        ),
      ),
    );
  }
}

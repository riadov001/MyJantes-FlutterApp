import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppThemes {
  static const Color brandRed = Color(0xFFDC2626);
  static const Color brandBlack = Color(0xFF000000);
  static const Color brandGray = Color(0xFF6B7280);
  static const Color lightRed = Color(0xFFFEF2F2);

  static ThemeData lightTheme = ThemeData(
    primarySwatch: _createMaterialColor(brandRed),
    primaryColor: brandRed,
    scaffoldBackgroundColor: const Color(0xFFFAFAFA),
    
    textTheme: GoogleFonts.robotoTextTheme().copyWith(
      displayLarge: GoogleFonts.robotoCondensed(
        fontSize: 32,
        fontWeight: FontWeight.bold,
        color: brandBlack,
        letterSpacing: -0.5,
      ),
      displayMedium: GoogleFonts.robotoCondensed(
        fontSize: 28,
        fontWeight: FontWeight.bold,
        color: brandBlack,
        letterSpacing: -0.5,
      ),
      displaySmall: GoogleFonts.robotoCondensed(
        fontSize: 24,
        fontWeight: FontWeight.bold,
        color: brandBlack,
        letterSpacing: -0.5,
      ),
      headlineMedium: GoogleFonts.robotoCondensed(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: brandBlack,
        letterSpacing: -0.25,
      ),
      titleLarge: GoogleFonts.roboto(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: brandBlack,
      ),
      bodyLarge: GoogleFonts.roboto(
        fontSize: 16,
        color: brandGray,
      ),
      bodyMedium: GoogleFonts.roboto(
        fontSize: 14,
        color: brandGray,
      ),
    ),
    
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: brandBlack,
      elevation: 2,
      shadowColor: Colors.black12,
      titleTextStyle: GoogleFonts.robotoCondensed(
        fontSize: 20,
        fontWeight: FontWeight.bold,
        color: brandBlack,
        letterSpacing: -0.25,
      ),
    ),
    
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: brandRed,
        foregroundColor: Colors.white,
        textStyle: GoogleFonts.roboto(
          fontWeight: FontWeight.w600,
          fontSize: 16,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        elevation: 2,
      ),
    ),
    
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: brandRed,
        side: const BorderSide(color: brandRed),
        textStyle: GoogleFonts.roboto(
          fontWeight: FontWeight.w600,
          fontSize: 16,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    ),
    
    cardTheme: CardTheme(
      elevation: 4,
      shadowColor: Colors.black12,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    ),
    
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Colors.grey),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: brandRed, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      labelStyle: GoogleFonts.roboto(color: brandGray),
    ),
    
    colorScheme: ColorScheme.fromSeed(
      seedColor: brandRed,
      brightness: Brightness.light,
    ).copyWith(
      primary: brandRed,
      secondary: brandGray,
      surface: Colors.white,
    ),
  );

  static MaterialColor _createMaterialColor(Color color) {
    List strengths = <double>[.05];
    final swatch = <int, Color>{};
    final int r = color.red, g = color.green, b = color.blue;

    for (int i = 1; i < 10; i++) {
      strengths.add(0.1 * i);
    }
    for (var strength in strengths) {
      final double ds = 0.5 - strength;
      swatch[(strength * 1000).round()] = Color.fromRGBO(
        r + ((ds < 0 ? r : (255 - r)) * ds).round(),
        g + ((ds < 0 ? g : (255 - g)) * ds).round(),
        b + ((ds < 0 ? b : (255 - b)) * ds).round(),
        1,
      );
    }
    return MaterialColor(color.value, swatch);
  }
}
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/booking.dart';
import '../models/service.dart';
import '../models/quote.dart';

class ApiService {
  // Change this URL to your WordPress backend URL
  static const String baseUrl = 'https://votre-domaine-hostinger.com/wp-json/myjantes/v1';
  
  final Map<String, String> _headers = {
    'Content-Type': 'application/json',
  };

  // Services API
  Future<List<Service>> getServices() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/services'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((item) => Service.fromJson(item)).toList();
      } else {
        throw Exception('Failed to load services: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Bookings API
  Future<Map<String, dynamic>> createBooking(Booking booking) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/bookings'),
        headers: _headers,
        body: json.encode(booking.toJson()),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final error = json.decode(response.body);
        throw Exception(error['message'] ?? 'Failed to create booking');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<List<Booking>> getBookings({String? token}) async {
    try {
      final headers = Map<String, String>.from(_headers);
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await http.get(
        Uri.parse('$baseUrl/bookings'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((item) => Booking.fromJson(item)).toList();
      } else {
        throw Exception('Failed to load bookings: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Quotes API
  Future<Map<String, dynamic>> createQuote(Quote quote) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/quotes'),
        headers: _headers,
        body: json.encode(quote.toJson()),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final error = json.decode(response.body);
        throw Exception(error['message'] ?? 'Failed to create quote');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<List<Quote>> getQuotes({String? token}) async {
    try {
      final headers = Map<String, String>.from(_headers);
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await http.get(
        Uri.parse('$baseUrl/quotes'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((item) => Quote.fromJson(item)).toList();
      } else {
        throw Exception('Failed to load quotes: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Authentication API
  Future<Map<String, dynamic>> authenticate(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth'),
        headers: _headers,
        body: json.encode({
          'username': username,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final error = json.decode(response.body);
        throw Exception(error['message'] ?? 'Authentication failed');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}
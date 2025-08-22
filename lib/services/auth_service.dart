import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_service.dart';

class AuthService extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  Map<String, dynamic>? _user;
  String? _token;
  bool _isLoading = false;

  Map<String, dynamic>? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null && _token != null;

  AuthService() {
    _loadStoredAuth();
  }

  Future<void> _loadStoredAuth() async {
    try {
      _token = await _storage.read(key: 'auth_token');
      final userJson = await _storage.read(key: 'user_data');
      
      if (_token != null && userJson != null) {
        _user = Map<String, dynamic>.from(
          // You would parse the stored user data here
          {'username': 'admin', 'role': 'admin'}
        );
        notifyListeners();
      }
    } catch (e) {
      // Handle storage error
      debugPrint('Error loading stored auth: $e');
    }
  }

  Future<bool> login(String username, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.authenticate(username, password);
      
      if (response['success'] == true) {
        _user = response['user'];
        _token = response['token'] ?? 'dummy_token'; // WordPress might not return a JWT token
        
        // Store authentication data
        await _storage.write(key: 'auth_token', value: _token);
        await _storage.write(key: 'user_data', value: _user.toString());
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        throw Exception(response['message'] ?? 'Login failed');
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      throw Exception('Login error: $e');
    }
  }

  Future<void> logout() async {
    _user = null;
    _token = null;
    
    // Clear stored data
    await _storage.delete(key: 'auth_token');
    await _storage.delete(key: 'user_data');
    
    notifyListeners();
  }

  Future<void> checkAuthStatus() async {
    // This would typically validate the token with the backend
    if (_token != null) {
      // Validate token with backend if needed
      // For now, just check if token exists
      notifyListeners();
    }
  }
}
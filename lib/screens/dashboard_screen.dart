import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../models/booking.dart';
import '../models/quote.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ApiService _apiService = ApiService();
  
  List<Booking> _bookings = [];
  List<Quote> _quotes = [];
  bool _isLoadingBookings = true;
  bool _isLoadingQuotes = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final authService = Provider.of<AuthService>(context, listen: false);
    
    if (!authService.isAuthenticated) {
      context.go('/login');
      return;
    }

    try {
      final bookings = await _apiService.getBookings(token: authService.token);
      setState(() {
        _bookings = bookings;
        _isLoadingBookings = false;
      });
    } catch (e) {
      setState(() {
        _isLoadingBookings = false;
      });
    }

    try {
      final quotes = await _apiService.getQuotes(token: authService.token);
      setState(() {
        _quotes = quotes;
        _isLoadingQuotes = false;
      });
    } catch (e) {
      setState(() {
        _isLoadingQuotes = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tableau de bord'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Réservations', icon: Icon(Icons.calendar_today)),
            Tab(text: 'Devis', icon: Icon(Icons.request_quote)),
          ],
        ),
        actions: [
          Consumer<AuthService>(
            builder: (context, authService, child) {
              return PopupMenuButton<String>(
                onSelected: (String choice) {
                  if (choice == 'logout') {
                    authService.logout();
                    context.go('/');
                  }
                },
                itemBuilder: (BuildContext context) {
                  return [
                    PopupMenuItem<String>(
                      value: 'logout',
                      child: Row(
                        children: [
                          const Icon(Icons.logout),
                          const SizedBox(width: 8),
                          Text('Déconnexion (${authService.user?['username'] ?? 'Admin'})'),
                        ],
                      ),
                    ),
                  ];
                },
              );
            },
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildBookingsTab(),
          _buildQuotesTab(),
        ],
      ),
    );
  }

  Widget _buildBookingsTab() {
    if (_isLoadingBookings) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_bookings.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.calendar_today, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('Aucune réservation', style: TextStyle(fontSize: 18, color: Colors.grey)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        itemCount: _bookings.length,
        itemBuilder: (context, index) {
          final booking = _bookings[index];
          return Card(
            margin: const EdgeInsets.all(8),
            child: ListTile(
              title: Text('${booking.customerName} - ${booking.vehicleBrand} ${booking.vehicleModel}'),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Date: ${booking.date.day}/${booking.date.month}/${booking.date.year} à ${booking.timeSlot}'),
                  Text('Téléphone: ${booking.customerPhone}'),
                  Text('Email: ${booking.customerEmail}'),
                  if (booking.comments != null && booking.comments!.isNotEmpty)
                    Text('Commentaires: ${booking.comments}'),
                ],
              ),
              trailing: Chip(
                label: Text(booking.status),
                backgroundColor: _getStatusColor(booking.status),
              ),
              isThreeLine: true,
            ),
          );
        },
      ),
    );
  }

  Widget _buildQuotesTab() {
    if (_isLoadingQuotes) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_quotes.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.request_quote, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('Aucune demande de devis', style: TextStyle(fontSize: 18, color: Colors.grey)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        itemCount: _quotes.length,
        itemBuilder: (context, index) {
          final quote = _quotes[index];
          return Card(
            margin: const EdgeInsets.all(8),
            child: ExpansionTile(
              title: Text('${quote.customerName} - ${quote.vehicleBrand} ${quote.vehicleModel}'),
              subtitle: Text('Services: ${quote.services.join(', ')}'),
              trailing: Chip(
                label: Text(quote.status),
                backgroundColor: _getStatusColor(quote.status),
              ),
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildQuoteDetail('Téléphone', quote.customerPhone),
                      _buildQuoteDetail('Email', quote.customerEmail),
                      _buildQuoteDetail('Code postal', quote.customerPostalCode),
                      _buildQuoteDetail('État des jantes', quote.wheelCondition),
                      _buildQuoteDetail('Taille des jantes', quote.wheelSize),
                      _buildQuoteDetail('Année du véhicule', quote.vehicleYear),
                      if (quote.amount != null)
                        _buildQuoteDetail('Montant', quote.formattedAmount),
                      if (quote.imageUrls.isNotEmpty)
                        _buildQuoteDetail('Photos', '${quote.imageUrls.length} image(s)'),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildQuoteDetail(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            child: Text(value),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.orange.shade100;
      case 'confirmed':
      case 'accepted':
        return Colors.green.shade100;
      case 'cancelled':
      case 'rejected':
        return Colors.red.shade100;
      case 'completed':
        return Colors.blue.shade100;
      default:
        return Colors.grey.shade100;
    }
  }
}
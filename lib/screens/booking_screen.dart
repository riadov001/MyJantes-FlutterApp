import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/booking.dart';
import '../models/service.dart';
import '../services/api_service.dart';
import '../utils/themes.dart';

class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _apiService = ApiService();
  
  List<Service> _services = [];
  bool _isLoading = true;
  bool _isSubmitting = false;
  
  // Form controllers
  String? _selectedServiceId;
  DateTime? _selectedDate;
  String? _selectedTimeSlot;
  int _wheelCount = 4;
  
  final _vehicleBrandController = TextEditingController();
  final _vehicleModelController = TextEditingController();
  final _vehicleYearController = TextEditingController();
  final _customerNameController = TextEditingController();
  final _customerEmailController = TextEditingController();
  final _customerPhoneController = TextEditingController();
  final _customerPostalCodeController = TextEditingController();
  final _commentsController = TextEditingController();

  final List<String> _timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  @override
  void dispose() {
    _vehicleBrandController.dispose();
    _vehicleModelController.dispose();
    _vehicleYearController.dispose();
    _customerNameController.dispose();
    _customerEmailController.dispose();
    _customerPhoneController.dispose();
    _customerPostalCodeController.dispose();
    _commentsController.dispose();
    super.dispose();
  }

  Future<void> _loadServices() async {
    try {
      final services = await _apiService.getServices();
      setState(() {
        _services = services;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    }
  }

  Future<void> _submitBooking() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedServiceId == null || _selectedDate == null || _selectedTimeSlot == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez remplir tous les champs obligatoires')),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final booking = Booking(
        id: '',
        serviceId: _selectedServiceId!,
        date: _selectedDate!,
        timeSlot: _selectedTimeSlot!,
        wheelCount: _wheelCount,
        vehicleBrand: _vehicleBrandController.text,
        vehicleModel: _vehicleModelController.text,
        vehicleYear: _vehicleYearController.text,
        customerName: _customerNameController.text,
        customerEmail: _customerEmailController.text,
        customerPhone: _customerPhoneController.text,
        customerPostalCode: _customerPostalCodeController.text,
        comments: _commentsController.text.isEmpty ? null : _commentsController.text,
        status: 'pending',
      );

      final result = await _apiService.createBooking(booking);
      
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Réservation confirmée'),
            content: Text(result['message'] ?? 'Votre réservation a été enregistrée avec succès.'),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  context.go('/');
                },
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Réservation'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/'),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Réserver votre service',
                      style: Theme.of(context).textTheme.displaySmall,
                    ),
                    const SizedBox(height: 24),
                    
                    _buildServiceSelection(),
                    const SizedBox(height: 24),
                    
                    _buildDateTimeSelection(),
                    const SizedBox(height: 24),
                    
                    _buildVehicleInfo(),
                    const SizedBox(height: 24),
                    
                    _buildCustomerInfo(),
                    const SizedBox(height: 24),
                    
                    _buildCommentsSection(),
                    const SizedBox(height: 32),
                    
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _submitBooking,
                        child: _isSubmitting
                            ? const CircularProgressIndicator(color: Colors.white)
                            : const Text('Confirmer la réservation'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildServiceSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Service *', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: _selectedServiceId,
          decoration: const InputDecoration(
            hintText: 'Sélectionnez un service',
            border: OutlineInputBorder(),
          ),
          validator: (value) => value == null ? 'Veuillez sélectionner un service' : null,
          items: _services.map((service) {
            return DropdownMenuItem<String>(
              value: service.id,
              child: Text('${service.name} - ${service.formattedPrice}'),
            );
          }).toList(),
          onChanged: (value) {
            setState(() {
              _selectedServiceId = value;
            });
          },
        ),
        const SizedBox(height: 16),
        
        Text('Nombre de jantes', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        Row(
          children: List.generate(6, (index) {
            final count = index + 1;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: ChoiceChip(
                  label: Text('$count'),
                  selected: _wheelCount == count,
                  onSelected: (selected) {
                    if (selected) {
                      setState(() {
                        _wheelCount = count;
                      });
                    }
                  },
                ),
              ),
            );
          }),
        ),
      ],
    );
  }

  Widget _buildDateTimeSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Date et heure *', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        
        InkWell(
          onTap: () async {
            final date = await showDatePicker(
              context: context,
              initialDate: DateTime.now().add(const Duration(days: 1)),
              firstDate: DateTime.now(),
              lastDate: DateTime.now().add(const Duration(days: 90)),
            );
            if (date != null) {
              setState(() {
                _selectedDate = date;
              });
            }
          },
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_today),
                const SizedBox(width: 12),
                Text(_selectedDate != null 
                    ? '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}'
                    : 'Sélectionner une date'
                ),
              ],
            ),
          ),
        ),
        
        if (_selectedDate != null) ...[
          const SizedBox(height: 16),
          Text('Créneau horaire *', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _timeSlots.map((slot) {
              return ChoiceChip(
                label: Text(slot),
                selected: _selectedTimeSlot == slot,
                onSelected: (selected) {
                  if (selected) {
                    setState(() {
                      _selectedTimeSlot = slot;
                    });
                  }
                },
              );
            }).toList(),
          ),
        ],
      ],
    );
  }

  Widget _buildVehicleInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Informations véhicule *', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 16),
        
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: _vehicleBrandController,
                decoration: const InputDecoration(
                  labelText: 'Marque',
                  hintText: 'ex: Peugeot',
                ),
                validator: (value) => value?.isEmpty == true ? 'Champ requis' : null,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: TextFormField(
                controller: _vehicleModelController,
                decoration: const InputDecoration(
                  labelText: 'Modèle',
                  hintText: 'ex: 308',
                ),
                validator: (value) => value?.isEmpty == true ? 'Champ requis' : null,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        
        TextFormField(
          controller: _vehicleYearController,
          decoration: const InputDecoration(
            labelText: 'Année',
            hintText: 'ex: 2020',
          ),
          keyboardType: TextInputType.number,
          validator: (value) => value?.isEmpty == true ? 'Champ requis' : null,
        ),
      ],
    );
  }

  Widget _buildCustomerInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Vos coordonnées *', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 16),
        
        TextFormField(
          controller: _customerNameController,
          decoration: const InputDecoration(
            labelText: 'Nom complet',
            prefixIcon: Icon(Icons.person),
          ),
          validator: (value) => value?.isEmpty == true ? 'Champ requis' : null,
        ),
        const SizedBox(height: 16),
        
        TextFormField(
          controller: _customerEmailController,
          decoration: const InputDecoration(
            labelText: 'Email',
            prefixIcon: Icon(Icons.email),
          ),
          keyboardType: TextInputType.emailAddress,
          validator: (value) {
            if (value?.isEmpty == true) return 'Champ requis';
            if (!value!.contains('@')) return 'Email invalide';
            return null;
          },
        ),
        const SizedBox(height: 16),
        
        Row(
          children: [
            Expanded(
              flex: 2,
              child: TextFormField(
                controller: _customerPhoneController,
                decoration: const InputDecoration(
                  labelText: 'Téléphone',
                  prefixIcon: Icon(Icons.phone),
                ),
                keyboardType: TextInputType.phone,
                validator: (value) => value?.isEmpty == true ? 'Champ requis' : null,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: TextFormField(
                controller: _customerPostalCodeController,
                decoration: const InputDecoration(
                  labelText: 'Code postal',
                  prefixIcon: Icon(Icons.location_on),
                ),
                keyboardType: TextInputType.number,
                validator: (value) => value?.isEmpty == true ? 'Champ requis' : null,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCommentsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Commentaires', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        TextFormField(
          controller: _commentsController,
          decoration: const InputDecoration(
            hintText: 'Informations supplémentaires...',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
        ),
      ],
    );
  }
}
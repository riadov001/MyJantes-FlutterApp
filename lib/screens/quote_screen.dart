import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../models/quote.dart';
import '../services/api_service.dart';

class QuoteScreen extends StatefulWidget {
  const QuoteScreen({super.key});

  @override
  State<QuoteScreen> createState() => _QuoteScreenState();
}

class _QuoteScreenState extends State<QuoteScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _apiService = ApiService();
  final ImagePicker _picker = ImagePicker();
  
  bool _isSubmitting = false;
  List<String> _selectedServices = [];
  List<XFile> _selectedImages = [];
  
  final _wheelConditionController = TextEditingController();
  final _vehicleBrandController = TextEditingController();
  final _vehicleModelController = TextEditingController();
  final _vehicleYearController = TextEditingController();
  final _wheelSizeController = TextEditingController();
  final _customerNameController = TextEditingController();
  final _customerEmailController = TextEditingController();
  final _customerPhoneController = TextEditingController();
  final _customerPostalCodeController = TextEditingController();

  final List<String> _availableServices = [
    'Rénovation',
    'Personnalisation',
    'Dévoilage',
    'Décapage',
  ];

  final List<String> _wheelConditions = [
    'Excellent état',
    'Bon état',
    'Rayures légères',
    'Rayures importantes',
    'Oxydation',
    'Déformation',
  ];

  @override
  void dispose() {
    _wheelConditionController.dispose();
    _vehicleBrandController.dispose();
    _vehicleModelController.dispose();
    _vehicleYearController.dispose();
    _wheelSizeController.dispose();
    _customerNameController.dispose();
    _customerEmailController.dispose();
    _customerPhoneController.dispose();
    _customerPostalCodeController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final List<XFile> images = await _picker.pickMultiImage();
    if (images.isNotEmpty) {
      setState(() {
        _selectedImages = images.take(5).toList(); // Limit to 5 images
      });
    }
  }

  Future<void> _submitQuote() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedServices.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez sélectionner au moins un service')),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      // In a real app, you would upload images to server and get URLs
      final imageUrls = _selectedImages.map((image) => image.path).toList();
      
      final quote = Quote(
        id: '',
        services: _selectedServices,
        wheelCondition: _wheelConditionController.text,
        vehicleBrand: _vehicleBrandController.text,
        vehicleModel: _vehicleModelController.text,
        vehicleYear: _vehicleYearController.text,
        wheelSize: _wheelSizeController.text,
        customerName: _customerNameController.text,
        customerEmail: _customerEmailController.text,
        customerPhone: _customerPhoneController.text,
        customerPostalCode: _customerPostalCodeController.text,
        imageUrls: imageUrls,
        status: 'pending',
        createdAt: DateTime.now(),
      );

      final result = await _apiService.createQuote(quote);
      
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Demande de devis envoyée'),
            content: Text(result['message'] ?? 'Votre demande de devis a été envoyée avec succès. Nous vous contacterons rapidement.'),
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
        title: const Text('Demande de Devis'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/'),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Demander un devis gratuit',
                style: Theme.of(context).textTheme.displaySmall,
              ),
              const SizedBox(height: 8),
              Text(
                'Remplissez ce formulaire pour recevoir un devis personnalisé',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 24),
              
              _buildServicesSelection(),
              const SizedBox(height: 24),
              
              _buildWheelCondition(),
              const SizedBox(height: 24),
              
              _buildVehicleInfo(),
              const SizedBox(height: 24),
              
              _buildWheelSize(),
              const SizedBox(height: 24),
              
              _buildCustomerInfo(),
              const SizedBox(height: 24),
              
              _buildImageUpload(),
              const SizedBox(height: 32),
              
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitQuote,
                  child: _isSubmitting
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Envoyer la demande de devis'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildServicesSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Services souhaités *', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _availableServices.map((service) {
            return FilterChip(
              label: Text(service),
              selected: _selectedServices.contains(service),
              onSelected: (selected) {
                setState(() {
                  if (selected) {
                    _selectedServices.add(service);
                  } else {
                    _selectedServices.remove(service);
                  }
                });
              },
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildWheelCondition() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('État des jantes *', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: _wheelConditionController.text.isEmpty ? null : _wheelConditionController.text,
          decoration: const InputDecoration(
            hintText: 'Sélectionnez l\'état de vos jantes',
            border: OutlineInputBorder(),
          ),
          validator: (value) => value == null ? 'Veuillez sélectionner l\'état' : null,
          items: _wheelConditions.map((condition) {
            return DropdownMenuItem<String>(
              value: condition,
              child: Text(condition),
            );
          }).toList(),
          onChanged: (value) {
            _wheelConditionController.text = value ?? '';
          },
        ),
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
                  hintText: 'ex: BMW',
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
                  hintText: 'ex: Série 3',
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
            hintText: 'ex: 2019',
          ),
          keyboardType: TextInputType.number,
          validator: (value) => value?.isEmpty == true ? 'Champ requis' : null,
        ),
      ],
    );
  }

  Widget _buildWheelSize() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Dimension des jantes *', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        TextFormField(
          controller: _wheelSizeController,
          decoration: const InputDecoration(
            labelText: 'Dimension',
            hintText: 'ex: 17 pouces ou 225/45 R17',
            border: OutlineInputBorder(),
          ),
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

  Widget _buildImageUpload() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Photos des jantes', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        Text(
          'Ajoutez des photos pour un devis plus précis (optionnel)',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 16),
        
        Container(
          width: double.infinity,
          height: 120,
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey, style: BorderStyle.solid),
            borderRadius: BorderRadius.circular(8),
          ),
          child: InkWell(
            onTap: _pickImages,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.add_a_photo, size: 48, color: Colors.grey),
                const SizedBox(height: 8),
                Text(
                  _selectedImages.isEmpty 
                      ? 'Ajouter des photos' 
                      : '${_selectedImages.length} photo(s) sélectionnée(s)',
                  style: const TextStyle(color: Colors.grey),
                ),
              ],
            ),
          ),
        ),
        
        if (_selectedImages.isNotEmpty) ...[
          const SizedBox(height: 16),
          SizedBox(
            height: 80,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _selectedImages.length,
              itemBuilder: (context, index) {
                return Container(
                  width: 80,
                  height: 80,
                  margin: const EdgeInsets.only(right: 8),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey),
                  ),
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: const Icon(Icons.image, size: 40),
                      ),
                      Positioned(
                        right: -4,
                        top: -4,
                        child: IconButton(
                          icon: const Icon(Icons.close, size: 16),
                          onPressed: () {
                            setState(() {
                              _selectedImages.removeAt(index);
                            });
                          },
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ],
    );
  }
}
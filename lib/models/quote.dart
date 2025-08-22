class Quote {
  final String id;
  final List<String> services;
  final String wheelCondition;
  final String vehicleBrand;
  final String vehicleModel;
  final String vehicleYear;
  final String wheelSize;
  final String customerName;
  final String customerEmail;
  final String customerPhone;
  final String customerPostalCode;
  final List<String> imageUrls;
  final double? amount;
  final String status;
  final DateTime createdAt;

  Quote({
    required this.id,
    required this.services,
    required this.wheelCondition,
    required this.vehicleBrand,
    required this.vehicleModel,
    required this.vehicleYear,
    required this.wheelSize,
    required this.customerName,
    required this.customerEmail,
    required this.customerPhone,
    required this.customerPostalCode,
    required this.imageUrls,
    this.amount,
    required this.status,
    required this.createdAt,
  });

  factory Quote.fromJson(Map<String, dynamic> json) {
    return Quote(
      id: json['id'].toString(),
      services: List<String>.from(json['services'] ?? []),
      wheelCondition: json['wheelCondition'] ?? json['wheel_condition'] ?? '',
      vehicleBrand: json['vehicleBrand'] ?? json['vehicle_brand'] ?? '',
      vehicleModel: json['vehicleModel'] ?? json['vehicle_model'] ?? '',
      vehicleYear: json['vehicleYear'] ?? json['vehicle_year'] ?? '',
      wheelSize: json['wheelSize'] ?? json['wheel_size'] ?? '',
      customerName: json['customerName'] ?? json['customer_name'] ?? '',
      customerEmail: json['customerEmail'] ?? json['customer_email'] ?? '',
      customerPhone: json['customerPhone'] ?? json['customer_phone'] ?? '',
      customerPostalCode: json['customerPostalCode'] ?? json['customer_postal_code'] ?? '',
      imageUrls: List<String>.from(json['imageUrls'] ?? json['image_urls'] ?? []),
      amount: json['amount'] != null ? double.tryParse(json['amount'].toString()) : null,
      status: json['status'] ?? 'pending',
      createdAt: DateTime.parse(json['createdAt'] ?? json['created_at'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'services': services,
      'wheelCondition': wheelCondition,
      'vehicleBrand': vehicleBrand,
      'vehicleModel': vehicleModel,
      'vehicleYear': vehicleYear,
      'wheelSize': wheelSize,
      'customerName': customerName,
      'customerEmail': customerEmail,
      'customerPhone': customerPhone,
      'customerPostalCode': customerPostalCode,
      'imageUrls': imageUrls,
    };
  }

  String get formattedAmount => amount != null ? '${amount!.toStringAsFixed(0)}€' : 'En attente';
}
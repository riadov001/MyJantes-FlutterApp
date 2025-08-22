class Booking {
  final String id;
  final String serviceId;
  final DateTime date;
  final String timeSlot;
  final int wheelCount;
  final String vehicleBrand;
  final String vehicleModel;
  final String vehicleYear;
  final String customerName;
  final String customerEmail;
  final String customerPhone;
  final String customerPostalCode;
  final String? comments;
  final String status;

  Booking({
    required this.id,
    required this.serviceId,
    required this.date,
    required this.timeSlot,
    required this.wheelCount,
    required this.vehicleBrand,
    required this.vehicleModel,
    required this.vehicleYear,
    required this.customerName,
    required this.customerEmail,
    required this.customerPhone,
    required this.customerPostalCode,
    this.comments,
    required this.status,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'] ?? '',
      serviceId: json['serviceId'] ?? json['service_id'] ?? '',
      date: DateTime.parse(json['date'] ?? json['booking_date']),
      timeSlot: json['timeSlot'] ?? json['time_slot'] ?? '',
      wheelCount: json['wheelCount'] ?? json['wheel_count'] ?? 0,
      vehicleBrand: json['vehicleBrand'] ?? json['vehicle_brand'] ?? '',
      vehicleModel: json['vehicleModel'] ?? json['vehicle_model'] ?? '',
      vehicleYear: json['vehicleYear'] ?? json['vehicle_year'] ?? '',
      customerName: json['customerName'] ?? json['customer_name'] ?? '',
      customerEmail: json['customerEmail'] ?? json['customer_email'] ?? '',
      customerPhone: json['customerPhone'] ?? json['customer_phone'] ?? '',
      customerPostalCode: json['customerPostalCode'] ?? json['customer_postal_code'] ?? '',
      comments: json['comments'],
      status: json['status'] ?? 'pending',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'serviceId': serviceId,
      'date': date.toIso8601String().split('T')[0],
      'timeSlot': timeSlot,
      'wheelCount': wheelCount,
      'vehicleBrand': vehicleBrand,
      'vehicleModel': vehicleModel,
      'vehicleYear': vehicleYear,
      'customerName': customerName,
      'customerEmail': customerEmail,
      'customerPhone': customerPhone,
      'customerPostalCode': customerPostalCode,
      'comments': comments,
    };
  }
}
class Service {
  final String id;
  final String name;
  final String description;
  final double price;
  final int duration;
  final String? imageUrl;
  final bool isActive;

  Service({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.duration,
    this.imageUrl,
    this.isActive = true,
  });

  factory Service.fromJson(Map<String, dynamic> json) {
    return Service(
      id: json['id'].toString(),
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      price: double.tryParse(json['price'].toString()) ?? 0.0,
      duration: int.tryParse(json['duration'].toString()) ?? 0,
      imageUrl: json['imageUrl'] ?? json['image_url'],
      isActive: json['isActive'] ?? json['is_active'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'duration': duration,
      'imageUrl': imageUrl,
      'isActive': isActive,
    };
  }

  String get formattedPrice => '${price.toStringAsFixed(0)}€';
  String get formattedDuration => '${duration}min';
}
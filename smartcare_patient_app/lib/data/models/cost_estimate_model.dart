class CostEstimateItemResultModel {
  final int serviceId;
  final String serviceName;
  final String category;
  final String billingUnit;
  final double unitPrice;
  final double quantity;
  final double itemTotal;

  CostEstimateItemResultModel({
    required this.serviceId,
    required this.serviceName,
    required this.category,
    required this.billingUnit,
    required this.unitPrice,
    required this.quantity,
    required this.itemTotal,
  });

  factory CostEstimateItemResultModel.fromJson(Map<String, dynamic> json) {
    return CostEstimateItemResultModel(
      serviceId: json['service_id'] is int
          ? json['service_id']
          : int.tryParse(json['service_id'].toString()) ?? 0,
      serviceName: json['service_name'] as String? ?? '',
      category: json['category'] as String? ?? 'General',
      billingUnit: json['billing_unit'] as String? ?? 'per day',
      unitPrice: json['unit_price'] is num
          ? (json['unit_price'] as num).toDouble()
          : double.tryParse(json['unit_price'].toString()) ?? 0.0,
      quantity: json['quantity'] is num
          ? (json['quantity'] as num).toDouble()
          : double.tryParse(json['quantity'].toString()) ?? 1.0,
      itemTotal: json['item_total'] is num
          ? (json['item_total'] as num).toDouble()
          : double.tryParse(json['item_total'].toString()) ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'service_id': serviceId,
      'service_name': serviceName,
      'category': category,
      'billing_unit': billingUnit,
      'unit_price': unitPrice,
      'quantity': quantity,
      'item_total': itemTotal,
    };
  }
}

class CostEstimateResponseModel {
  final int hospitalId;
  final String hospitalName;
  final List<CostEstimateItemResultModel> items;
  final double subtotal;
  final double taxAmount;
  final double discountAmount;
  final double estimatedTotal;
  final DateTime generatedAt;
  final String disclaimer;

  CostEstimateResponseModel({
    required this.hospitalId,
    required this.hospitalName,
    required this.items,
    required this.subtotal,
    required this.taxAmount,
    required this.discountAmount,
    required this.estimatedTotal,
    required this.generatedAt,
    required this.disclaimer,
  });

  factory CostEstimateResponseModel.fromJson(Map<String, dynamic> json) {
    return CostEstimateResponseModel(
      hospitalId: json['hospital_id'] is int
          ? json['hospital_id']
          : int.tryParse(json['hospital_id'].toString()) ?? 0,
      hospitalName: json['hospital_name'] as String? ?? 'Hospital',
      items: (json['items'] as List<dynamic>? ?? [])
          .map((item) =>
              CostEstimateItemResultModel.fromJson(item as Map<String, dynamic>))
          .toList(),
      subtotal: json['subtotal'] is num
          ? (json['subtotal'] as num).toDouble()
          : double.tryParse(json['subtotal'].toString()) ?? 0.0,
      taxAmount: json['tax_amount'] is num
          ? (json['tax_amount'] as num).toDouble()
          : double.tryParse(json['tax_amount'].toString()) ?? 0.0,
      discountAmount: json['discount_amount'] is num
          ? (json['discount_amount'] as num).toDouble()
          : double.tryParse(json['discount_amount'].toString()) ?? 0.0,
      estimatedTotal: json['estimated_total'] is num
          ? (json['estimated_total'] as num).toDouble()
          : double.tryParse(json['estimated_total'].toString()) ?? 0.0,
      generatedAt: json['generated_at'] != null
          ? DateTime.tryParse(json['generated_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      disclaimer: json['disclaimer'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'hospital_id': hospitalId,
      'hospital_name': hospitalName,
      'items': items.map((i) => i.toJson()).toList(),
      'subtotal': subtotal,
      'tax_amount': taxAmount,
      'discount_amount': discountAmount,
      'estimated_total': estimatedTotal,
      'generated_at': generatedAt.toIso8601String(),
      'disclaimer': disclaimer,
    };
  }
}

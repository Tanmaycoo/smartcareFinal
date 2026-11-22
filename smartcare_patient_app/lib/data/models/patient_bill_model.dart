class BillItemModel {
  final int id;
  final int billId;
  final int? serviceId;
  final String serviceName;
  final String? category;
  final double quantity;
  final double unitPrice;
  final double totalPrice;
  final String? notes;

  BillItemModel({
    required this.id,
    required this.billId,
    this.serviceId,
    required this.serviceName,
    this.category,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    this.notes,
  });

  factory BillItemModel.fromJson(Map<String, dynamic> json) {
    return BillItemModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      billId: json['bill_id'] is int
          ? json['bill_id']
          : int.tryParse(json['bill_id'].toString()) ?? 0,
      serviceId: json['service_id'] as int?,
      serviceName: json['service_name'] as String? ?? 'Service',
      category: json['category'] as String?,
      quantity: json['quantity'] is num
          ? (json['quantity'] as num).toDouble()
          : double.tryParse(json['quantity'].toString()) ?? 1.0,
      unitPrice: json['unit_price'] is num
          ? (json['unit_price'] as num).toDouble()
          : double.tryParse(json['unit_price'].toString()) ?? 0.0,
      totalPrice: json['total_price'] is num
          ? (json['total_price'] as num).toDouble()
          : double.tryParse(json['total_price'].toString()) ?? 0.0,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bill_id': billId,
      'service_id': serviceId,
      'service_name': serviceName,
      'category': category,
      'quantity': quantity,
      'unit_price': unitPrice,
      'total_price': totalPrice,
      'notes': notes,
    };
  }
}

class PaymentReceiptModel {
  final int id;
  final String receiptNumber;
  final int billId;
  final double amount;
  final String paymentMethod;
  final String? transactionReference;
  final DateTime paymentDate;
  final String? receivedBy;
  final String? notes;

  PaymentReceiptModel({
    required this.id,
    required this.receiptNumber,
    required this.billId,
    required this.amount,
    required this.paymentMethod,
    this.transactionReference,
    required this.paymentDate,
    this.receivedBy,
    this.notes,
  });

  factory PaymentReceiptModel.fromJson(Map<String, dynamic> json) {
    return PaymentReceiptModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      receiptNumber: json['receipt_number'] as String? ?? '',
      billId: json['bill_id'] is int
          ? json['bill_id']
          : int.tryParse(json['bill_id'].toString()) ?? 0,
      amount: json['amount'] is num
          ? (json['amount'] as num).toDouble()
          : double.tryParse(json['amount'].toString()) ?? 0.0,
      paymentMethod: json['payment_method'] as String? ?? 'CASH',
      transactionReference: json['transaction_reference'] as String?,
      paymentDate: json['payment_date'] != null
          ? DateTime.tryParse(json['payment_date'].toString()) ?? DateTime.now()
          : DateTime.now(),
      receivedBy: json['received_by'] as String?,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'receipt_number': receiptNumber,
      'bill_id': billId,
      'amount': amount,
      'payment_method': paymentMethod,
      'transaction_reference': transactionReference,
      'payment_date': paymentDate.toIso8601String(),
      'received_by': receivedBy,
      'notes': notes,
    };
  }
}

class PatientBillModel {
  final int id;
  final String billNumber;
  final int hospitalId;
  final String? hospitalName;
  final String? hospitalAddress;
  final String? hospitalPhone;
  final int? patientId;
  final String patientName;
  final String? patientPhone;
  final String? patientEmail;
  final DateTime? admissionDate;
  final DateTime? dischargeDate;
  final DateTime billDate;
  final DateTime? dueDate;
  final double subtotal;
  final double taxAmount;
  final double discountAmount;
  final double totalAmount;
  final double amountPaid;
  final double balanceDue;
  final String status;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<BillItemModel> items;
  final List<PaymentReceiptModel> payments;

  PatientBillModel({
    required this.id,
    required this.billNumber,
    required this.hospitalId,
    this.hospitalName,
    this.hospitalAddress,
    this.hospitalPhone,
    this.patientId,
    required this.patientName,
    this.patientPhone,
    this.patientEmail,
    this.admissionDate,
    this.dischargeDate,
    required this.billDate,
    this.dueDate,
    required this.subtotal,
    required this.taxAmount,
    required this.discountAmount,
    required this.totalAmount,
    required this.amountPaid,
    required this.balanceDue,
    required this.status,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
    this.items = const [],
    this.payments = const [],
  });

  factory PatientBillModel.fromJson(Map<String, dynamic> json) {
    return PatientBillModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      billNumber: json['bill_number'] as String? ?? '',
      hospitalId: json['hospital_id'] is int
          ? json['hospital_id']
          : int.tryParse(json['hospital_id'].toString()) ?? 0,
      hospitalName: json['hospital_name'] as String?,
      hospitalAddress: json['hospital_address'] as String?,
      hospitalPhone: json['hospital_phone'] as String?,
      patientId: json['patient_id'] as int?,
      patientName: json['patient_name'] as String? ?? '',
      patientPhone: json['patient_phone'] as String?,
      patientEmail: json['patient_email'] as String?,
      admissionDate: json['admission_date'] != null
          ? DateTime.tryParse(json['admission_date'].toString())
          : null,
      dischargeDate: json['discharge_date'] != null
          ? DateTime.tryParse(json['discharge_date'].toString())
          : null,
      billDate: json['bill_date'] != null
          ? DateTime.tryParse(json['bill_date'].toString()) ?? DateTime.now()
          : DateTime.now(),
      dueDate: json['due_date'] != null
          ? DateTime.tryParse(json['due_date'].toString())
          : null,
      subtotal: json['subtotal'] is num
          ? (json['subtotal'] as num).toDouble()
          : double.tryParse(json['subtotal'].toString()) ?? 0.0,
      taxAmount: json['tax_amount'] is num
          ? (json['tax_amount'] as num).toDouble()
          : double.tryParse(json['tax_amount'].toString()) ?? 0.0,
      discountAmount: json['discount_amount'] is num
          ? (json['discount_amount'] as num).toDouble()
          : double.tryParse(json['discount_amount'].toString()) ?? 0.0,
      totalAmount: json['total_amount'] is num
          ? (json['total_amount'] as num).toDouble()
          : double.tryParse(json['total_amount'].toString()) ?? 0.0,
      amountPaid: json['amount_paid'] is num
          ? (json['amount_paid'] as num).toDouble()
          : double.tryParse(json['amount_paid'].toString()) ?? 0.0,
      balanceDue: json['balance_due'] is num
          ? (json['balance_due'] as num).toDouble()
          : double.tryParse(json['balance_due'].toString()) ?? 0.0,
      status: json['status'] as String? ?? 'ISSUED',
      notes: json['notes'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      items: (json['items'] as List<dynamic>? ?? [])
          .map((i) => BillItemModel.fromJson(i as Map<String, dynamic>))
          .toList(),
      payments: (json['payments'] as List<dynamic>? ?? [])
          .map((p) => PaymentReceiptModel.fromJson(p as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bill_number': billNumber,
      'hospital_id': hospitalId,
      'hospital_name': hospitalName,
      'hospital_address': hospitalAddress,
      'hospital_phone': hospitalPhone,
      'patient_id': patientId,
      'patient_name': patientName,
      'patient_phone': patientPhone,
      'patient_email': patientEmail,
      'admission_date': admissionDate?.toIso8601String(),
      'discharge_date': dischargeDate?.toIso8601String(),
      'bill_date': billDate.toIso8601String(),
      'due_date': dueDate?.toIso8601String(),
      'subtotal': subtotal,
      'tax_amount': taxAmount,
      'discount_amount': discountAmount,
      'total_amount': totalAmount,
      'amount_paid': amountPaid,
      'balance_due': balanceDue,
      'status': status,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'items': items.map((i) => i.toJson()).toList(),
      'payments': payments.map((p) => p.toJson()).toList(),
    };
  }
}

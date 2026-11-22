class TransferRequestModel {
  final int id;
  final String transferCode;
  final String patientName;
  final int patientAge;
  final String patientGender;
  final String medicalCondition;
  final String priority;
  final int sourceHospitalId;
  final String? sourceHospitalName;
  final int targetHospitalId;
  final String? targetHospitalName;
  final String requiredBedCategory;
  final String transferStatus;
  final int? etaMinutes;
  final String? doctorInCharge;
  final String? notes;
  final DateTime? createdAt;

  TransferRequestModel({
    required this.id,
    required this.transferCode,
    required this.patientName,
    required this.patientAge,
    required this.patientGender,
    required this.medicalCondition,
    required this.priority,
    required this.sourceHospitalId,
    this.sourceHospitalName,
    required this.targetHospitalId,
    this.targetHospitalName,
    required this.requiredBedCategory,
    required this.transferStatus,
    this.etaMinutes,
    this.doctorInCharge,
    this.notes,
    this.createdAt,
  });

  factory TransferRequestModel.fromJson(Map<String, dynamic> json) {
    return TransferRequestModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      transferCode: json['transfer_code'] as String? ?? 'TR-0000',
      patientName: json['patient_name'] as String? ?? 'Patient',
      patientAge: json['patient_age'] is int ? json['patient_age'] : int.tryParse(json['patient_age'].toString()) ?? 40,
      patientGender: json['patient_gender'] as String? ?? 'Unknown',
      medicalCondition: json['medical_condition'] as String? ?? 'General Medical',
      priority: json['priority'] as String? ?? 'URGENT',
      sourceHospitalId: json['source_hospital_id'] is int ? json['source_hospital_id'] : int.tryParse(json['source_hospital_id'].toString()) ?? 0,
      sourceHospitalName: json['source_hospital_name'] as String?,
      targetHospitalId: json['target_hospital_id'] is int ? json['target_hospital_id'] : int.tryParse(json['target_hospital_id'].toString()) ?? 0,
      targetHospitalName: json['target_hospital_name'] as String?,
      requiredBedCategory: json['required_bed_category'] as String? ?? 'General',
      transferStatus: json['transfer_status'] as String? ?? 'INITIATED',
      etaMinutes: json['eta_minutes'] as int?,
      doctorInCharge: json['doctor_in_charge'] as String?,
      notes: json['notes'] as String?,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
    );
  }

  bool get isCritical => priority.toUpperCase() == 'CRITICAL';
  bool get isUrgent => priority.toUpperCase() == 'URGENT';
}

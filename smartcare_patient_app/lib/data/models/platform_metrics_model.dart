class PlatformMetricsModel {
  final int totalHospitals;
  final int approvedHospitals;
  final int pendingApplications;
  final int totalBeds;
  final int availableBeds;
  final int icuAvailable;
  final int ventilatorsAvailable;
  final int activeTransfers;
  final int pendingEmergencyRequests;
  final int availableAmbulances;

  PlatformMetricsModel({
    this.totalHospitals = 0,
    this.approvedHospitals = 0,
    this.pendingApplications = 0,
    this.totalBeds = 0,
    this.availableBeds = 0,
    this.icuAvailable = 0,
    this.ventilatorsAvailable = 0,
    this.activeTransfers = 0,
    this.pendingEmergencyRequests = 0,
    this.availableAmbulances = 0,
  });

  factory PlatformMetricsModel.fromJson(Map<String, dynamic> json) {
    int getInt(dynamic val) {
      if (val is int) return val;
      return int.tryParse(val?.toString() ?? '') ?? 0;
    }

    return PlatformMetricsModel(
      totalHospitals: getInt(json['total_hospitals']),
      approvedHospitals: getInt(json['approved_hospitals']),
      pendingApplications: getInt(json['pending_applications']),
      totalBeds: getInt(json['total_beds']),
      availableBeds: getInt(json['available_beds']),
      icuAvailable: getInt(json['icu_available']),
      ventilatorsAvailable: getInt(json['ventilators_available']),
      activeTransfers: getInt(json['active_transfers']),
      pendingEmergencyRequests: getInt(json['pending_emergency_requests']),
      availableAmbulances: getInt(json['available_ambulances']),
    );
  }
}

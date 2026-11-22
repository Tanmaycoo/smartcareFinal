import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/hospital_model.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/request_provider.dart';

class EmergencyRequestDialog extends StatefulWidget {
  final HospitalModel hospital;

  const EmergencyRequestDialog({super.key, required this.hospital});

  static Future<void> show(BuildContext context, HospitalModel hospital) {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => EmergencyRequestDialog(hospital: hospital),
    );
  }

  @override
  State<EmergencyRequestDialog> createState() => _EmergencyRequestDialogState();
}

class _EmergencyRequestDialogState extends State<EmergencyRequestDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _ageController = TextEditingController();
  final _phoneController = TextEditingController();
  final _notesController = TextEditingController();

  String _gender = 'Male';
  String _emergencyType = 'Cardiac / Chest Pain';
  String _severity = 'CRITICAL';
  int _etaMinutes = 15;

  final List<String> _emergencyTypes = [
    'Cardiac / Chest Pain',
    'Trauma / Accident Injury',
    'Acute Respiratory Distress',
    'Severe Stroke Symptoms',
    'Pediatric Emergency',
    'General Medical Critical',
  ];

  @override
  void initState() {
    super.initState();
    final authUser = context.read<AuthProvider>().user;
    if (authUser != null) {
      _nameController.text = authUser.name;
      if (authUser.phone != null) {
        _phoneController.text = authUser.phone!;
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _ageController.dispose();
    _phoneController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final requestProvider = context.read<RequestProvider>();
    final ticket = await requestProvider.submitEmergencyRequest(
      patientName: _nameController.text.trim(),
      patientAge: int.tryParse(_ageController.text.trim()) ?? 30,
      patientGender: _gender,
      contactPhone: _phoneController.text.trim(),
      emergencyType: _emergencyType,
      severity: _severity,
      notes: _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
      requestedHospitalId: widget.hospital.id,
      etaMinutes: _etaMinutes,
    );

    if (ticket != null && mounted) {
      Navigator.of(context).pop();
      _showSuccessDialog(ticket.ticketCode);
    }
  }

  void _showSuccessDialog(String ticketCode) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceContainerLowest,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: AppTheme.statusAvailable, size: 28),
            SizedBox(width: 10),
            Text('Ticket Dispatched!', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Your emergency bed request has been transmitted directly to hospital triage dispatch.',
              style: TextStyle(fontSize: 13, color: AppTheme.onSurfaceVariant),
            ),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.primaryFixed,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                children: [
                  const Text('EMERGENCY TICKET CODE',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.onSurfaceVariant)),
                  const SizedBox(height: 4),
                  Text(
                    ticketCode,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.primary,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('OK, Track Dispatch'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final requestProvider = context.watch<RequestProvider>();

    return Dialog(
      backgroundColor: AppTheme.surfaceContainerLowest,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: SingleChildScrollView(
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppTheme.errorContainer,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.emergency, color: AppTheme.error, size: 22),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Emergency Request',
                                style: TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.onSurface,
                                ),
                              ),
                              Text(
                                widget.hospital.name,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.onSurfaceVariant,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ],
                      ),
                      IconButton(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: const Icon(Icons.close),
                        visualDensity: VisualDensity.compact,
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  if (requestProvider.errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.errorContainer,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        requestProvider.errorMessage!,
                        style: const TextStyle(color: AppTheme.onErrorContainer, fontSize: 12),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  // Patient Name
                  TextFormField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'Patient Full Name',
                      prefixIcon: Icon(Icons.person_outline, size: 20),
                    ),
                    validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  // Age & Gender
                  Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: TextFormField(
                          controller: _ageController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Age',
                            prefixIcon: Icon(Icons.cake_outlined, size: 20),
                          ),
                          validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 3,
                        child: DropdownButtonFormField<String>(
                          initialValue: _gender,
                          decoration: const InputDecoration(labelText: 'Gender'),
                          items: const [
                            DropdownMenuItem(value: 'Male', child: Text('Male')),
                            DropdownMenuItem(value: 'Female', child: Text('Female')),
                            DropdownMenuItem(value: 'Other', child: Text('Other')),
                          ],
                          onChanged: (v) => setState(() => _gender = v!),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Contact Phone
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Caller / Contact Phone',
                      prefixIcon: Icon(Icons.phone_outlined, size: 20),
                    ),
                    validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  // Emergency Type Dropdown
                  DropdownButtonFormField<String>(
                    initialValue: _emergencyType,
                    decoration: const InputDecoration(
                      labelText: 'Emergency Category',
                      prefixIcon: Icon(Icons.medical_services_outlined, size: 20),
                    ),
                    items: _emergencyTypes
                        .map((t) => DropdownMenuItem(value: t, child: Text(t, style: const TextStyle(fontSize: 13))))
                        .toList(),
                    onChanged: (v) => setState(() => _emergencyType = v!),
                  ),
                  const SizedBox(height: 12),
                  // Severity & ETA
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _severity,
                          decoration: const InputDecoration(labelText: 'Triage Severity'),
                          items: const [
                            DropdownMenuItem(value: 'CRITICAL', child: Text('Critical (Red)')),
                            DropdownMenuItem(value: 'URGENT', child: Text('Urgent (Yellow)')),
                            DropdownMenuItem(value: 'STANDARD', child: Text('Standard (Green)')),
                          ],
                          onChanged: (v) => setState(() => _severity = v!),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<int>(
                          initialValue: _etaMinutes,
                          decoration: const InputDecoration(labelText: 'ETA to Hospital'),
                          items: const [
                            DropdownMenuItem(value: 5, child: Text('5 mins')),
                            DropdownMenuItem(value: 10, child: Text('10 mins')),
                            DropdownMenuItem(value: 15, child: Text('15 mins')),
                            DropdownMenuItem(value: 30, child: Text('30 mins')),
                          ],
                          onChanged: (v) => setState(() => _etaMinutes = v!),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _notesController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Brief Symptoms / Notes (Optional)',
                      hintText: 'e.g. Patient unconscious, oxygen requested...',
                    ),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: requestProvider.isSubmitting ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.error,
                      foregroundColor: Colors.white,
                      minimumSize: const Size(double.infinity, 48),
                    ),
                    child: requestProvider.isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.send_rounded, size: 18),
                              SizedBox(width: 8),
                              Text('Transmit Emergency Request', style: TextStyle(fontWeight: FontWeight.bold)),
                            ],
                          ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

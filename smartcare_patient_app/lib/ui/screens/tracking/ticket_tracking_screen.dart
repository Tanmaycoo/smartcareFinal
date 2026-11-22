import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/hospital_model.dart';
import '../../../data/models/patient_request_model.dart';
import '../../../providers/hospital_provider.dart';
import '../../../providers/request_provider.dart';
import '../../widgets/clinical_header.dart';
import '../../widgets/empty_error_view.dart';
import '../details/hospital_details_screen.dart';

class TicketTrackingScreen extends StatefulWidget {
  final VoidCallback? onProfileTap;

  const TicketTrackingScreen({super.key, this.onProfileTap});

  @override
  State<TicketTrackingScreen> createState() => _TicketTrackingScreenState();
}

class _TicketTrackingScreenState extends State<TicketTrackingScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  final TextEditingController _codeCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    _codeCtrl.dispose();
    super.dispose();
  }

  void _searchTicket() {
    final code = _codeCtrl.text.trim();
    if (code.isNotEmpty) {
      context.read<RequestProvider>().trackTicket(code);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surface,
      body: SafeArea(
        child: Column(
          children: [
            ClinicalHeader(
              title: 'Saved & Track',
              onProfileTap: widget.onProfileTap,
            ),
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              height: 44,
              decoration: BoxDecoration(
                color: AppTheme.surfaceContainerLow,
                borderRadius: BorderRadius.circular(12),
              ),
              child: TabBar(
                controller: _tabCtrl,
                indicator: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(10),
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                labelColor: Colors.white,
                unselectedLabelColor: AppTheme.onSurfaceVariant,
                labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                dividerColor: Colors.transparent,
                tabs: const [
                  Tab(text: 'Saved Hospitals'),
                  Tab(text: 'Track ER Ticket'),
                ],
              ),
            ),
            Expanded(
              child: TabBarView(
                controller: _tabCtrl,
                children: [
                  _buildSavedTab(context),
                  _buildTrackTab(context),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSavedTab(BuildContext context) {
    final hospitalProvider = context.watch<HospitalProvider>();
    final savedHospitals = hospitalProvider.savedHospitals;

    if (savedHospitals.isEmpty) {
      return const EmptyErrorView(
        icon: Icons.bookmark_border,
        title: 'No Saved Facilities',
        description:
            'You haven’t bookmarked any hospitals yet. Tap the bookmark icon on any facility card to save it here for fast emergency access.',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: savedHospitals.length,
      itemBuilder: (ctx, i) {
        final h = savedHospitals[i];
        return _buildSavedHospitalCard(context, h);
      },
    );
  }

  Widget _buildSavedHospitalCard(BuildContext context, HospitalModel hospital) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(14),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppTheme.primaryFixed,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Center(
              child: Icon(Icons.local_hospital, color: AppTheme.primary, size: 22),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  hospital.name,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.onSurface,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${hospital.city} • ${hospital.distanceFormatted}',
                  style: const TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      'Beds: ${hospital.totalAvailableBeds} open',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.statusAvailableText,
                      ),
                    ),
                    const Text(' • ', style: TextStyle(color: AppTheme.outlineVariant)),
                    Text(
                      'ICU: ${hospital.icuAvailable}',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: hospital.icuAvailable <= 3
                            ? AppTheme.error
                            : AppTheme.statusLimitedText,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => HospitalDetailsScreen(hospitalId: hospital.id),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              minimumSize: const Size(70, 36),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Open', style: TextStyle(fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildTrackTab(BuildContext context) {
    final requestProvider = context.watch<RequestProvider>();
    final ticket = requestProvider.trackedTicket;
    final isTracking = requestProvider.isTracking;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(16),
              boxShadow: AppTheme.cardShadow,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Track Emergency Bed Ticket',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.onSurface,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Enter the 8-character ticket code provided when you submitted your emergency dispatch request.',
                  style: TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _codeCtrl,
                        textCapitalization: TextCapitalization.characters,
                        decoration: const InputDecoration(
                          hintText: 'e.g. SC-ER-9821',
                          prefixIcon: Icon(Icons.confirmation_number_outlined, size: 20),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    ElevatedButton(
                      onPressed: isTracking ? null : _searchTicket,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        minimumSize: const Size(90, 48),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: isTracking
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text('Track'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (requestProvider.errorMessage != null)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.errorContainer,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: AppTheme.error, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      requestProvider.errorMessage!,
                      style: const TextStyle(color: AppTheme.onErrorContainer, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          if (ticket != null) ...[
            const SizedBox(height: 16),
            _buildTicketStatusCard(context, ticket),
          ],
        ],
      ),
    );
  }

  Widget _buildTicketStatusCard(BuildContext context, PatientRequestModel ticket) {
    Color statusColor;
    String statusLabel;
    IconData statusIcon;

    switch (ticket.status.toUpperCase()) {
      case 'ACCEPTED':
      case 'ALLOCATED':
        statusColor = AppTheme.statusAvailable;
        statusLabel = 'Bed Allocated / Accepted';
        statusIcon = Icons.check_circle;
        break;
      case 'REJECTED':
        statusColor = AppTheme.error;
        statusLabel = 'Triage Full / Rerouted';
        statusIcon = Icons.cancel;
        break;
      default:
        statusColor = AppTheme.statusLimited;
        statusLabel = 'Under Review by Dispatcher';
        statusIcon = Icons.hourglass_top;
        break;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('TICKET CODE',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.onSurfaceVariant)),
                  Text(
                    ticket.ticketCode,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.primary,
                      letterSpacing: 1.5,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(9999),
                ),
                child: Row(
                  children: [
                    Icon(statusIcon, color: statusColor, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      statusLabel,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: statusColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const Divider(height: 24),
          _buildInfoRow('Patient Name', ticket.patientName),
          _buildInfoRow('Emergency Type', ticket.emergencyType),
          _buildInfoRow('Severity Level', ticket.severity),
          _buildInfoRow('Hospital Target', ticket.hospitalName ?? 'Hospital #${ticket.requestedHospitalId}'),
          if (ticket.allocatedBedCategory != null)
            _buildInfoRow('Allocated Bed', ticket.allocatedBedCategory!),
          _buildInfoRow('Reported ETA', '${ticket.etaMinutes} mins'),
          if (ticket.notes != null)
            _buildInfoRow('Notes', ticket.notes!),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant)),
          Text(
            value,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.onSurface),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/hospital_model.dart';
import '../../../providers/hospital_provider.dart';
import '../../../providers/pricing_provider.dart';
import '../../widgets/clinical_header.dart';
import '../../widgets/empty_error_view.dart';
import '../../widgets/status_badge.dart';
import 'emergency_request_dialog.dart';
import '../pricing/cost_estimation_screen.dart';

class HospitalDetailsScreen extends StatefulWidget {
  final int hospitalId;

  const HospitalDetailsScreen({super.key, required this.hospitalId});

  @override
  State<HospitalDetailsScreen> createState() => _HospitalDetailsScreenState();
}

class _HospitalDetailsScreenState extends State<HospitalDetailsScreen> {
  int _selectedTab = 0; // 0: Capacity, 1: Pricing

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<HospitalProvider>().selectHospital(widget.hospitalId);
      context.read<PricingProvider>().loadHospitalPricing(widget.hospitalId);
    });
  }

  Future<void> _makeCall(String phoneNumber) async {
    final cleanPhone = phoneNumber.replaceAll(RegExp(r'[^0-9+]'), '');
    final uri = Uri.parse('tel:$cleanPhone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _openNavigation(double lat, double lng, String name) async {
    final uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$lat,$lng');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hospitalProvider = context.watch<HospitalProvider>();
    final hospital = hospitalProvider.selectedHospital;
    final isLoading = hospitalProvider.isDetailLoading;

    return Scaffold(
      backgroundColor: AppTheme.surface,
      body: SafeArea(
        child: Column(
          children: [
            ClinicalHeader(
              title: 'Hospital Detail',
              showBackButton: true,
              onBack: () => Navigator.of(context).pop(),
            ),
            Expanded(
              child: isLoading
                  ? const Center(
                      child: CircularProgressIndicator(color: AppTheme.primary),
                    )
                  : hospital == null
                      ? EmptyErrorView(
                          title: 'Hospital Details Unavailable',
                          description: hospitalProvider.errorMessage ??
                              'Could not load hospital data. Please try again.',
                          onRetry: () => hospitalProvider.selectHospital(widget.hospitalId),
                        )
                      : _buildHospitalDetailContent(context, hospital),
            ),
          ],
        ),
      ),
      bottomNavigationBar: hospital != null
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppTheme.surfaceContainerLowest,
                boxShadow: AppTheme.elevatedShadow,
              ),
              child: ElevatedButton.icon(
                onPressed: () => EmergencyRequestDialog.show(context, hospital),
                icon: const Icon(Icons.emergency, color: Colors.white, size: 20),
                label: const Text(
                  'Request Emergency Bed Allocation',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.error,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildHospitalDetailContent(BuildContext context, HospitalModel hospital) {
    final isSaved = context.watch<HospitalProvider>().isSaved(hospital.id);

    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Hero Banner
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Container(
              height: 180,
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: const LinearGradient(
                  colors: [AppTheme.primaryDark, AppTheme.secondary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Stack(
                children: [
                  Positioned.fill(
                    child: Opacity(
                      opacity: 0.15,
                      child: Center(
                        child: Icon(
                          Icons.local_hospital_rounded,
                          size: 140,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 12,
                    left: 12,
                    right: 12,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.5),
                            borderRadius: BorderRadius.circular(9999),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.verified, size: 14, color: AppTheme.tertiaryFixed),
                              SizedBox(width: 4),
                              Text(
                                'NABH / Government Verified',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.9),
                            borderRadius: BorderRadius.circular(9999),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.star, size: 14, color: AppTheme.primary),
                              SizedBox(width: 4),
                              Text(
                                '4.8 (1.2k)',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.onSurface,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Title & Address
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    StatusBadge(
                      label: 'Verified Partner',
                      type: StatusBadgeType.verified,
                    ),
                    const SizedBox(width: 8),
                    StatusBadge(
                      label: 'Emergency 24/7',
                      type: StatusBadgeType.emergency,
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  hospital.name,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.onSurface,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.location_on, size: 18, color: AppTheme.primary),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        '${hospital.address}, ${hospital.city}, ${hospital.state} ${hospital.pincode}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppTheme.onSurfaceVariant,
                          height: 1.3,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // 4 Quick Action Circle Nodes
                Row(
                  children: [
                    Expanded(
                      child: _buildActionNode(
                        icon: Icons.call,
                        label: 'Call ER',
                        color: AppTheme.error,
                        onTap: () => _makeCall(hospital.emergencyPhone),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildActionNode(
                        icon: Icons.directions,
                        label: 'Navigate',
                        color: AppTheme.primary,
                        onTap: () => _openNavigation(
                          hospital.latitude,
                          hospital.longitude,
                          hospital.name,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildActionNode(
                        icon: Icons.local_phone_outlined,
                        label: 'Reception',
                        color: AppTheme.secondary,
                        onTap: () => _makeCall(hospital.receptionPhone ?? hospital.emergencyPhone),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildActionNode(
                        icon: isSaved ? Icons.bookmark : Icons.bookmark_border,
                        label: isSaved ? 'Saved' : 'Save',
                        color: isSaved ? AppTheme.primary : AppTheme.outline,
                        onTap: () => context.read<HospitalProvider>().toggleSave(hospital.id),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Segmented Tabs: Capacity vs Published Rates
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AppTheme.surfaceContainerLow,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => setState(() => _selectedTab = 0),
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 9),
                        decoration: BoxDecoration(
                          color: _selectedTab == 0 ? AppTheme.surfaceContainerLowest : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: _selectedTab == 0 ? AppTheme.cardShadow : null,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.bed, size: 16, color: _selectedTab == 0 ? AppTheme.primary : AppTheme.onSurfaceVariant),
                            const SizedBox(width: 6),
                            Text(
                              'Capacity & Beds',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: _selectedTab == 0 ? FontWeight.bold : FontWeight.w600,
                                color: _selectedTab == 0 ? AppTheme.onSurface : AppTheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: InkWell(
                      onTap: () {
                        setState(() => _selectedTab = 1);
                        context.read<PricingProvider>().loadHospitalPricing(hospital.id);
                      },
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 9),
                        decoration: BoxDecoration(
                          color: _selectedTab == 1 ? AppTheme.surfaceContainerLowest : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: _selectedTab == 1 ? AppTheme.cardShadow : null,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.receipt_long, size: 16, color: _selectedTab == 1 ? AppTheme.primary : AppTheme.onSurfaceVariant),
                            const SizedBox(width: 6),
                            Text(
                              'Pricing & Rates',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: _selectedTab == 1 ? FontWeight.bold : FontWeight.w600,
                                color: _selectedTab == 1 ? AppTheme.onSurface : AppTheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 8),

          if (_selectedTab == 0)
            // Live Resource & Bed Capacity Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
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
                        const Row(
                          children: [
                            Icon(Icons.local_hospital, color: AppTheme.primary, size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Live Resource Capacity',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.onSurface,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceContainerHigh,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'LIVE SYNC',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.onSurfaceVariant,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    const Row(
                      children: [
                        Icon(Icons.sync, size: 13, color: AppTheme.tertiary),
                        SizedBox(width: 4),
                        Text(
                          'Direct synchronization with hospital bed coordinator',
                          style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Advisory box
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceContainerLow,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.info_outline, size: 16, color: AppTheme.secondary),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Reported hospital counts reflect live dispatch data; not a pre-admission booking.',
                              style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Bed Categories List
                    if (hospital.beds.isEmpty)
                      _buildDefaultBedMetrics(hospital)
                    else
                      ...hospital.beds.map((b) => _buildBedProgressTile(
                            category: b.category,
                            available: b.availableBeds,
                            total: b.totalBeds,
                            isIcu: b.isIcu,
                          )),

                    const SizedBox(height: 12),

                    // Mini metric cards for Resources
                    if (hospital.resources.isNotEmpty) ...[
                      const Text(
                        'CRITICAL CLINICAL RESOURCES',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.onSurfaceVariant,
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: hospital.resources.map((r) {
                          return Container(
                            width: (MediaQuery.of(context).size.width - 72) / 2,
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceContainerLow,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  r.resourceName,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.onSurface,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${r.quantityAvailable} ${r.unit}',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.tertiary,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ],
                ),
              ),
            )
          else
            _buildPricingContent(context, hospital),
        ],
      ),
    );
  }

  Widget _buildPricingContent(BuildContext context, HospitalModel hospital) {
    final pricingProv = context.watch<PricingProvider>();
    final services = pricingProv.getPricingForHospital(hospital.id);
    final isLoading = pricingProv.isLoading;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
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
                const Row(
                  children: [
                    Icon(Icons.sell_outlined, color: AppTheme.primary, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Published Tariff & Rates',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.onSurface,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppTheme.tertiaryFixed,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'OFFICIAL RATES',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.tertiary),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Mandatory Disclaimer Box
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.surfaceContainerLow,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline, size: 16, color: AppTheme.primary),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Prices shown are published by the hospital and are for informational purposes. Actual charges may vary depending on the services provided, treatment requirements, length of stay, additional procedures and applicable fees. Contact the hospital to confirm the final cost.',
                      style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant, height: 1.3),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            if (isLoading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 36),
                child: Center(child: CircularProgressIndicator(color: AppTheme.primary)),
              )
            else if (services.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Center(
                  child: Column(
                    children: [
                      const Icon(Icons.receipt_long_outlined, size: 40, color: AppTheme.outline),
                      const SizedBox(height: 8),
                      const Text(
                        'No rates disclosed yet for this facility.',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.onSurface),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Hospital administrators publish and update tariffs via the Hospital Portal.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: () => pricingProv.loadHospitalPricing(hospital.id),
                        icon: const Icon(Icons.refresh, size: 16),
                        label: const Text('Refresh Rates', style: TextStyle(fontSize: 12)),
                      ),
                    ],
                  ),
                ),
              )
            else ...[
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: services.length,
                separatorBuilder: (_, __) => const Divider(height: 1, color: AppTheme.outlineVariant),
                itemBuilder: (context, index) {
                  final s = services[index];
                  final priceStr = '₹${s.price.toStringAsFixed(s.price.truncateToDouble() == s.price ? 0 : 2)}';

                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                s.serviceName,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.onSurface,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                s.category,
                                style: const TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
                              ),
                              if (s.description != null && s.description!.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(top: 2),
                                  child: Text(
                                    s.description!,
                                    style: const TextStyle(fontSize: 10, color: AppTheme.outline),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              priceStr,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.primary,
                              ),
                            ),
                            Text(
                              s.billingUnit,
                              style: const TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),

              const SizedBox(height: 16),

              ElevatedButton.icon(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => CostEstimationScreen(preselectedHospitalId: hospital.id),
                    ),
                  );
                },
                icon: const Icon(Icons.calculate_outlined, color: Colors.white, size: 18),
                label: const Text(
                  'Estimate Cost at this Hospital',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 44),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildActionNode({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: AppTheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: Colors.white, size: 20),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppTheme.onSurface,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDefaultBedMetrics(HospitalModel hospital) {
    return Column(
      children: [
        _buildBedProgressTile(
          category: 'General Ward Beds',
          available: hospital.totalAvailableBeds,
          total: hospital.totalCapacity > 0 ? hospital.totalCapacity : 120,
          isIcu: false,
        ),
        _buildBedProgressTile(
          category: 'Adult ICU (Intensive Care)',
          available: hospital.icuAvailable,
          total: 24,
          isIcu: true,
        ),
      ],
    );
  }

  Widget _buildBedProgressTile({
    required String category,
    required int available,
    required int total,
    required bool isIcu,
  }) {
    final effectiveTotal = total > 0 ? total : 50;
    final occupied = (effectiveTotal - available).clamp(0, effectiveTotal);
    final occupancyPct = ((occupied / effectiveTotal) * 100).round();
    final isCritical = available <= 3;
    final progressColor = isIcu
        ? (isCritical ? AppTheme.error : AppTheme.statusLimited)
        : AppTheme.tertiary;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.surfaceContainerLow.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    isIcu ? Icons.monitor_heart : Icons.bed,
                    size: 16,
                    color: isIcu ? AppTheme.error : AppTheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    category,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.onSurface,
                    ),
                  ),
                ],
              ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    '$available',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: progressColor,
                    ),
                  ),
                  Text(
                    ' / $effectiveTotal free',
                    style: const TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(9999),
            child: LinearProgressIndicator(
              value: occupied / effectiveTotal,
              backgroundColor: AppTheme.surfaceContainer,
              valueColor: AlwaysStoppedAnimation<Color>(progressColor),
              minHeight: 7,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '$occupancyPct% Occupied',
                style: const TextStyle(fontSize: 10, color: AppTheme.onSurfaceVariant),
              ),
              Row(
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: progressColor,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    isCritical ? 'Limited Slots' : 'Accepting Patients',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: progressColor,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

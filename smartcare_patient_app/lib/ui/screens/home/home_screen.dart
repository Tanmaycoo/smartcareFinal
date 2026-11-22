import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/config/app_config.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/hospital_model.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/hospital_provider.dart';
import '../../widgets/clinical_header.dart';
import '../../widgets/empty_error_view.dart';
import '../../widgets/live_sync_banner.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/telemetry_grid.dart';
import '../details/hospital_details_screen.dart';
import '../discovery/filter_bottom_sheet.dart';
import '../pricing/pricing_services_screen.dart';
import '../pricing/cost_estimation_screen.dart';
import '../billing/my_bills_screen.dart';
import '../blood/blood_donation_screen.dart';
import '../referrals/my_referrals_screen.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback onNavigateToFind;
  final VoidCallback onProfileTap;
  final VoidCallback? onNavigateToBlood;

  const HomeScreen({
    super.key,
    required this.onNavigateToFind,
    required this.onProfileTap,
    this.onNavigateToBlood,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _callEmergency() async {
    final uri = Uri.parse('tel:${AppConfig.emergencyHotline}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  void _locateNearestEr(List<HospitalModel> hospitals) {
    if (hospitals.isEmpty) {
      widget.onNavigateToFind();
      return;
    }
    // Navigate to the hospital with the closest distance or highest ICU availability
    final target = hospitals.first;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => HospitalDetailsScreen(hospitalId: target.id),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final hospitalProvider = context.watch<HospitalProvider>();
    final user = authProvider.user;
    final hospitals = hospitalProvider.hospitals;
    final isLoading = hospitalProvider.isLoading;

    final userName = user != null && user.name.isNotEmpty
        ? user.name.split(' ').first
        : 'Patient';

    return Scaffold(
      backgroundColor: AppTheme.surface,
      body: SafeArea(
        child: Column(
          children: [
            ClinicalHeader(
              title: 'Home',
              onProfileTap: widget.onProfileTap,
            ),
            Expanded(
              child: RefreshIndicator(
                color: AppTheme.primary,
                onRefresh: () => hospitalProvider.fetchHospitals(),
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Greeting & Telemetry Sync Icon
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    'Hello, $userName',
                                    style: const TextStyle(
                                      fontSize: 24,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.onSurface,
                                      letterSpacing: -0.3,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  const Text('👋', style: TextStyle(fontSize: 22)),
                                ],
                              ),
                              const SizedBox(height: 2),
                              const Text(
                                'Find verified hospital resources near you',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: AppTheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                          InkWell(
                            onTap: () => hospitalProvider.fetchHospitals(),
                            borderRadius: BorderRadius.circular(9999),
                            child: Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: AppTheme.surfaceContainerLow,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.sync,
                                color: AppTheme.primary,
                                size: 20,
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Urgent ER Access Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.errorContainer.withValues(alpha: 0.4),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: AppTheme.error.withValues(alpha: 0.2),
                            width: 1,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: AppTheme.errorContainer,
                                    borderRadius: BorderRadius.circular(9999),
                                  ),
                                  child: const Center(
                                    child: Icon(
                                      Icons.emergency_outlined,
                                      color: AppTheme.error,
                                      size: 22,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          const Text(
                                            'Urgent ER Access',
                                            style: TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w700,
                                              color: AppTheme.onSurface,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Container(
                                            width: 8,
                                            height: 8,
                                            decoration: const BoxDecoration(
                                              color: AppTheme.error,
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 2),
                                      const Text(
                                        'Immediate routing to open trauma units with zero wait on critical triage.',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: AppTheme.onSurfaceVariant,
                                          height: 1.3,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            Row(
                              children: [
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: () => _locateNearestEr(hospitals),
                                    icon: const Icon(Icons.near_me, size: 18),
                                    label: const Text(
                                      'Locate Nearest ER',
                                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppTheme.error,
                                      foregroundColor: Colors.white,
                                      minimumSize: const Size(0, 44),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                OutlinedButton.icon(
                                  onPressed: _callEmergency,
                                  icon: const Icon(Icons.phone_in_talk, size: 18, color: AppTheme.error),
                                  label: const Text(
                                    'Call 911',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.error,
                                    ),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    backgroundColor: AppTheme.surfaceContainerLowest,
                                    side: const BorderSide(color: AppTheme.error, width: 1),
                                    minimumSize: const Size(0, 44),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Search Input & Radius Selector
                      Container(
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppTheme.surfaceContainerLow,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.outlineVariant, width: 0.5),
                        ),
                        child: Row(
                          children: [
                            const SizedBox(width: 12),
                            const Icon(Icons.search, color: AppTheme.onSurfaceVariant, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: TextField(
                                controller: _searchCtrl,
                                onSubmitted: (val) => hospitalProvider.setSearchQuery(val),
                                decoration: const InputDecoration(
                                  hintText: 'Search hospitals, ICU, trauma...',
                                  border: InputBorder.none,
                                  enabledBorder: InputBorder.none,
                                  focusedBorder: InputBorder.none,
                                  contentPadding: EdgeInsets.zero,
                                  filled: false,
                                ),
                                style: const TextStyle(fontSize: 13, color: AppTheme.onSurface),
                              ),
                            ),
                            InkWell(
                              onTap: () => FilterBottomSheet.show(context),
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                margin: const EdgeInsets.only(right: 6),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                decoration: BoxDecoration(
                                  color: AppTheme.surfaceContainerHigh,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.location_on, size: 13, color: AppTheme.primary),
                                    const SizedBox(width: 4),
                                    Text(
                                      hospitalProvider.selectedRadiusKm != null
                                          ? '${hospitalProvider.selectedRadiusKm!.toInt()} km'
                                          : 'All',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: AppTheme.primary,
                                      ),
                                    ),
                                    const Icon(Icons.expand_more, size: 13, color: AppTheme.primary),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.my_location, size: 13, color: AppTheme.tertiary),
                          const SizedBox(width: 4),
                          Text(
                            hospitalProvider.locationName,
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.onSurface,
                            ),
                          ),
                          const Text(' • ', style: TextStyle(color: AppTheme.outlineVariant)),
                          const Text(
                            'GPS Accurate',
                            style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Category Filter Chips
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _buildCategoryChip('All', 'All Hospitals', Icons.domain),
                            const SizedBox(width: 8),
                            InkWell(
                              onTap: () {
                                if (widget.onNavigateToBlood != null) {
                                  widget.onNavigateToBlood!();
                                } else {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(builder: (_) => const BloodDonationScreen()),
                                  );
                                }
                              },
                              borderRadius: BorderRadius.circular(9999),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFF1F2),
                                  borderRadius: BorderRadius.circular(9999),
                                  border: Border.all(color: const Color(0xFFFDA4AF), width: 1),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.bloodtype, size: 15, color: Color(0xFFE11D48)),
                                    SizedBox(width: 6),
                                    Text(
                                      'Blood Banks & Stock',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFFBE123C),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            _buildCategoryChip('Emergency 24/7', 'Emergency 24/7', Icons.emergency, iconColor: AppTheme.error),
                            const SizedBox(width: 8),
                            _buildCategoryChip('ICU Beds', 'ICU Beds', Icons.bed, iconColor: AppTheme.primary),
                            const SizedBox(width: 8),
                            _buildCategoryChip('Pediatric Care', 'Pediatric Care', Icons.child_care, iconColor: AppTheme.tertiary),
                            const SizedBox(width: 8),
                            _buildCategoryChip('Oxygen Supply', 'Oxygen Supply', Icons.air, iconColor: AppTheme.secondary),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Live Sync Mesh Banner
                      LiveSyncBanner(
                        facilityCount: hospitals.length,
                        onMapTap: widget.onNavigateToFind,
                      ),

                      const SizedBox(height: 20),

                      // Verified Facilities Header
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Verified Facilities',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.onSurface,
                              letterSpacing: -0.2,
                            ),
                          ),
                          TextButton(
                            onPressed: widget.onNavigateToFind,
                            child: Text(
                              'View All (${hospitals.length})',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.primary,
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 8),

                      // Hospital Cards
                      if (isLoading)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 36),
                          child: Center(
                            child: CircularProgressIndicator(color: AppTheme.primary),
                          ),
                        )
                      else if (hospitals.isEmpty)
                        EmptyErrorView(
                          title: 'No Facilities Detected',
                          description:
                              'Could not locate active hospital nodes in this range. Tap below to show all available network facilities.',
                          buttonText: 'Show All Facilities',
                          onRetry: () {
                            hospitalProvider.setRadius(null);
                            hospitalProvider.setCity('All');
                            hospitalProvider.setCategoryFilter('All');
                            hospitalProvider.setSearchQuery('');
                          },
                        )
                      else
                        ...hospitals.take(3).map((h) => _buildHospitalHomeCard(context, h)),

                      const SizedBox(height: 16),

                      // Hospital Departments 2x2 Grid
                      const Text(
                        'Hospital Departments',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.onSurface,
                          letterSpacing: -0.2,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: _buildDepartmentCard(
                              title: 'Emergency & Trauma',
                              subtitle: 'Level 1 & 2 triage',
                              icon: Icons.airport_shuttle,
                              color: AppTheme.error,
                              bg: AppTheme.errorContainer.withValues(alpha: 0.4),
                              onTap: () {
                                hospitalProvider.setCategoryFilter('Emergency 24/7');
                                widget.onNavigateToFind();
                              },
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _buildDepartmentCard(
                              title: 'Intensive Care',
                              subtitle: 'ICU & CCU telemetry',
                              icon: Icons.monitor_heart,
                              color: AppTheme.primary,
                              bg: AppTheme.primaryFixed,
                              onTap: () {
                                hospitalProvider.setCategoryFilter('ICU Beds');
                                widget.onNavigateToFind();
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: _buildDepartmentCard(
                              title: 'Pediatric Care',
                              subtitle: 'NICU & Maternity',
                              icon: Icons.child_care,
                              color: AppTheme.secondary,
                              bg: AppTheme.secondaryContainer.withValues(alpha: 0.2),
                              onTap: () {
                                hospitalProvider.setCategoryFilter('Pediatric Care');
                                widget.onNavigateToFind();
                              },
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _buildDepartmentCard(
                              title: 'Diagnostics',
                              subtitle: 'CT, MRI & Ultrasound',
                              icon: Icons.biotech,
                              color: AppTheme.onSurfaceVariant,
                              bg: AppTheme.surfaceContainerHigh,
                              onTap: widget.onNavigateToFind,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      // Pricing, Cost Estimator & Bills Section
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Pricing, Estimates & Billing',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.onSurface,
                              letterSpacing: -0.2,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryFixed,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'TRANSPARENT',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primary,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      Row(
                        children: [
                          Expanded(
                            child: InkWell(
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (_) => const PricingServicesScreen()),
                                );
                              },
                              borderRadius: BorderRadius.circular(14),
                              child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: AppTheme.surfaceContainerLowest,
                                  borderRadius: BorderRadius.circular(14),
                                  boxShadow: AppTheme.cardShadow,
                                  border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.3)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      width: 36,
                                      height: 36,
                                      decoration: BoxDecoration(
                                        color: AppTheme.primaryFixed,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Icon(Icons.sell_outlined, color: AppTheme.primary, size: 20),
                                    ),
                                    const SizedBox(height: 8),
                                    const Text(
                                      'Hospital Tariffs',
                                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.onSurface),
                                    ),
                                    const SizedBox(height: 2),
                                    const Text(
                                      'Browse published rates',
                                      style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: InkWell(
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (_) => const CostEstimationScreen()),
                                );
                              },
                              borderRadius: BorderRadius.circular(14),
                              child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: AppTheme.surfaceContainerLowest,
                                  borderRadius: BorderRadius.circular(14),
                                  boxShadow: AppTheme.cardShadow,
                                  border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.3)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      width: 36,
                                      height: 36,
                                      decoration: BoxDecoration(
                                        color: AppTheme.tertiaryFixed,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Icon(Icons.calculate_outlined, color: AppTheme.tertiary, size: 20),
                                    ),
                                    const SizedBox(height: 8),
                                    const Text(
                                      'Cost Estimator',
                                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.onSurface),
                                    ),
                                    const SizedBox(height: 2),
                                    const Text(
                                      'Itemized treatment calc',
                                      style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // My Bills Banner
                      InkWell(
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const MyBillsScreen()),
                          );
                        },
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceContainerLowest,
                            borderRadius: BorderRadius.circular(14),
                            boxShadow: AppTheme.cardShadow,
                            border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.3)),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.receipt_long, color: AppTheme.primary, size: 24),
                              SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'My Medical Bills & Receipts',
                                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.onSurface),
                                    ),
                                    SizedBox(height: 2),
                                    Text(
                                      'Review hospital invoices, outstanding balances & payments',
                                      style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
                                    ),
                                  ],
                                ),
                              ),
                              Icon(Icons.chevron_right, color: AppTheme.outline, size: 20),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 10),

                      // Blood Bank & Voluntary Donors Banner
                      InkWell(
                        onTap: () {
                          if (widget.onNavigateToBlood != null) {
                            widget.onNavigateToBlood!();
                          } else {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const BloodDonationScreen()),
                            );
                          }
                        },
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF1F2),
                            borderRadius: BorderRadius.circular(14),
                            boxShadow: AppTheme.cardShadow,
                            border: Border.all(color: const Color(0xFFFECDD3)),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.bloodtype, color: Color(0xFFE11D48), size: 24),
                              SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          'Blood Bank & Donors',
                                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF9F1239)),
                                        ),
                                        SizedBox(width: 6),
                                        Text(
                                          'EMERGENCY',
                                          style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w800,
                                            color: Color(0xFFE11D48),
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                      ],
                                    ),
                                    SizedBox(height: 2),
                                    Text(
                                      'Find live blood stock, compatible donors or register to donate',
                                      style: TextStyle(fontSize: 11, color: Color(0xFFBE123C)),
                                    ),
                                  ],
                                ),
                              ),
                              Icon(Icons.chevron_right, color: Color(0xFFE11D48), size: 20),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 10),

                      // Hospital Referrals & Confirmed Appointments Banner
                      InkWell(
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const MyReferralsScreen()),
                          );
                        },
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceContainerLowest,
                            borderRadius: BorderRadius.circular(14),
                            boxShadow: AppTheme.cardShadow,
                            border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.3)),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.share_location_outlined, color: AppTheme.primary, size: 24),
                              SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          'My Referrals & Bookings',
                                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.onSurface),
                                        ),
                                        SizedBox(width: 6),
                                        Text(
                                          'COORDINATED',
                                          style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w800,
                                            color: AppTheme.primary,
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                      ],
                                    ),
                                    SizedBox(height: 2),
                                    Text(
                                      'View confirmed diagnostic slots, prep notes & partner hospital referrals',
                                      style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
                                    ),
                                  ],
                                ),
                              ),
                              Icon(Icons.chevron_right, color: AppTheme.outline, size: 20),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Recent Queries Section
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Recent Queries',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.onSurface,
                            ),
                          ),
                          TextButton(
                            onPressed: () => hospitalProvider.clearRecentSearches(),
                            child: const Text(
                              'Clear history',
                              style: TextStyle(fontSize: 12, color: AppTheme.outline),
                            ),
                          ),
                        ],
                      ),
                      ...hospitalProvider.recentSearches.map((q) => _buildRecentQueryTile(q)),
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryChip(String value, String label, IconData icon, {Color? iconColor}) {
    final provider = context.watch<HospitalProvider>();
    final isSelected = provider.selectedCategory == value;

    return ChoiceChip(
      avatar: Icon(
        icon,
        size: 15,
        color: isSelected ? Colors.white : (iconColor ?? AppTheme.onSurfaceVariant),
      ),
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => provider.setCategoryFilter(value),
      selectedColor: AppTheme.primary,
      backgroundColor: AppTheme.surfaceContainerLow,
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: isSelected ? Colors.white : AppTheme.onSurfaceVariant,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(9999),
        side: BorderSide(
          color: isSelected ? AppTheme.primary : AppTheme.outlineVariant,
          width: 0.5,
        ),
      ),
    );
  }

  Widget _buildHospitalHomeCard(BuildContext context, HospitalModel hospital) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      hospital.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.near_me, size: 14, color: AppTheme.primary),
                        const SizedBox(width: 4),
                        Text(
                          hospital.city.isNotEmpty ? hospital.city : 'Metro Area',
                          style: const TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant),
                        ),
                        const Text(' • ', style: TextStyle(color: AppTheme.outlineVariant)),
                        Text(
                          hospital.distanceFormatted,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.primary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              StatusBadge(label: 'Verified', type: StatusBadgeType.verified),
            ],
          ),

          const SizedBox(height: 10),

          // Facility Tags
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: hospital.capabilityTags.map((tag) {
                return Container(
                  margin: const EdgeInsets.only(right: 6),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    tag,
                    style: const TextStyle(fontSize: 11, color: AppTheme.onSurface),
                  ),
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: 12),

          // Bed Telemetry
          TelemetryGrid(hospital: hospital),

          const SizedBox(height: 12),

          ElevatedButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => HospitalDetailsScreen(hospitalId: hospital.id),
                ),
              );
            },
            icon: const Icon(Icons.arrow_forward, size: 16),
            label: const Text(
              'View Details & Emergency Queue',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 44),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDepartmentCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required Color bg,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(12),
          boxShadow: AppTheme.cardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 10),
            Text(
              title,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppTheme.onSurface,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentQueryTile(String query) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              const Icon(Icons.history, size: 16, color: AppTheme.outline),
              const SizedBox(width: 10),
              Text(
                query,
                style: const TextStyle(fontSize: 13, color: AppTheme.onSurface),
              ),
            ],
          ),
          InkWell(
            onTap: () {
              context.read<HospitalProvider>().setSearchQuery(query);
              widget.onNavigateToFind();
            },
            child: const Icon(Icons.north_west, size: 16, color: AppTheme.outline),
          ),
        ],
      ),
    );
  }
}

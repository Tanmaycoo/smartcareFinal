import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/hospital_model.dart';
import '../../../providers/hospital_provider.dart';
import '../../widgets/clinical_header.dart';
import '../../widgets/empty_error_view.dart';
import '../../widgets/status_badge.dart';
import '../details/hospital_details_screen.dart';
import 'filter_bottom_sheet.dart';

class FindHospitalsScreen extends StatefulWidget {
  final VoidCallback? onProfileTap;

  const FindHospitalsScreen({super.key, this.onProfileTap});

  @override
  State<FindHospitalsScreen> createState() => _FindHospitalsScreenState();
}

class _FindHospitalsScreenState extends State<FindHospitalsScreen> {
  bool _isMapView = false;
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _openMaps(double lat, double lng) async {
    final uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$lat,$lng');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _showChangeLocationDialog() {
    final provider = context.read<HospitalProvider>();
    final ctrl = TextEditingController(text: provider.locationName);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceContainerLowest,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Change Location', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Enter your current district or city to find closest facilities:',
              style: TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: ctrl,
              autofocus: true,
              decoration: const InputDecoration(
                hintText: 'e.g. Metro Central, Pune, Downtown',
                prefixIcon: Icon(Icons.location_on, size: 20),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              if (ctrl.text.trim().isNotEmpty) {
                provider.updateLocation(
                  lat: provider.userLat,
                  lng: provider.userLng,
                  name: ctrl.text.trim(),
                );
              }
              Navigator.pop(ctx);
            },
            child: const Text('Update'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hospitalProvider = context.watch<HospitalProvider>();
    final hospitals = hospitalProvider.hospitals;
    final isLoading = hospitalProvider.isLoading;

    return Scaffold(
      backgroundColor: AppTheme.surface,
      body: SafeArea(
        child: Column(
          children: [
            ClinicalHeader(
              title: 'Find Hospitals',
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
                      // Location Bar & Segmented Toggle
                      Row(
                        children: [
                          Expanded(
                            child: InkWell(
                              onTap: _showChangeLocationDialog,
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                height: 48,
                                padding: const EdgeInsets.symmetric(horizontal: 12),
                                decoration: BoxDecoration(
                                  color: AppTheme.surfaceContainerLow,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppTheme.outlineVariant, width: 0.5),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(
                                          Icons.location_on,
                                          color: AppTheme.primary,
                                          size: 20,
                                        ),
                                        const SizedBox(width: 8),
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            const Text(
                                              'Your Location',
                                              style: TextStyle(
                                                fontSize: 10,
                                                color: AppTheme.onSurfaceVariant,
                                              ),
                                            ),
                                            Text(
                                              hospitalProvider.locationName,
                                              style: const TextStyle(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w600,
                                                color: AppTheme.onSurface,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                    const Text(
                                      'Change',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: AppTheme.primary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Segmented View Toggle
                          Container(
                            height: 48,
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceContainerLow,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                _buildSegmentBtn(
                                  icon: Icons.format_list_bulleted,
                                  label: 'List',
                                  isActive: !_isMapView,
                                  onTap: () => setState(() => _isMapView = false),
                                ),
                                _buildSegmentBtn(
                                  icon: Icons.map,
                                  label: 'Map',
                                  isActive: _isMapView,
                                  onTap: () => setState(() => _isMapView = true),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),

                      // Quick Filter Pills Row
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            InkWell(
                              onTap: () => FilterBottomSheet.show(context),
                              borderRadius: BorderRadius.circular(9999),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                                decoration: BoxDecoration(
                                  color: AppTheme.primary,
                                  borderRadius: BorderRadius.circular(9999),
                                  boxShadow: AppTheme.cardShadow,
                                ),
                                child: const Row(
                                  children: [
                                    Icon(Icons.tune, color: Colors.white, size: 15),
                                    SizedBox(width: 6),
                                    Text(
                                      'Filters',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            _buildQuickFilterPill(
                              label: hospitalProvider.selectedRadiusKm != null
                                  ? '< ${hospitalProvider.selectedRadiusKm!.toInt()} km'
                                  : 'Any km',
                              isActive: hospitalProvider.selectedRadiusKm != null,
                              onTap: () {
                                if (hospitalProvider.selectedRadiusKm != null) {
                                  hospitalProvider.setRadius(null);
                                } else {
                                  hospitalProvider.setRadius(10);
                                }
                              },
                            ),
                            const SizedBox(width: 8),
                            _buildQuickFilterPill(
                              label: 'ICU Beds',
                              isActive: hospitalProvider.selectedCategory == 'ICU Beds',
                              onTap: () {
                                if (hospitalProvider.selectedCategory == 'ICU Beds') {
                                  hospitalProvider.setCategoryFilter('All');
                                } else {
                                  hospitalProvider.setCategoryFilter('ICU Beds');
                                }
                              },
                            ),
                            const SizedBox(width: 8),
                            _buildQuickFilterPill(
                              label: 'Open ER 24/7',
                              isActive: hospitalProvider.selectedCategory == 'Emergency 24/7',
                              onTap: () {
                                if (hospitalProvider.selectedCategory == 'Emergency 24/7') {
                                  hospitalProvider.setCategoryFilter('All');
                                } else {
                                  hospitalProvider.setCategoryFilter('Emergency 24/7');
                                }
                              },
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 12),

                      // Live Availability Notice Banner
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.surfaceContainerLow,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.outlineVariant, width: 0.5),
                        ),
                        child: const Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(Icons.info, color: AppTheme.primary, size: 18),
                            SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Live Availability Notice',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.onSurface,
                                    ),
                                  ),
                                  SizedBox(height: 2),
                                  Text(
                                    'Reported data is refreshed by verified hospital administrators. Availability may fluctuate during triage surges. Call ahead when possible.',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: AppTheme.onSurfaceVariant,
                                      height: 1.3,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // List / Map Content
                      if (isLoading)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 48),
                          child: Center(
                            child: CircularProgressIndicator(color: AppTheme.primary),
                          ),
                        )
                      else if (hospitals.isEmpty)
                        EmptyErrorView(
                          title: 'No Facilities Found',
                          description:
                              'No approved hospitals match your location and filters. Try widening your radius or clearing filters.',
                          buttonText: 'Reset Filters',
                          onRetry: () {
                            hospitalProvider.setRadius(null);
                            hospitalProvider.setCategoryFilter('All');
                            hospitalProvider.setSearchQuery('');
                          },
                        )
                      else if (_isMapView)
                        _buildMapOverview(hospitals)
                      else
                        ...hospitals.map((h) => _buildHospitalDiscoveryCard(context, h)),
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

  Widget _buildSegmentBtn({
    required IconData icon,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        height: 40,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          color: isActive ? AppTheme.surfaceContainerLowest : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          boxShadow: isActive ? AppTheme.cardShadow : null,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 16,
              color: isActive ? AppTheme.primary : AppTheme.onSurfaceVariant,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isActive ? AppTheme.primary : AppTheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickFilterPill({
    required String label,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(9999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isActive ? AppTheme.secondaryContainer.withValues(alpha: 0.2) : AppTheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(9999),
          border: Border.all(
            color: isActive ? AppTheme.secondary : AppTheme.outlineVariant,
            width: 0.5,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isActive ? AppTheme.secondary : AppTheme.onSurfaceVariant,
              ),
            ),
            if (isActive) ...[
              const SizedBox(width: 4),
              const Icon(Icons.close, size: 13, color: AppTheme.secondary),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildHospitalDiscoveryCard(BuildContext context, HospitalModel hospital) {
    final isSaved = context.watch<HospitalProvider>().isSaved(hospital.id);

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
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
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
                        Row(
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: AppTheme.statusAvailable,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Text(
                              'Live telemetry',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppTheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      hospital.name,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.onSurface,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.near_me, size: 14, color: AppTheme.primary),
                        const SizedBox(width: 4),
                        Text(
                          hospital.city.isNotEmpty ? hospital.city : 'Metro Area',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.onSurface,
                          ),
                        ),
                        const Text(' • ', style: TextStyle(color: AppTheme.outlineVariant)),
                        Text(
                          hospital.distanceFormatted,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppTheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => context.read<HospitalProvider>().toggleSave(hospital.id),
                icon: Icon(
                  isSaved ? Icons.bookmark : Icons.bookmark_border,
                  color: isSaved ? AppTheme.primary : AppTheme.outline,
                  size: 22,
                ),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Facility tags
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: hospital.capabilityTags.take(4).map((tag) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  tag,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.onSurfaceVariant,
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 12),

          // 3-Metric Capacity Grid
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.surfaceContainerLow,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceContainerLowest,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('General Ward', style: TextStyle(fontSize: 10, color: AppTheme.onSurfaceVariant)),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppTheme.statusAvailable, shape: BoxShape.circle)),
                            const SizedBox(width: 4),
                            Text(
                              '${hospital.totalAvailableBeds}',
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.onSurface),
                            ),
                            const SizedBox(width: 4),
                            const Text('Open', style: TextStyle(fontSize: 11, color: AppTheme.statusAvailableText)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceContainerLowest,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('ICU Beds', style: TextStyle(fontSize: 10, color: AppTheme.onSurfaceVariant)),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: BoxDecoration(
                                color: hospital.icuAvailable <= 3 ? AppTheme.statusEmergency : AppTheme.statusLimited,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${hospital.icuAvailable}',
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.onSurface),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              hospital.icuAvailable <= 3 ? 'Critical' : 'Limited',
                              style: TextStyle(
                                fontSize: 11,
                                color: hospital.icuAvailable <= 3 ? AppTheme.error : AppTheme.statusLimitedText,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceContainerLowest,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('ER Wait Est.', style: TextStyle(fontSize: 10, color: AppTheme.onSurfaceVariant)),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(Icons.schedule, size: 12, color: AppTheme.primary),
                            const SizedBox(width: 4),
                            Text(
                              hospital.erWaitEstimate,
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.onSurface),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Card Footer Actions
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.update, size: 13, color: AppTheme.tertiary),
                  SizedBox(width: 4),
                  Text(
                    'Updated recently',
                    style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
                  ),
                ],
              ),
              Row(
                children: [
                  InkWell(
                    onTap: () => _openMaps(hospital.latitude, hospital.longitude),
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceContainerLow,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Center(
                        child: Icon(Icons.directions, color: AppTheme.primary, size: 20),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
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
                      minimumSize: const Size(120, 42),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('View Details', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMapOverview(List<HospitalModel> hospitals) {
    return Container(
      height: 380,
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppTheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.outlineVariant, width: 0.5),
      ),
      child: Stack(
        children: [
          Positioned.fill(
            child: Opacity(
              opacity: 0.1,
              child: GridView.builder(
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 6,
                ),
                itemBuilder: (ctx, i) => Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: AppTheme.primary, width: 0.5),
                  ),
                ),
              ),
            ),
          ),
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.map_rounded, size: 48, color: AppTheme.primary),
                const SizedBox(height: 12),
                Text(
                  '${hospitals.length} Facilities in GPS Range',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.onSurface),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Geospatial mesh active. Tap below to navigate via Google Maps.',
                  style: TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () {
                    if (hospitals.isNotEmpty) {
                      _openMaps(hospitals.first.latitude, hospitals.first.longitude);
                    }
                  },
                  icon: const Icon(Icons.explore, size: 18),
                  label: const Text('Open in Map Navigation'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

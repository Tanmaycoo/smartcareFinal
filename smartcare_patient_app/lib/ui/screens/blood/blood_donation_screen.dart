import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/blood_bank_model.dart';
import '../../../data/models/blood_donor_model.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/blood_provider.dart';
import '../../../providers/hospital_provider.dart';
import '../../widgets/empty_error_view.dart';

class BloodDonationScreen extends StatefulWidget {
  const BloodDonationScreen({super.key});

  @override
  State<BloodDonationScreen> createState() => _BloodDonationScreenState();
}

class _BloodDonationScreenState extends State<BloodDonationScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  static const List<String> _bloodGroups = [
    'All',
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
  ];

  // Donor registration form state
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _cityCtrl = TextEditingController(text: 'Solapur');
  final _addressCtrl = TextEditingController();
  String _registerGroup = 'O+';
  bool _availableForEmergency = true;
  bool _isRegistering = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final bloodProv = context.read<BloodProvider>();
      final hospProv = context.read<HospitalProvider>();
      final authProv = context.read<AuthProvider>();

      if (authProv.user != null) {
        _nameCtrl.text = authProv.user!.name;
        _phoneCtrl.text = authProv.user!.phone ?? '';
      }

      bloodProv.setCoordinates(hospProv.userLat, hospProv.userLng);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _cityCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _makeCall(String phoneNumber) async {
    final cleanPhone = phoneNumber.replaceAll(RegExp(r'[^\d+]'), '');
    final uri = Uri.parse('tel:$cleanPhone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _submitDonorRegistration() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isRegistering = true);
    final bloodProv = context.read<BloodProvider>();

    final success = await bloodProv.registerDonor(
      donorName: _nameCtrl.text.trim(),
      bloodGroup: _registerGroup,
      contactPhone: _phoneCtrl.text.trim(),
      city: _cityCtrl.text.trim(),
      address: _addressCtrl.text.trim(),
      isAvailable: _availableForEmergency,
    );

    setState(() => _isRegistering = false);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF10B981),
            content: Text('Registered successfully as a voluntary blood donor!'),
          ),
        );
        _tabController.animateTo(1); // switch to donors list
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: AppTheme.error,
            content: Text('Registration failed. Please check network connection.'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bloodProv = context.watch<BloodProvider>();

    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        title: const Text(
          'Blood Bank & Donation',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppTheme.onSurface,
          ),
        ),
        backgroundColor: AppTheme.surfaceContainerLowest,
        elevation: 0,
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppTheme.primary),
            onPressed: () => bloodProv.fetchAll(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFFE11D48),
          indicatorWeight: 3,
          labelColor: const Color(0xFFE11D48),
          unselectedLabelColor: AppTheme.onSurfaceVariant,
          labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
          unselectedLabelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
          tabs: const [
            Tab(text: 'Blood Banks'),
            Tab(text: 'Nearby Donors'),
            Tab(text: 'Become Donor'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildBloodBanksTab(bloodProv),
          _buildDonorsTab(bloodProv),
          _buildRegisterDonorTab(),
        ],
      ),
    );
  }

  // ----------------------------------------------------
  // TAB 1: BLOOD BANKS & STOCK
  // ----------------------------------------------------
  Widget _buildBloodBanksTab(BloodProvider prov) {
    return Column(
      children: [
        _buildGroupFilterBar(prov),
        Expanded(
          child: RefreshIndicator(
            color: const Color(0xFFE11D48),
            onRefresh: () => prov.fetchBloodBanks(),
            child: prov.loadingBanks
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFFE11D48)),
                  )
                : prov.bankError != null
                    ? EmptyErrorView(
                        title: 'Unable to Load Blood Banks',
                        description: prov.bankError!,
                        buttonText: 'Retry',
                        onRetry: () => prov.fetchBloodBanks(),
                      )
                    : prov.bloodBanks.isEmpty
                        ? EmptyErrorView(
                            title: 'No Blood Banks Found',
                            description: prov.selectedBloodGroup != 'All'
                                ? 'No blood banks currently have stock for ${prov.selectedBloodGroup}.'
                                : 'No active blood banks detected nearby.',
                            buttonText: 'Show All Blood Banks',
                            onRetry: () {
                              prov.setSelectedBloodGroup('All');
                              prov.setRadius(null);
                              prov.fetchBloodBanks();
                            },
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: prov.bloodBanks.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, idx) {
                              final bank = prov.bloodBanks[idx];
                              return _buildBloodBankCard(bank, prov.selectedBloodGroup);
                            },
                          ),
          ),
        ),
      ],
    );
  }

  Widget _buildBloodBankCard(BloodBank bank, String selectedGroup) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF1F2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: Icon(
                    Icons.local_hospital_outlined,
                    color: Color(0xFFE11D48),
                    size: 24,
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
                        Expanded(
                          child: Text(
                            bank.name,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.onSurface,
                            ),
                          ),
                        ),
                        if (bank.isVerified)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFECFDF5),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: const Color(0xFFA7F3D0)),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.verified, size: 11, color: Color(0xFF10B981)),
                                SizedBox(width: 3),
                                Text(
                                  'Accredited',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF047857),
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 13, color: AppTheme.onSurfaceVariant),
                        const SizedBox(width: 3),
                        Expanded(
                          child: Text(
                            '${bank.city}, ${bank.state}',
                            style: const TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (bank.distanceKm != null) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceContainerHigh,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              '${bank.distanceKm!.toStringAsFixed(1)} km',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primary,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Inventory Stock Badges Grid
          const Text(
            'Live Inventory Stock (Units)',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppTheme.onSurfaceVariant,
              letterSpacing: 0.3,
            ),
          ),
          const SizedBox(height: 8),

          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
            ].map((grp) {
              final stock = bank.getStockForGroup(grp);
              final isMatch = selectedGroup == grp;
              final hasStock = stock > 0;

              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isMatch
                      ? const Color(0xFFE11D48)
                      : hasStock
                          ? const Color(0xFFFFF1F2)
                          : AppTheme.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: isMatch
                        ? const Color(0xFFE11D48)
                        : hasStock
                            ? const Color(0xFFFECDD3)
                            : AppTheme.outlineVariant.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      grp,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: isMatch
                            ? Colors.white
                            : hasStock
                                ? const Color(0xFFBE123C)
                                : AppTheme.outline,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '$stock',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: isMatch
                            ? Colors.white
                            : hasStock
                                ? const Color(0xFF881337)
                                : AppTheme.outline,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 14),

          // Action row
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _makeCall(bank.contactPhone),
                  icon: const Icon(Icons.phone, size: 16, color: Color(0xFFE11D48)),
                  label: Text(
                    'Call Bank (${bank.contactPhone})',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFFE11D48),
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFFDA4AF)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ----------------------------------------------------
  // TAB 2: NEARBY VOLUNTARY DONORS
  // ----------------------------------------------------
  Widget _buildDonorsTab(BloodProvider prov) {
    return Column(
      children: [
        _buildGroupFilterBar(prov),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          color: const Color(0xFFFFFBEB),
          child: const Row(
            children: [
              Icon(Icons.info_outline, size: 16, color: Color(0xFFB45309)),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Showing voluntary donors sorted by distance and blood group compatibility.',
                  style: TextStyle(fontSize: 11, color: Color(0xFF92400E)),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            color: const Color(0xFFE11D48),
            onRefresh: () => prov.fetchDonors(),
            child: prov.loadingDonors
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFFE11D48)),
                  )
                : prov.donorError != null
                    ? EmptyErrorView(
                        title: 'Unable to Load Donors',
                        description: prov.donorError!,
                        buttonText: 'Retry',
                        onRetry: () => prov.fetchDonors(),
                      )
                    : prov.donors.isEmpty
                        ? EmptyErrorView(
                            title: 'No Donors Found',
                            description: 'No registered voluntary donors found nearby for this group.',
                            buttonText: 'Show All Donors',
                            onRetry: () => prov.setSelectedBloodGroup('All'),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: prov.donors.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (context, idx) {
                              final donor = prov.donors[idx];
                              return _buildDonorCard(donor);
                            },
                          ),
          ),
        ),
      ],
    );
  }

  Widget _buildDonorCard(BloodDonor donor) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(14),
        boxShadow: AppTheme.cardShadow,
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFFFFF1F2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFECDD3)),
            ),
            child: Center(
              child: Text(
                donor.bloodGroup,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFFE11D48),
                ),
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
                    Expanded(
                      child: Text(
                        donor.donorName,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.onSurface,
                        ),
                      ),
                    ),
                    if (donor.isAvailableForEmergency)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'Available',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF047857),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 12, color: AppTheme.onSurfaceVariant),
                    const SizedBox(width: 3),
                    Text(
                      donor.city,
                      style: const TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant),
                    ),
                    if (donor.distanceKm != null) ...[
                      const SizedBox(width: 8),
                      Text(
                        '• ${donor.distanceKm!.toStringAsFixed(1)} km away',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primary,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          IconButton.filled(
            onPressed: () => _makeCall(donor.contactPhone),
            icon: const Icon(Icons.phone, size: 18),
            style: IconButton.styleFrom(
              backgroundColor: const Color(0xFFE11D48),
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  // ----------------------------------------------------
  // TAB 3: REGISTER AS VOLUNTARY DONOR
  // ----------------------------------------------------
  Widget _buildRegisterDonorTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFE11D48), Color(0xFFBE123C)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.volunteer_activism, color: Colors.white, size: 24),
                      SizedBox(width: 8),
                      Text(
                        'Save Lives Nearby',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Register as an emergency voluntary donor. Nearby hospitals and patients in critical condition can contact you when urgent blood matches are required.',
                    style: TextStyle(fontSize: 12, color: Colors.white70, height: 1.4),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            const Text(
              'Your Blood Group',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.onSurface),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
              ].map((grp) {
                final isSelected = _registerGroup == grp;
                return ChoiceChip(
                  label: Text(grp),
                  selected: isSelected,
                  selectedColor: const Color(0xFFE11D48),
                  backgroundColor: AppTheme.surfaceContainerLow,
                  labelStyle: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: isSelected ? Colors.white : AppTheme.onSurface,
                  ),
                  onSelected: (val) {
                    if (val) setState(() => _registerGroup = grp);
                  },
                );
              }).toList(),
            ),

            const SizedBox(height: 16),

            const Text(
              'Full Name',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.onSurface),
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _nameCtrl,
              decoration: InputDecoration(
                hintText: 'Enter full name',
                prefixIcon: const Icon(Icons.person_outline, size: 20),
                filled: true,
                fillColor: AppTheme.surfaceContainerLow,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide.none,
                ),
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Please enter name' : null,
            ),

            const SizedBox(height: 16),

            const Text(
              'Contact Phone Number',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.onSurface),
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                hintText: '+91 98765 43210',
                prefixIcon: const Icon(Icons.phone_outlined, size: 20),
                filled: true,
                fillColor: AppTheme.surfaceContainerLow,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide.none,
                ),
              ),
              validator: (v) => (v == null || v.trim().length < 8) ? 'Enter valid phone number' : null,
            ),

            const SizedBox(height: 16),

            const Text(
              'City / Region',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.onSurface),
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _cityCtrl,
              decoration: InputDecoration(
                hintText: 'e.g. Solapur, Pune',
                prefixIcon: const Icon(Icons.location_city, size: 20),
                filled: true,
                fillColor: AppTheme.surfaceContainerLow,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide.none,
                ),
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Please enter city' : null,
            ),

            const SizedBox(height: 16),

            const Text(
              'Address / Landmark (Optional)',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.onSurface),
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _addressCtrl,
              decoration: InputDecoration(
                hintText: 'e.g. Near Civil Hospital, Station Road',
                prefixIcon: const Icon(Icons.map_outlined, size: 20),
                filled: true,
                fillColor: AppTheme.surfaceContainerLow,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide.none,
                ),
              ),
            ),

            const SizedBox(height: 16),

            SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              value: _availableForEmergency,
              activeTrackColor: const Color(0xFFE11D48),
              title: const Text(
                'Available for Emergency Requests',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
              ),
              subtitle: const Text(
                'Allow verified hospitals to see your contact during urgent blood emergencies',
                style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
              ),
              onChanged: (val) => setState(() => _availableForEmergency = val),
            ),

            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _isRegistering ? null : _submitDonorRegistration,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE11D48),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: _isRegistering
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Text(
                        'Register as Voluntary Donor',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Group filter bar helper
  Widget _buildGroupFilterBar(BloodProvider prov) {
    return Container(
      height: 52,
      padding: const EdgeInsets.symmetric(vertical: 8),
      color: AppTheme.surfaceContainerLowest,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        itemCount: _bloodGroups.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, idx) {
          final grp = _bloodGroups[idx];
          final isSelected = prov.selectedBloodGroup == grp;

          return FilterChip(
            label: Text(grp),
            selected: isSelected,
            selectedColor: const Color(0xFFE11D48),
            backgroundColor: AppTheme.surfaceContainerLow,
            labelStyle: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isSelected ? Colors.white : AppTheme.onSurface,
            ),
            showCheckmark: false,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(
                color: isSelected
                    ? const Color(0xFFE11D48)
                    : AppTheme.outlineVariant.withValues(alpha: 0.3),
              ),
            ),
            onSelected: (_) => prov.setSelectedBloodGroup(grp),
          );
        },
      ),
    );
  }
}

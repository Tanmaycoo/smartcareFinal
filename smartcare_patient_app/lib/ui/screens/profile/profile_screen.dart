import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/config/app_config.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/services/api_client.dart';
import '../../../data/services/storage_service.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/hospital_provider.dart';
import '../../widgets/clinical_header.dart';
import '../auth/login_screen.dart';
import '../auth/register_screen.dart';
import '../billing/my_bills_screen.dart';
import '../pricing/pricing_services_screen.dart';
import '../pricing/cost_estimation_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  void _showServerConfigDialog(BuildContext context) {
    final storage = context.read<StorageService>();
    final currentHost = storage.getCustomApiHost() ?? AppConfig.baseUrl;
    final ctrl = TextEditingController(text: currentHost);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceContainerLowest,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Backend API Host', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Select a preset or enter the IP address of your FastAPI backend:',
              style: TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: ctrl,
              decoration: const InputDecoration(
                labelText: 'API Base URL',
                hintText: 'http://10.211.56.163:8001/api',
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                ActionChip(
                  label: const Text('Wi-Fi LAN', style: TextStyle(fontSize: 11)),
                  onPressed: () => ctrl.text = AppConfig.defaultWifiHost,
                ),
                ActionChip(
                  label: const Text('Android Emu', style: TextStyle(fontSize: 11)),
                  onPressed: () => ctrl.text = AppConfig.defaultEmulatorHost,
                ),
                ActionChip(
                  label: const Text('Localhost', style: TextStyle(fontSize: 11)),
                  onPressed: () => ctrl.text = AppConfig.defaultLocalhost,
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final newUrl = ctrl.text.trim();
              if (newUrl.isNotEmpty) {
                await storage.setCustomApiHost(newUrl);
                AppConfig.setCustomBaseUrl(newUrl);
                if (context.mounted) {
                  context.read<HospitalProvider>().fetchHospitals();
                }
              }
              if (!context.mounted) return;
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('API Server configuration updated')),
              );
            },
            child: const Text('Save & Reconnect'),
          ),
        ],
      ),
    );
  }

  Future<void> _testConnection(BuildContext context) async {
    final client = context.read<ApiClient>();
    try {
      final res = await client.get('/hospitals');
      if (context.mounted) {
        final count = res is List ? res.length : 0;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Connected to FastAPI! $count approved facilities active.'),
            backgroundColor: AppTheme.statusAvailable,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Connection failed: $e'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final storage = context.watch<StorageService>();
    final currentHost = storage.getCustomApiHost() ?? AppConfig.baseUrl;

    return Scaffold(
      backgroundColor: AppTheme.surface,
      body: SafeArea(
        child: Column(
          children: [
            const ClinicalHeader(title: 'Patient Profile'),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Profile Header Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceContainerLowest,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: AppTheme.cardShadow,
                      ),
                      child: user != null
                          ? Row(
                              children: [
                                Container(
                                  width: 56,
                                  height: 56,
                                  decoration: const BoxDecoration(
                                    color: AppTheme.primaryFixed,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Center(
                                    child: Text(
                                      user.name.isNotEmpty ? user.name[0].toUpperCase() : 'P',
                                      style: const TextStyle(
                                        fontSize: 22,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.primary,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        user.name,
                                        style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                          color: AppTheme.onSurface,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        user.email,
                                        style: const TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant),
                                      ),
                                      if (user.phone != null) ...[
                                        const SizedBox(height: 2),
                                        Text(
                                          user.phone!,
                                          style: const TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant),
                                        ),
                                      ],
                                      const SizedBox(height: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppTheme.tertiaryFixed.withValues(alpha: 0.3),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Text(
                                          'PATIENT MEMBER',
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: AppTheme.onTertiaryFixedVariant,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            )
                          : Column(
                              children: [
                                const Text(
                                  'Sign In to SmartCare',
                                  style: TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.onSurface,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Sign in to manage your medical identity, fast-track emergency tickets, and sync preferences.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant),
                                ),
                                const SizedBox(height: 14),
                                Row(
                                  children: [
                                    Expanded(
                                      child: ElevatedButton(
                                        onPressed: () {
                                          Navigator.of(context).push(
                                            MaterialPageRoute(builder: (_) => const LoginScreen()),
                                          );
                                        },
                                        child: const Text('Sign In'),
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: OutlinedButton(
                                        onPressed: () {
                                          Navigator.of(context).push(
                                            MaterialPageRoute(builder: (_) => const RegisterScreen()),
                                          );
                                        },
                                        child: const Text('Register'),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                    ),

                    const SizedBox(height: 16),

                    // Healthcare Financials & Billing
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
                          const Row(
                            children: [
                              Icon(Icons.account_balance_wallet_outlined, color: AppTheme.primary, size: 20),
                              SizedBox(width: 8),
                              Text(
                                'Pricing, Bills & Estimates',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.onSurface,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),

                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryFixed,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.receipt_long, color: AppTheme.primary, size: 20),
                            ),
                            title: const Text('My Medical Bills', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                            subtitle: const Text('View and track hospital invoices and receipts', style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant)),
                            trailing: const Icon(Icons.chevron_right, size: 20, color: AppTheme.outline),
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => const MyBillsScreen()),
                              );
                            },
                          ),
                          const Divider(height: 16, color: AppTheme.outlineVariant),

                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppTheme.tertiaryFixed,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.calculate_outlined, color: AppTheme.tertiary, size: 20),
                            ),
                            title: const Text('Cost Estimation Calculator', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                            subtitle: const Text('Estimate hospital treatment and room expenses', style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant)),
                            trailing: const Icon(Icons.chevron_right, size: 20, color: AppTheme.outline),
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => const CostEstimationScreen()),
                              );
                            },
                          ),
                          const Divider(height: 16, color: AppTheme.outlineVariant),

                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppTheme.secondaryContainer.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.sell_outlined, color: AppTheme.secondary, size: 20),
                            ),
                            title: const Text('Hospital Tariffs & Rates', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                            subtitle: const Text('Search and compare rates across all hospitals', style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant)),
                            trailing: const Icon(Icons.chevron_right, size: 20, color: AppTheme.outline),
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => const PricingServicesScreen()),
                              );
                            },
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Network Configuration Tile
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
                          const Row(
                            children: [
                              Icon(Icons.hub_outlined, color: AppTheme.primary, size: 20),
                              SizedBox(width: 8),
                              Text(
                                'SmartCare Network Node',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.onSurface,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Active Backend Host:\n$currentHost',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.onSurfaceVariant,
                              fontFamily: 'monospace',
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              OutlinedButton.icon(
                                onPressed: () => _showServerConfigDialog(context),
                                icon: const Icon(Icons.settings_ethernet, size: 16),
                                label: const Text('Change Host'),
                                style: OutlinedButton.styleFrom(
                                  minimumSize: const Size(0, 38),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                              ),
                              const SizedBox(width: 8),
                              ElevatedButton.icon(
                                onPressed: () => _testConnection(context),
                                icon: const Icon(Icons.network_check, size: 16),
                                label: const Text('Test Ping'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.surfaceContainerLow,
                                  foregroundColor: AppTheme.primary,
                                  minimumSize: const Size(0, 38),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),



                    const SizedBox(height: 16),

                    // Healthcare Platform Info Tile
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceContainerLowest,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: AppTheme.cardShadow,
                      ),
                      child: const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.shield_outlined, color: AppTheme.tertiary, size: 20),
                              SizedBox(width: 8),
                              Text(
                                'Clinical Data Security',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.onSurface),
                              ),
                            ],
                          ),
                          SizedBox(height: 8),
                          Text(
                            'SmartCare connects directly to authorized hospital dispatch systems via secure encrypted protocols. Triage allocations are reviewed by certified hospital administration in accordance with national health regulations.',
                            style: TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant, height: 1.4),
                          ),
                        ],
                      ),
                    ),

                    if (user != null) ...[
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: () => auth.logout(),
                        icon: const Icon(Icons.logout, size: 18),
                        label: const Text('Sign Out of Account'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.surfaceContainerLow,
                          foregroundColor: AppTheme.error,
                          minimumSize: const Size(double.infinity, 48),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

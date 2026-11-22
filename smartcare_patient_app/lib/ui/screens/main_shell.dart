import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import 'blood/blood_donation_screen.dart';
import 'discovery/find_hospitals_screen.dart';
import 'home/home_screen.dart';
import 'profile/profile_screen.dart';
import 'tracking/ticket_tracking_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  void _navigateToTab(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeScreen(
        onNavigateToFind: () => _navigateToTab(1),
        onProfileTap: () => _navigateToTab(4),
        onNavigateToBlood: () => _navigateToTab(2),
      ),
      FindHospitalsScreen(
        onProfileTap: () => _navigateToTab(4),
      ),
      const BloodDonationScreen(),
      TicketTrackingScreen(
        onProfileTap: () => _navigateToTab(4),
      ),
      const ProfileScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppTheme.surfaceContainerLowest,
          border: const Border(
            top: BorderSide(color: AppTheme.outlineVariant, width: 0.5),
          ),
          boxShadow: AppTheme.cardShadow,
        ),
        child: SafeArea(
          child: SizedBox(
            height: 60,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(
                  index: 0,
                  icon: Icons.domain_outlined,
                  activeIcon: Icons.domain,
                  label: 'Home',
                ),
                _buildNavItem(
                  index: 1,
                  icon: Icons.local_hospital_outlined,
                  activeIcon: Icons.local_hospital,
                  label: 'Hospitals',
                ),
                _buildNavItem(
                  index: 2,
                  icon: Icons.bloodtype_outlined,
                  activeIcon: Icons.bloodtype,
                  activeColor: const Color(0xFFE11D48),
                  label: 'Blood Bank',
                ),
                _buildNavItem(
                  index: 3,
                  icon: Icons.confirmation_number_outlined,
                  activeIcon: Icons.confirmation_number,
                  label: 'Track',
                ),
                _buildNavItem(
                  index: 4,
                  icon: Icons.person_outline,
                  activeIcon: Icons.person,
                  label: 'Profile',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required int index,
    required IconData icon,
    required IconData activeIcon,
    required String label,
    Color? activeColor,
  }) {
    final isSelected = _currentIndex == index;
    final color = isSelected ? (activeColor ?? AppTheme.primary) : AppTheme.onSurfaceVariant;

    return Expanded(
      child: InkWell(
        onTap: () => _navigateToTab(index),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isSelected ? activeIcon : icon,
              color: color,
              size: 22,
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

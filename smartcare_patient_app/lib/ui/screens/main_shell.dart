import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
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
        onProfileTap: () => _navigateToTab(3),
      ),
      FindHospitalsScreen(
        onProfileTap: () => _navigateToTab(3),
      ),
      TicketTrackingScreen(
        onProfileTap: () => _navigateToTab(3),
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
                  label: 'Find Hospitals',
                ),
                _buildNavItem(
                  index: 2,
                  icon: Icons.confirmation_number_outlined,
                  activeIcon: Icons.confirmation_number,
                  label: 'Saved & Track',
                ),
                _buildNavItem(
                  index: 3,
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
  }) {
    final isSelected = _currentIndex == index;
    final color = isSelected ? AppTheme.primary : AppTheme.onSurfaceVariant;

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

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'config/api_config.dart';

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  bool _isLoading = false;

  Future<void> _upgradeToPremium() async {
    setState(() => _isLoading = true);
    try {
      final token = await ApiConfig.getToken();
      if (token == null) return;

      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/profiles/upgrade'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Successfully upgraded to Premium! 🎉')));
        Navigator.pop(context);
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to upgrade.')));
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Network error.')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF120B1C),
      appBar: AppBar(
        title: const Text('JobHub Premium', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const Text(
              'Unlock Your Career Potential',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 16),
            const Text(
              'JobHub AI Premium gives you unlimited access to our powerful AI tools to land your dream job faster.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontSize: 16),
            ),
            const SizedBox(height: 48),

            // Premium Card
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFF00F0FF)),
                boxShadow: [
                  BoxShadow(color: const Color(0xFF00F0FF).withOpacity(0.2), blurRadius: 30, spreadRadius: -5),
                ],
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    decoration: BoxDecoration(color: const Color(0xFF00F0FF), borderRadius: BorderRadius.circular(20)),
                    child: const Text('RECOMMENDED', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                  const SizedBox(height: 16),
                  const Text('Premium', style: TextStyle(color: Color(0xFF00F0FF), fontSize: 24, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('₦5,000', style: TextStyle(color: Colors.white, fontSize: 40, fontWeight: FontWeight.bold)),
                      Padding(padding: EdgeInsets.only(bottom: 8.0), child: Text('/mo', style: TextStyle(color: Colors.white54, fontSize: 16))),
                    ],
                  ),
                  const SizedBox(height: 24),
                  _buildFeature('✨ Unlimited AI Resume Builder'),
                  _buildFeature('✨ Unlimited AI Cover Letters'),
                  _buildFeature('✨ Unlimited AI Match Scoring'),
                  _buildFeature('✨ Priority Applicant Ranking'),
                  _buildFeature('✨ Verified Profile Badge Options'),
                  _buildFeature('✨ Advanced Career Coaching Insights'),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _upgradeToPremium,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6366F1),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: _isLoading 
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text('Upgrade Now', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeature(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          const Icon(Icons.check_circle, color: Color(0xFF00F0FF), size: 20),
          const SizedBox(width: 12),
          Expanded(child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 14))),
        ],
      ),
    );
  }
}

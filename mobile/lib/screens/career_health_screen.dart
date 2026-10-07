import 'package:flutter/material.dart';
import '../../widgets/glass_card.dart';

class CareerHealthScreen extends StatelessWidget {
  const CareerHealthScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Mock Data based on the AI Health Score design
    const int score = 89;
    const int stars = 5;
    final strengths = ['Strong Experience', 'Excellent Resume', 'Verified Skills'];
    final improvements = ['Leadership Certification', 'Cloud Computing', 'Portfolio'];
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('AI Career Health'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Hero(
              tag: 'health-score-card',
              child: GlassCard(
                padding: const EdgeInsets.all(32),
                child: Column(
                  children: [
                    const Text(
                      'CAREER SCORE',
                      style: TextStyle(color: Colors.grey, fontSize: 14, letterSpacing: 2, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          '$score',
                          style: TextStyle(fontSize: 72, fontWeight: FontWeight.w900, color: isDark ? Colors.white : Colors.black),
                        ),
                        Text(
                          '/100',
                          style: TextStyle(fontSize: 24, color: isDark ? Colors.white.withOpacity(0.5) : Colors.black54),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        return Icon(
                          index < stars ? Icons.star : Icons.star_border,
                          color: Colors.yellowAccent,
                          size: 32,
                        );
                      }),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),
            _buildSectionTitle('Strengths', Colors.greenAccent),
            const SizedBox(height: 16),
            ...strengths.map((s) => _buildListItem(s, Icons.check_circle, Colors.greenAccent)).toList(),
            const SizedBox(height: 32),
            _buildSectionTitle('Needs Improvement', Colors.grey),
            const SizedBox(height: 16),
            ...improvements.map((i) => _buildListItem(i, Icons.radio_button_unchecked, Colors.grey)).toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, Color color) {
    return Row(
      children: [
        Expanded(child: Divider(color: color.withOpacity(0.3))),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Text(
            title,
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
          ),
        ),
        Expanded(child: Divider(color: color.withOpacity(0.3))),
      ],
    );
  }

  Widget _buildListItem(String text, IconData icon, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 16, color: Colors.white70),
            ),
          ),
        ],
      ),
    );
  }
}

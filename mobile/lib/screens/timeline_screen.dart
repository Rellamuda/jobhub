import 'package:flutter/material.dart';
import '../../widgets/glass_card.dart';

class TimelineScreen extends StatelessWidget {
  const TimelineScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final timeline = [
      {'type': 'PROMOTION', 'title': 'Senior Software Engineer', 'org': 'Tech Innovators', 'date': 'Jan 2024 - Present', 'icon': Icons.trending_up, 'color': Colors.green},
      {'type': 'PROJECT', 'title': 'Global Payment Gateway', 'org': 'Open Source', 'date': 'Nov 2023', 'icon': Icons.code, 'color': Colors.purple},
      {'type': 'WORK', 'title': 'Software Engineer', 'org': 'Tech Innovators', 'date': 'Mar 2021 - Dec 2023', 'icon': Icons.work, 'color': Colors.blue},
      {'type': 'CERT', 'title': 'AWS Solutions Architect', 'org': 'Amazon', 'date': 'Aug 2023', 'icon': Icons.workspace_premium, 'color': Colors.yellow},
      {'type': 'EDUCATION', 'title': 'B.Sc. Computer Science', 'org': 'Stanford University', 'date': '2016 - 2020', 'icon': Icons.school, 'color': Colors.red},
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF120B1C),
      appBar: AppBar(
        title: const Text('Career Timeline'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(24.0),
        itemCount: timeline.length,
        itemBuilder: (context, index) {
          final event = timeline[index];
          final bool isLast = index == timeline.length - 1;

          return IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: event['color'] as Color,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(event['icon'] as IconData, color: Colors.white, size: 20),
                    ),
                    if (!isLast)
                      Expanded(
                        child: Container(
                          width: 2,
                          color: Colors.white.withOpacity(0.2),
                        ),
                      )
                    else
                      const SizedBox(height: 40),
                  ],
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: GlassCard(
                    margin: const EdgeInsets.only(bottom: 32),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          event['date'] as String,
                          style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          event['title'] as String,
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          event['org'] as String,
                          style: const TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

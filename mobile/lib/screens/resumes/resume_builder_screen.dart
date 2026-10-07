import 'package:flutter/material.dart';

class ResumeBuilderScreen extends StatefulWidget {
  final Map<String, dynamic>? initialData;

  ResumeBuilderScreen({this.initialData});

  @override
  _ResumeBuilderScreenState createState() => _ResumeBuilderScreenState();
}

class _ResumeBuilderScreenState extends State<ResumeBuilderScreen> {
  final _titleController = TextEditingController(text: 'Untitled Resume');
  final _summaryController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.initialData != null) {
      _titleController.text = widget.initialData!['title'] ?? 'Untitled Resume';
      _summaryController.text = widget.initialData!['summary'] ?? '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('CV Builder'),
        actions: [
          IconButton(
            icon: Icon(Icons.save),
            onPressed: () {
              // Save logic using ResumeService
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Saved Successfully')));
              Navigator.pop(context);
            },
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _titleController,
              decoration: InputDecoration(labelText: 'Resume Title'),
            ),
            SizedBox(height: 16),
            TextField(
              controller: _summaryController,
              maxLines: 4,
              decoration: InputDecoration(labelText: 'Professional Summary', border: OutlineInputBorder()),
            ),
            SizedBox(height: 24),
            Text('To add experience/education, please use the web dashboard for a full WYSIWYG experience.', style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}

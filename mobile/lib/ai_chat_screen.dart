import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'config/api_config.dart';

class AiChatScreen extends StatefulWidget {
  const AiChatScreen({super.key});

  @override
  State<AiChatScreen> createState() => _AiChatScreenState();
}

class _ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;

  _ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
  });
}

class _AiChatScreenState extends State<AiChatScreen> {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<_ChatMessage> _messages = [];
  bool _isLoading = false;

  final List<String> _suggestedPrompts = [
    'How can I improve my resume for my target role?',
    'Give me 3 mock interview questions with STAR answers',
    'Tips for negotiating a higher contract or salary rate',
    'How do I bid on B2B contracts in Contractor Mode?',
    'What certifications are most valuable for career growth?',
  ];

  @override
  void initState() {
    super.initState();
    _messages.add(
      _ChatMessage(
        text: "Hello! I am your JobHub AI Career & Professional Assistant. Ask me anything about job hunting, resume optimization, interview coaching, contract bidding, or any topic of interest!",
        isUser: false,
        timestamp: DateTime.now(),
      ),
    );
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage(String messageText) async {
    final text = messageText.trim();
    if (text.isEmpty || _isLoading) return;

    _inputController.clear();
    setState(() {
      _messages.add(_ChatMessage(text: text, isUser: true, timestamp: DateTime.now()));
      _isLoading = true;
    });
    _scrollToBottom();

    try {
      final token = await ApiConfig.getToken();
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      if (token != null) headers['Authorization'] = 'Bearer $token';

      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/ai/mentor/chat'),
        headers: headers,
        body: jsonEncode({'message': text}),
      );

      String replyText = "I'm having trouble connecting right now. Please try again shortly.";
      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = jsonDecode(res.body);
        replyText = data['reply'] ?? data['response'] ?? data['message'] ?? replyText;
      } else {
        try {
          final errData = jsonDecode(res.body);
          if (errData['reply'] != null) {
            replyText = errData['reply'];
          }
        } catch (_) {}
      }

      if (mounted) {
        setState(() {
          _messages.add(_ChatMessage(text: replyText, isUser: false, timestamp: DateTime.now()));
          _isLoading = false;
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _messages.add(
            _ChatMessage(
              text: "I'm your JobHub AI Assistant. I can help with resume review, interview practice, salary advice, and career transitions. Could you please rephrase your question?",
              isUser: false,
              timestamp: DateTime.now(),
            ),
          );
          _isLoading = false;
        });
        _scrollToBottom();
      }
    }
  }

  void _clearChat() {
    setState(() {
      _messages.clear();
      _messages.add(
        _ChatMessage(
          text: "Chat cleared! What topic would you like to explore or practice today?",
          isUser: false,
          timestamp: DateTime.now(),
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0A0A0A) : const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF00F0FF)]),
              ),
              child: const Icon(Icons.auto_awesome, color: Colors.black, size: 18),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('JobHub AI Chat', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                Text('Career, Contracts & Advisory', style: TextStyle(fontSize: 11, color: Colors.white54)),
              ],
            ),
          ],
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.cleaning_services_outlined, size: 20),
            tooltip: 'Clear Chat',
            onPressed: _clearChat,
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Suggested chips
            SizedBox(
              height: 44,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                itemCount: _suggestedPrompts.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final prompt = _suggestedPrompts[index];
                  return ActionChip(
                    label: Text(
                      prompt,
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? const Color(0xFF00F0FF) : const Color(0xFF6366F1),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    backgroundColor: isDark ? Colors.white.withOpacity(0.06) : Colors.indigo.shade50,
                    side: BorderSide(
                      color: isDark ? const Color(0xFF00F0FF).withOpacity(0.3) : const Color(0xFF6366F1).withOpacity(0.3),
                    ),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    onPressed: () => _sendMessage(prompt),
                  );
                },
              ),
            ),
            const Divider(height: 1, color: Colors.white12),

            // Message list
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                itemCount: _messages.length,
                itemBuilder: (context, index) {
                  final msg = _messages[index];
                  return _buildMessageBubble(msg, isDark);
                },
              ),
            ),

            if (_isLoading)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                alignment: Alignment.centerLeft,
                child: Row(
                  children: [
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF00F0FF)),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'AI Assistant is thinking...',
                      style: TextStyle(color: isDark ? Colors.white54 : Colors.black45, fontSize: 12),
                    ),
                  ],
                ),
              ),

            // Text input row
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF141414) : Colors.white,
                border: Border(top: BorderSide(color: isDark ? Colors.white12 : Colors.black12)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _inputController,
                      minLines: 1,
                      maxLines: 4,
                      style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Ask anything (career, interview, resume, contracts)...',
                        hintStyle: TextStyle(color: isDark ? Colors.white38 : Colors.black38, fontSize: 13),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      onSubmitted: _sendMessage,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.send_rounded, color: Color(0xFF00F0FF)),
                    onPressed: () => _sendMessage(_inputController.text),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(_ChatMessage msg, bool isDark) {
    return Align(
      alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.82),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: msg.isUser
              ? const Color(0xFF6366F1)
              : (isDark ? const Color(0xFF1E1E2C) : Colors.white),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: msg.isUser ? const Radius.circular(16) : const Radius.circular(4),
            bottomRight: msg.isUser ? const Radius.circular(4) : const Radius.circular(16),
          ),
          border: Border.all(
            color: msg.isUser
                ? Colors.transparent
                : (isDark ? Colors.white12 : Colors.black12),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: SelectableText(
          msg.text,
          style: TextStyle(
            color: msg.isUser
                ? Colors.white
                : (isDark ? Colors.white.withOpacity(0.92) : Colors.black87),
            fontSize: 14,
            height: 1.45,
          ),
        ),
      ),
    );
  }
}

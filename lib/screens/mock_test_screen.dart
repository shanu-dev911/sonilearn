import 'dart:async';
import 'package:flutter/material.dart';

class MockTestScreen extends StatefulWidget {
  const MockTestScreen({super.key});

  @override
  _MockTestScreenState createState() => _MockTestScreenState();
}

class _MockTestScreenState extends State<MockTestScreen> {
  int _timeLeft = 3600; // 60 Minutes
  int _currentQuestion = 1;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeLeft > 0) {
        setState(() => _timeLeft--);
      } else {
        _timer?.cancel();
      }
    });
  }

  String _formatTime(int seconds) {
    int mins = seconds ~/ 60;
    int secs = seconds % 60;
    return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("BSSC Live Mock Test", style: TextStyle(color: Colors.white, fontSize: 18)),
        backgroundColor: const Color(0xFF1A237E), // Dark Blue (Testbook style)
        actions: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 8),
            margin: const EdgeInsets.only(right: 10),
            decoration: BoxDecoration(
              color: Colors.orange.shade800,
              borderRadius: BorderRadius.circular(5),
            ),
            child: Center(
              child: Text(
                "Time: ${_formatTime(_timeLeft)}",
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
          )
        ],
      ),
      body: Row(
        children: [
          // Left Side: Question Area
          Expanded(
            flex: 3,
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Question $_currentQuestion of 20", 
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.blueGrey)),
                  const Divider(),
                  const SizedBox(height: 20),
                  const Text(
                    "Bharat ke vartaman Rashtrapati kaun hain?", 
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 30),
                  _buildOption("A", "Droupadi Murmu"),
                  _buildOption("B", "Narendra Modi"),
                  _buildOption("C", "Amit Shah"),
                  _buildOption("D", "Rajnath Singh"),
                  const Spacer(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      OutlinedButton(onPressed: () {}, child: const Text("Mark for Review")),
                      ElevatedButton(
                        onPressed: () {
                          setState(() { if(_currentQuestion < 20) _currentQuestion++; });
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.green.shade700),
                        child: const Text("Save & Next", style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  )
                ],
              ),
            ),
          ),
          // Right Side: Question Palette (Testbook Style)
          Container(
            width: 120,
            color: Colors.grey.shade100,
            child: Column(
              children: [
                const Padding(
                  padding: EdgeInsets.all(8.0),
                  child: Text("Palette", style: TextStyle(fontWeight: FontWeight.bold)),
                ),
                Expanded(
                  child: GridView.builder(
                    padding: const EdgeInsets.all(8),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3, mainAxisSpacing: 5, crossAxisSpacing: 5),
                    itemCount: 20,
                    itemBuilder: (context, index) {
                      return Container(
                        decoration: BoxDecoration(
                          color: (_currentQuestion == index + 1) ? Colors.blue : Colors.white,
                          border: Border.all(color: Colors.grey.shade300),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Center(child: Text("${index + 1}")),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                    child: const Text("Submit", style: TextStyle(color: Colors.white, fontSize: 12)),
                  ),
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildOption(String label, String text) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: OutlinedButton(
        onPressed: () {},
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 15),
          side: BorderSide(color: Colors.grey.shade300),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        child: Row(
          children: [
            CircleAvatar(radius: 12, backgroundColor: Colors.blue.shade50, 
              child: Text(label, style: const TextStyle(fontSize: 12))),
            const SizedBox(width: 15),
            Text(text, style: const TextStyle(color: Colors.black87)),
          ],
        ),
      ),
    );
  }
}
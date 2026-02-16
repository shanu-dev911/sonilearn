import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class StateSelectionScreen extends StatelessWidget {
  final List<String> states = ["Bihar", "Jharkhand", "UP", "MP", "Delhi"];

  Future<void> _saveState(BuildContext context, String state) async {
    String uid = FirebaseAuth.instance.currentUser!.uid;
    await FirebaseFirestore.instance.collection('users').doc(uid).set({
      'selectedState': state,
      'lastUpdated': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true)); // Batch write logic for bulk users
    
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("$state Selected!")));
    // Dashboard redirection yahan aayega
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Choose Your State"), backgroundColor: Colors.blue),
      body: ListView.builder(
        itemCount: states.length,
        itemBuilder: (context, index) {
          return Card(
            margin: EdgeInsets.symmetric(horizontal: 15, vertical: 8),
            child: ListTile(
              title: Text(states[index], style: TextStyle(fontSize: 18)),
              trailing: Icon(Icons.arrow_forward_ios, size: 16),
              onTap: () => _saveState(context, states[index]),
            ),
          );
        },
      ),
    );
  }
}
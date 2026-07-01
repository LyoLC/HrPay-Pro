import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Example Function: Automatically set a timestamp when an employee is created
export const onEmployeeCreated = functions.firestore
  .document('funcionarios/{funcionarioId}')
  .onCreate((snap, context) => {
    const data = snap.data();
    return snap.ref.set({
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });

// Setup scheduled functions, push notifications, etc. here as needed

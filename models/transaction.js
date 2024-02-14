const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'transfer'], required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  description: { type: String }
},{timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = { Transaction };

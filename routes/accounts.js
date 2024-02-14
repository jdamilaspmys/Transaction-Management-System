const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { Account } = require('../models/account');
const { Transaction } = require('../models/transaction')
const { authenticateToken } = require('../middleware/authenticate');
const { successRes, serverErrorRes, notFoundRes, clientErrorRes } = require('../util/response');

// POST /accounts
/**
 * @openapi
 * /accounts:
 *   post:
 *     tags:
 *       - Accounts
 *     summary: Create a new account
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Account created successfully
 *       401:
 *         description: Unauthorized - Invalid token
 *       500:
 *         description: Internal server error
 */
router.post('/',authenticateToken, async (req, res) => {
  try {
    const { userId  } = req.user;

    const newAccount = new Account({
      userId,
    });

    await newAccount.save();

    successRes(res, newAccount)
  } catch (error) {
    console.error(error);
    serverErrorRes(res, { message: 'Internal server error' });
  }
});

// GET /accounts
/**
 * @openapi
 * /accounts:
 *   get:
 *     tags:
 *       - Accounts
 *     summary: Get all accounts
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns all accounts
 *       401:
 *         description: Unauthorized - Invalid token
 *       500:
 *         description: Internal server error
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    const accounts = await Account.find({ userId });

    successRes(res, accounts);
  } catch (error) {
    console.error(error);
    serverErrorRes(res, { message: 'Internal server error' });
  }
});

// POST /accounts/deposit
/**
 * @openapi
 * /accounts/{accountId}/deposit:
 *   post:
 *     tags:
 *       - Accounts
 *     summary: Deposit funds into account
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 100
 *     responses:
 *       200:
 *         description: Funds deposited successfully
 *       400:
 *         description: Invalid request payload
 *       401:
 *         description: Unauthorized - Invalid token
 *       500:
 *         description: Internal server error
 */
router.post('/:accountId/deposit', authenticateToken, [
    param('accountId').notEmpty().withMessage('Account ID is required').isMongoId().withMessage('Invalid account ID'),
    body('amount').isNumeric().withMessage('Amount must be a number').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0')
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return clientErrorRes(res, { message: errors.array() });
      }
  
      const { userId } = req.user;
      const { accountId } = req.params;
      const { amount } = req.body;
  
      const account = await Account.findOne({ _id: accountId, userId });
  
      if (!account) {
        return notFoundRes(res, { message: 'Account not found' });
      }
  
      account.balance += amount;
      await account.save();
  
      const transaction = new Transaction({
        userId,
        accountId: account._id,
        type: 'deposit',
        amount
      });
      await transaction.save();
  
      successRes(res, account);
    } catch (error) {
      console.error(error);
      serverErrorRes(res, { message: 'Internal server error' });
    }
  });


// POST /accounts/withdraw
/**
 * @openapi
 * /accounts/withdraw:
 *   post:
 *     tags:
 *       - Accounts
 *     summary: Withdraw funds from account
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 50
 *     responses:
 *       200:
 *         description: Funds withdrawn successfully
 *       400:
 *         description: Invalid request payload
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Account not found
 *       500:
 *         description: Internal server error
 */
router.post('/:accountId/withdraw', authenticateToken, [
    param('accountId').notEmpty().withMessage('Account ID is required').isMongoId().withMessage('Invalid account ID'),
    body('amount').isNumeric().withMessage('Amount must be a number').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0')
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return clientErrorRes(res, { message: errors.array() });
      }
  
      const { userId } = req.user;
      const { accountId } = req.params;
      const { amount } = req.body;
  
      const account = await Account.findOne({ _id: accountId, userId });
  
      if (!account) {
        return notFoundRes(res, { message: 'Account not found' });
      }
  
      if (account.balance < amount) {
        return clientErrorRes(res, { message: 'Insufficient funds' });
      }
  
      account.balance -= amount;
      await account.save();
  
      const transaction = new Transaction({
        userId,
        accountId: account._id,
        type: 'withdrawal',
        amount
      });
      await transaction.save();
  
      successRes(res, account);
    } catch (error) {
      console.error(error);
      serverErrorRes(res, { message: 'Internal server error' });
    }
  });

// POST /accounts/transfer
/**
 * @openapi
 * /accounts/transfer:
 *   post:
 *     tags:
 *       - Accounts
 *     summary: Transfer funds from one account to another
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiverAccountNumber:
 *                 type: string
 *                 example: "1234567890"
 *               amount:
 *                 type: number
 *                 example: 50
 *     responses:
 *       200:
 *         description: Funds transferred successfully
 *       400:
 *         description: Invalid request payload
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Account not found
 *       500:
 *         description: Internal server error
 */
router.post('/:accountId/transfer', authenticateToken, [
    param('accountId').notEmpty().withMessage('Account ID is required').isMongoId().withMessage('Invalid account ID'),
    body('receiverAccountId').isString().notEmpty().withMessage('Receiver account number is required'),
    body('amount').isNumeric().withMessage('Amount must be a number').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0')
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return clientErrorRes(res, { message: errors.array() });
      }
  
      const { userId } = req.user;
      const { accountId } = req.params;
      const { receiverAccountId, amount } = req.body;
  
      const senderAccount = await Account.findOne({ _id: accountId, userId });
      const receiverAccount = await Account.findOne({ _id: receiverAccountId });
  
      if (!senderAccount) {
        return notFoundRes(res, { message: 'Sender account not found' });
      }
  
      if (!receiverAccount) {
        return notFoundRes(res, { message: 'Receiver account not found' });
      }
  
      if (senderAccount.balance < amount) {
        return clientErrorRes(res, { message: 'Insufficient funds' });
      }
  
      senderAccount.balance -= amount;
      receiverAccount.balance += amount;
      await senderAccount.save();
      await receiverAccount.save();
  
      const senderTransaction = new Transaction({
        userId,
        accountId: senderAccount._id,
        type: 'transfer',
        amount: -amount
      });
      await senderTransaction.save();
  
      const receiverTransaction = new Transaction({
        userId: receiverAccount.userId,
        accountId: receiverAccount._id,
        type: 'transfer',
        amount
      });
      await receiverTransaction.save();
  
      successRes(res, { sender: senderAccount, receiver: receiverAccount});
    } catch (error) {
      console.error(error);
      serverErrorRes(res, { message: 'Internal server error' });
    }
  });


// GET /accounts/:accountId/transactions
/**
 * @openapi
 * /accounts/{accountId}/transactions:
 *   get:
 *     tags:
 *       - Accounts
 *     summary: Get transaction history for a specific account with optional filters
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the account to retrieve transactions for
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by transaction type (e.g., deposit, withdrawal, transfer)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering transactions (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering transactions (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Account not found
 *       500:
 *         description: Internal server error
 */
router.get('/:accountId/transactions', authenticateToken, [
    param('accountId').notEmpty().withMessage('Account ID is required').isMongoId().withMessage('Invalid account ID'),
    query('type').optional().isString().withMessage('Type must be a string'),
    query('startDate').optional().isISO8601().toDate().withMessage('Invalid startDate format (YYYY-MM-DD)'),
    query('endDate').optional().isISO8601().toDate().withMessage('Invalid endDate format (YYYY-MM-DD)')
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return clientErrorRes(res, { message: errors.array() });
      }
  
      const { userId } = req.user;
      const { accountId } = req.params;
      const { type, startDate, endDate } = req.query;
  

      const account = await Account.findOne({ _id: accountId, userId });
      if (!account) {
        return notFoundRes(res, { message: 'Account not found' });
      }
  
      const query = { accountId };
      if (type) query.type = type;
      if (startDate) query.createdAt = { $gte: startDate };
      if (endDate) {
        if (!query.createdAt) query.createdAt = {};
        query.createdAt.$lte = endDate;
      }
  
      const transactions = await Transaction.find(query);
  
      successRes(res, transactions );
    } catch (error) {
      console.error(error);
      serverErrorRes(res, { message: 'Internal server error' });
    }
  });

// GET /accounts/:accountId/balance
/**
 * @openapi
 * /accounts/{accountId}/balance:
 *   get:
 *     tags:
 *       - Accounts
 *     summary: Get account balance
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the account to retrieve the balance for
 *     responses:
 *       200:
 *         description: Account balance retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Account not found
 *       500:
 *         description: Internal server error
 */
router.get('/:accountId/balance', authenticateToken,[
    param('accountId').notEmpty().withMessage('Account ID is required').isMongoId().withMessage('Invalid account ID')
 ], async (req, res) => {
    try {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return clientErrorRes(res, { message: errors.array() });
    }

      const { accountId } = req.params;
      const { userId } = req.user;
  
      const account = await Account.findOne({ _id: accountId, userId });
  
      if (!account) {
        return notFoundRes(res, { message: 'Account not found' });
      }
  
      successRes(res, { balance: account.balance });
    } catch (error) {
      console.error(error);
      serverErrorRes(res, { message: 'Internal server error' });
    }
  });

module.exports = router;

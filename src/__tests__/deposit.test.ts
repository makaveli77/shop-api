import request from 'supertest';
import app from '../app';
import DepositService from '../services/deposit.service';
import jwt from 'jsonwebtoken';

jest.mock('../services/deposit.service');

const mockedDepositService = DepositService as jest.Mocked<typeof DepositService>;

describe('Deposit API Integration Tests', () => {
  let token: string;
  const SECRET = process.env.JWT_SECRET || 'secret';
  const mockUserId = 1;

  beforeAll(() => {
    token = jwt.sign({ id: mockUserId, username: 'user1' }, SECRET);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /deposits/initiate', () => {
    it('should return 400 if amount is invalid', async () => {
      const res = await request(app)
        .post('/deposits/initiate')
        .set('Authorization', "Bearer " + token)
        .send({ amount: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Amount must be greater than 0');
    });

    it('should return 200 and client_secret if successful', async () => {
      mockedDepositService.initiateDeposit.mockResolvedValueOnce({
        client_secret: 'pi_test_secret',
        deposit_request_id: 123
      });

      const res = await request(app)
        .post('/deposits/initiate')
        .set('Authorization', "Bearer " + token)
        .send({ amount: 50 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        client_secret: 'pi_test_secret',
        deposit_request_id: 123
      });
      expect(mockedDepositService.initiateDeposit).toHaveBeenCalledWith(mockUserId, 50);
    });
  });

  describe('POST /deposits/withdraw', () => {
    it('should return 400 if amount is invalid', async () => {
      const res = await request(app)
        .post('/deposits/withdraw')
        .set('Authorization', "Bearer " + token)
        .send({ amount: -10 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Amount must be greater than 0');
    });

    it('should return 200 and status if withdrawal is successful', async () => {
      mockedDepositService.withdraw.mockResolvedValueOnce({
        success: true,
        requested_amount: 20,
        withdrawn_amount: 20,
        status: 'completed',
        refunds: [{ provider_tx_id: 'mock_tx_id', amountDecducted: 20, refund_id: 're_mock_123' }]
      });

      const res = await request(app)
        .post('/deposits/withdraw')
        .set('Authorization', "Bearer " + token)
        .send({ amount: 20 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.withdrawn_amount).toBe(20);
      expect(mockedDepositService.withdraw).toHaveBeenCalledWith(mockUserId, 20);
    });
  });
});

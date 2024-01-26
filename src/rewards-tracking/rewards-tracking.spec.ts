import { Test } from '@nestjs/testing';

import { RewardsTrackingService } from './rewards-tracking.service';
import { EthersService } from '../ethers/ethers.service';
import { DbClientService } from '../db-client/db-client.service';
import { RewardsBalance } from '../db-client/types';
import {FetcherService} from "../fetcher/fetcher.service";
import {LoggerService} from "../logger/logger.service";

// Mock factories for services
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mockEthersService = () => ({
  fetchLastRewardsUpdateBlockNumber: jest.fn(),
  getBlockTimestamp: jest.fn(),
  rewardsBalanceOf: jest.fn(),
  fetchCashOutEventsFor: jest.fn(),
  fetchCompoundEventsFor: jest.fn(),
});
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mockDbClientService = () => ({
  fetchLastMonitoredBlock: jest.fn(),
  fetchRewardBalancesAtBlock: jest.fn(),
  fetchStakersList: jest.fn(),
  batchInsertRewardsBalance: jest.fn(),
  // Add other methods as needed...
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mockFetcherService = () => ({});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mockLoggerService = () => ({
  getChildLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    // Add other log levels as needed...
  }),
});

const testAddresses = [
  '0x21fec32480A900b3BcA71745DA6366D0775d2E9A',
  '0x2820A2b534eC948412699074389EDF8aab88aD30',
  '0x2819913F9a3e1f2D4C42711bca292742E2a32337',
];

describe('RewardsTrackingService', () => {
  let service: RewardsTrackingService;
  let ethersService;
  let dbClientService;
  let loggerService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RewardsTrackingService,
        { provide: EthersService, useFactory: mockEthersService },
        { provide: DbClientService, useFactory: mockDbClientService },
        { provide: LoggerService, useFactory: mockLoggerService },
        { provide: FetcherService, useFactory: mockFetcherService },
      ],
    }).compile();

    service = moduleRef.get<RewardsTrackingService>(RewardsTrackingService);
    ethersService = moduleRef.get<EthersService>(EthersService);
    dbClientService = moduleRef.get<DbClientService>(DbClientService);
    loggerService = moduleRef.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should exit early if rewards have already been tracked', async () => {
    // Setup mock responses
    dbClientService.fetchLastMonitoredBlock.mockResolvedValue(100);
    ethersService.fetchLastRewardsUpdateBlockNumber.mockResolvedValue(100);

    // Call the service method
    await service.trackRewards();

    // Assertions
    expect(loggerService.getChildLogger().info).toHaveBeenCalledWith(
      'Rewards have already been tracked for block 100',
    );
  });

  // Additional test cases

  // ... existing test setup ...

  it('should process rewards tracking for each staker', async () => {
    jest.spyOn(service as any, 'getAndSaveLyxePrice').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'fetchMerkleDistribution').mockResolvedValue([]);

    dbClientService.fetchLastMonitoredBlock.mockResolvedValue(99);
    ethersService.fetchLastRewardsUpdateBlockNumber.mockResolvedValue(100);
    ethersService.getBlockTimestamp.mockResolvedValue(1622548800); // Mock timestamp
    dbClientService.fetchRewardBalancesAtBlock.mockResolvedValue([]); // No previous balances
    dbClientService.fetchStakersList.mockResolvedValue(testAddresses); // No stakers

    ethersService.rewardsBalanceOf.mockResolvedValue(100n); // Mock rewards balance
    ethersService.fetchCashOutEventsFor.mockResolvedValue([]); // No cash out events
    ethersService.fetchCompoundEventsFor.mockResolvedValue([]); // No compound events

    await service.trackRewards();

    expect(ethersService.rewardsBalanceOf).toHaveBeenCalledTimes(3); // Assuming there are 3 stakers
    expect(dbClientService.batchInsertRewardsBalance).toHaveBeenCalledTimes(1);
  });

  describe('should calculate rewards balance changes correctly for one address with events', () => {
    it('1', async () => {
      jest.spyOn(service as any, 'getAndSaveLyxePrice').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'fetchMerkleDistribution').mockResolvedValue([]);

      const previousRewardsBalance = [
        {
          address: testAddresses[0],
          currentBalance: 50n,
          totalRewards: 150n,
        },
      ];

      dbClientService.fetchLastMonitoredBlock.mockResolvedValue(99);
      ethersService.fetchLastRewardsUpdateBlockNumber.mockResolvedValue(100);
      ethersService.getBlockTimestamp.mockResolvedValue(1622548800 * 1000); // Mock timestamp
      dbClientService.fetchRewardBalancesAtBlock.mockResolvedValue(previousRewardsBalance);
      dbClientService.fetchStakersList.mockResolvedValue(testAddresses); // No stakers

      ethersService.rewardsBalanceOf.mockResolvedValue(100n); // Mock rewards balance
      ethersService.fetchCashOutEventsFor.mockResolvedValue([]); // No cash out events
      ethersService.fetchCompoundEventsFor.mockResolvedValue([]); // No compound events

      await service.trackRewards();

      // Assuming a single staker for simplicity
      const expectedRewardsBalances: RewardsBalance[] = [
        {
          address: testAddresses[0],
          blockNumber: 100,
          blockDate: new Date(1622548800 * 1000),
          currentBalance: '100',
          balanceChange: '50',
          totalRewards: '200', // Previous total + balance change
        },
        {
          address: testAddresses[1],
          blockNumber: 100,
          blockDate: new Date(1622548800 * 1000),
          currentBalance: '100',
          balanceChange: '100',
          totalRewards: '100', // Previous total + balance change
        },
        {
          address: testAddresses[2],
          blockNumber: 100,
          blockDate: new Date(1622548800 * 1000),
          currentBalance: '100',
          balanceChange: '100',
          totalRewards: '100', // Previous total + balance change
        },
      ];

      expect(dbClientService.batchInsertRewardsBalance).toHaveBeenCalledWith(
        expectedRewardsBalances,
      );
    });

    it('2', async () => {
      jest.spyOn(service as any, 'getAndSaveLyxePrice').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'fetchMerkleDistribution').mockResolvedValue([]);

      const previousRewardsBalance = [
        {
          address: testAddresses[0],
          currentBalance: '50',
          totalRewards: '150',
        },
      ];

      dbClientService.fetchLastMonitoredBlock.mockResolvedValue(90);
      ethersService.fetchLastRewardsUpdateBlockNumber.mockResolvedValue(100);
      ethersService.getBlockTimestamp.mockResolvedValue(1622548800 * 1000); // Mock timestamp
      dbClientService.fetchRewardBalancesAtBlock.mockResolvedValue(previousRewardsBalance);
      dbClientService.fetchStakersList.mockResolvedValue([testAddresses[0]]); // No stakers

      ethersService.rewardsBalanceOf.mockResolvedValue(0n); // Mock rewards balance
      ethersService.fetchCashOutEventsFor.mockResolvedValue([
        {
          blockNumber: 105,
          args: {
            account: testAddresses[0],
            amount: 100n,
          },
        },
      ]); // No cash out events
      ethersService.fetchCompoundEventsFor.mockResolvedValue([
        {
          blockNumber: 95,
          args: {
            account: testAddresses[0],
            amount: 50n,
          },
        },
      ]); // No compound events

      await service.trackRewards();

      // Assuming a single staker for simplicity
      const expectedRewardsBalances: RewardsBalance[] = [
        {
          address: testAddresses[0],
          blockNumber: 100,
          blockDate: new Date(1622548800 * 1000),
          currentBalance: '100',
          balanceChange: '100',
          totalRewards: '250', // Previous total + balance change
        },
      ];

      expect(dbClientService.batchInsertRewardsBalance).toHaveBeenCalledWith(
        expectedRewardsBalances,
      );
    });

    it('3', async () => {
      jest.spyOn(service as any, 'getAndSaveLyxePrice').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'fetchMerkleDistribution').mockResolvedValue([]);

      const previousRewardsBalance = [
        {
          address: testAddresses[0],
          currentBalance: 50n,
          totalRewards: 150n,
        },
      ];

      dbClientService.fetchLastMonitoredBlock.mockResolvedValue(90);
      ethersService.fetchLastRewardsUpdateBlockNumber.mockResolvedValue(100);
      ethersService.getBlockTimestamp.mockResolvedValue(1622548800 * 1000); // Mock timestamp
      dbClientService.fetchRewardBalancesAtBlock.mockResolvedValue(previousRewardsBalance);
      dbClientService.fetchStakersList.mockResolvedValue([testAddresses[0]]); // No stakers

      ethersService.rewardsBalanceOf.mockResolvedValue(50n); // Mock rewards balance
      ethersService.fetchCashOutEventsFor.mockResolvedValue([
        {
          blockNumber: 105,
          args: {
            account: testAddresses[0],
            amount: 100n,
          },
        },
      ]); // No cash out events
      ethersService.fetchCompoundEventsFor.mockResolvedValue([]); // No compound events

      await service.trackRewards();

      // Assuming a single staker for simplicity
      const expectedRewardsBalances: RewardsBalance[] = [
        {
          address: testAddresses[0],
          blockNumber: 100,
          blockDate: new Date(1622548800 * 1000),
          currentBalance: '150',
          balanceChange: '100',
          totalRewards: '250', // Previous total + balance change
        },
      ];

      expect(dbClientService.batchInsertRewardsBalance).toHaveBeenCalledWith(
        expectedRewardsBalances,
      );
    });
  });
});

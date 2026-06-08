import { ChatService } from './chat.service';

describe('ChatService.getOrCreateChatRoom', () => {
  let chatService: ChatService;

  class MockChatRoom {
    user1Id?: number;
    user2Id?: number;
    isNew = true;
    static findOne = jest.fn();
    constructor(data: any) {
      Object.assign(this, data);
    }
    save = jest.fn(async () => {
      this.isNew = false;
      return this;
    });
  }

  const mockTemplateRepo: any = {};
  const mockChatMessageModel: any = {};
  const mockUserRepo: any = {};
  const mockFriendRepo: any = { findOne: jest.fn(), find: jest.fn() };
  const mockFriendshipRepo: any = { findOne: jest.fn() };
  const mockRedisService: any = { getMatched: jest.fn() };

  beforeEach(() => {
    MockChatRoom.findOne.mockReset();
    mockFriendRepo.findOne.mockReset();
    mockFriendRepo.find.mockReset();
    mockFriendshipRepo.findOne.mockReset();
    mockRedisService.getMatched.mockReset();

    chatService = new ChatService(
      MockChatRoom as any,
      mockChatMessageModel,
      mockTemplateRepo,
      mockUserRepo,
      mockFriendRepo,
      mockFriendshipRepo,
      mockRedisService,
    );
  });

  it('creates room when mutual friend exists', async () => {
    MockChatRoom.findOne.mockResolvedValue(null);
    mockFriendshipRepo.findOne.mockResolvedValue(null);
    mockFriendRepo.find.mockResolvedValue([{ id: 1 }]);
    mockRedisService.getMatched.mockResolvedValue(null);

    const room: any = await chatService.getOrCreateChatRoom(1, 2);

    expect(room).toBeTruthy();
    expect(room.user1Id).toBe(1);
    expect(room.user2Id).toBe(2);
  });

  it('creates room when matched pair exists', async () => {
    MockChatRoom.findOne.mockResolvedValue(null);
    mockFriendshipRepo.findOne.mockResolvedValue(null);
    mockFriendRepo.find.mockResolvedValue([]);
    // isMatchedPair calls getMatched twice; return match for first call
    mockRedisService.getMatched.mockResolvedValueOnce('2');

    const room: any = await chatService.getOrCreateChatRoom(1, 2);

    expect(room).toBeTruthy();
    expect(room.user1Id).toBe(1);
    expect(room.user2Id).toBe(2);
  });
});

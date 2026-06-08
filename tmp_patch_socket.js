const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'socket', 'socket.gateway.ts');
let text = fs.readFileSync(filePath, 'utf8');
const start = "@SubscribeMessage('send_friend_request')";
const end = '// =========================\n// FIND MATCH';
const idx = text.indexOf(start);
if (idx === -1) {
  throw new Error('start marker not found');
}
const idx2 = text.indexOf(end, idx);
if (idx2 === -1) {
  throw new Error('end marker not found');
}
const replacement = `@SubscribeMessage('send_friend_request')
async handleSendFriendRequest(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: any,
) {
  try {
    const fromUserId = Number(client.handshake.query.userId);
    const toUserId = Number(data.to);

    if (!fromUserId || !toUserId) {
      return {
        success: false,
        message: 'Invalid data',
      };
    }

    this.server.to(
      \\`user_${toUserId}\\`,
    ).emit('friend_request', {
      fromUserId,
    });

    this.server.to(
      \\`user_${toUserId}\\`,
    ).emit('friend_request_received', {
      fromUserId,
    });

    await this.sendFriendRequestPush(toUserId, fromUserId);

    return {
      success: true,
      message: 'Friend request notification sent',
    };
  } catch (error) {
    console.log('Send Friend Request Error:', error);
    return {
      success: false,
      message: 'Failed to notify user',
    };
  }
}

@SubscribeMessage('accept_friend_request')
async handleAcceptFriendRequest(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: any,
) {
  try {
    const acceptorId = Number(client.handshake.query.userId);
    const requesterId = Number(data.to);

    if (!acceptorId || !requesterId) {
      return {
        success: false,
        message: 'Invalid data',
      };
    }

    // =========================
    // REALTIME NOTIFICATION ONLY
    this.server.to(
      \\`user_${requesterId}\\`,
    ).emit('friend_request_accepted', {
      fromUserId: acceptorId,
    });

    await this.sendFriendAcceptedPush(requesterId, acceptorId);

    return {
      success: true,
      message: 'Friend request accepted notification sent',
    };
  } catch (error) {
    console.log('Accept Friend Request Error:', error);
    return {
      success: false,
      message: 'Failed to notify acceptance',
    };
  }
}
`;
text = text.slice(0, idx) + replacement + text.slice(idx2);
fs.writeFileSync(filePath, text, 'utf8');
console.log('patched');

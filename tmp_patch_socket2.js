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
const replacement = "@SubscribeMessage('send_friend_request')\n" +
  "async handleSendFriendRequest(\n" +
  "  @ConnectedSocket() client: Socket,\n" +
  "  @MessageBody() data: any,\n" +
  ") {\n" +
  "  try {\n" +
  "    const fromUserId = Number(client.handshake.query.userId);\n" +
  "    const toUserId = Number(data.to);\n\n" +
  "    if (!fromUserId || !toUserId) {\n" +
  "      return {\n" +
  "        success: false,\n" +
  "        message: 'Invalid data',\n" +
  "      };\n" +
  "    }\n\n" +
  "    this.server.to('user_' + toUserId).emit('friend_request', {\n" +
  "      fromUserId,\n" +
  "    });\n\n" +
  "    this.server.to('user_' + toUserId).emit('friend_request_received', {\n" +
  "      fromUserId,\n" +
  "    });\n\n" +
  "    await this.sendFriendRequestPush(toUserId, fromUserId);\n\n" +
  "    return {\n" +
  "      success: true,\n" +
  "      message: 'Friend request notification sent',\n" +
  "    };\n" +
  "  } catch (error) {\n" +
  "    console.log('Send Friend Request Error:', error);\n" +
  "    return {\n" +
  "      success: false,\n" +
  "      message: 'Failed to notify user',\n" +
  "    };\n" +
  "  }\n" +
  "}\n\n" +
  "@SubscribeMessage('accept_friend_request')\n" +
  "async handleAcceptFriendRequest(\n" +
  "  @ConnectedSocket() client: Socket,\n" +
  "  @MessageBody() data: any,\n" +
  ") {\n" +
  "  try {\n" +
  "    const acceptorId = Number(client.handshake.query.userId);\n" +
  "    const requesterId = Number(data.to);\n\n" +
  "    if (!acceptorId || !requesterId) {\n" +
  "      return {\n" +
  "        success: false,\n" +
  "        message: 'Invalid data',\n" +
  "      };\n" +
  "    }\n\n" +
  "    // =========================\n" +
  "    // REALTIME NOTIFICATION ONLY\n" +
  "    this.server.to('user_' + requesterId).emit('friend_request_accepted', {\n" +
  "      fromUserId: acceptorId,\n" +
  "    });\n\n" +
  "    await this.sendFriendAcceptedPush(requesterId, acceptorId);\n\n" +
  "    return {\n" +
  "      success: true,\n" +
  "      message: 'Friend request accepted notification sent',\n" +
  "    };\n" +
  "  } catch (error) {\n" +
  "    console.log('Accept Friend Request Error:', error);\n" +
  "    return {\n" +
  "      success: false,\n" +
  "      message: 'Failed to notify acceptance',\n" +
  "    };\n" +
  "  }\n" +
  "}\n";
text = text.slice(0, idx) + replacement + text.slice(idx2);
fs.writeFileSync(filePath, text, 'utf8');
console.log('patched');

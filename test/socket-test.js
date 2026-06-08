const io = require('socket.io-client');

const s1 = io('http://localhost:4000', { query: { userId: '1' }, transports: ['websocket'] });
const s2 = io('http://localhost:4000', { query: { userId: '2' }, transports: ['websocket'] });

s1.on('connect', () => console.log('s1 connected'));
s2.on('connect', () => console.log('s2 connected'));

s1.on('match_found', (data) => {
  console.log('s1 match_found', data);
  s1.emit('call_connected', { roomName: data.roomName, userId: '1', matchedUserId: '2' });
});

s2.on('match_found', (data) => {
  console.log('s2 match_found', data);
  s2.emit('call_connected', { roomName: data.roomName, userId: '2', matchedUserId: '1' });
});

s1.on('message', (m) => console.log('s1 message', m));
s2.on('message', (m) => console.log('s2 message', m));

s1.on('connected', (d) => console.log('s1 connected event', d));
s2.on('connected', (d) => console.log('s2 connected event', d));

setTimeout(() => {
  console.log('Emitting find_match from both clients');
  s1.emit('find_match');
  s2.emit('find_match');
}, 2000);

setTimeout(() => {
  // send a predefined message from s1 to s2 (must be in PREDEFINED_MESSAGES)
  s1.emit('message', { toUserId: 2, text: 'Hello!' });
}, 8000);

setTimeout(() => {
  console.log('Closing clients');
  s1.close();
  s2.close();
}, 20000);

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { NotificationsService } = require('./dist/notifications/notifications.service');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const notificationsService = app.get(NotificationsService);
  
  const notif = await notificationsService.create({
    senderId: 1,
    receiverId: 2,
    type: 'test',
    title: 'test',
    message: 'test message'
  });
  console.log('Saved notification:', notif);
  
  await app.close();
}
bootstrap();

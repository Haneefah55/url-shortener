import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common'
import cookieParser from 'cookie-parser';
import 'dotenv/config'

async function bootstrap() {
	
 const app = await NestFactory.create(AppModule);

	const port = process.env.PORT!
	
	  
  app.setGlobalPrefix("api")
	app.enableCors()
  app.use(cookieParser())

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    exceptionFactory: (errors: any) => {
      const messages = errors.map((err: any) =>
        Object.values(err.constraints || {}).join(', '),
      );
      return new BadRequestException({
        statusCode: 400,
        error: 'Invalid Payload',
        message: messages,
      });
    },
  }),
);


  
	//const eventQueue = app.get('URL_QUEUE');
  //await eventQueue.connect();
  await app.listen(port ?? 3000);
	console.log(`Url service is listening on port ${port}`)
}

bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe} from '@nestjs/common'
import cookieParser from 'cookie-parser';
import 'dotenv/config'

async function bootstrap() {
	
 const app = await NestFactory.create(AppModule);

	const port = process.env.PORT!
	
	app.setGlobalPrefix("api")
	app.enableCors()
  app.use(cookieParser())
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
  
	//const eventQueue = app.get('URL_QUEUE');
  //await eventQueue.connect();
  await app.listen(port ?? 3000);
	console.log(`Url service is listening on port ${port}`)
}

bootstrap();
